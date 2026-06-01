import 'dart:async';
import 'dart:io';
import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:city_water_flutter/services/billing_service.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image/image.dart' as img;
import 'package:permission_handler/permission_handler.dart';

class MeterScanScreen extends StatefulWidget {
  const MeterScanScreen({super.key});

  @override
  State<MeterScanScreen> createState() => _MeterScanScreenState();
}

class _MeterScanScreenState extends State<MeterScanScreen>
    with SingleTickerProviderStateMixin {
  // ── Scan region constraints ──────────────────────────────────────────────
  static const double _minRegionWidth = 0.40;
  static const double _minRegionHeight = 0.20;

  // ── Auto‑capture thresholds ──────────────────────────────────────────────
  static const double _sharpnessThreshold = 0.8;  // lowered: LCD digits have subtle gradients
  static const double _stabilityThreshold = 20.0; // relaxed: minor hand motion is ok
  static const double _brightnessMin = 10.0;       // relaxed: allow dim environments
  static const double _brightnessMax = 250.0;
  static const double _qualityPassScore = 0.05;   // very relaxed: don't block valid OCR results
  static const int _minFramesBeforeCapture = 2;   // fewer frames needed before attempting capture

  CameraController? _cameraController;
  late AnimationController _pulseController;

  final TextRecognizer _textRecognizer = TextRecognizer(
    script: TextRecognitionScript.latin,
  );

  bool _isCameraReady = false;
  bool _isProcessing = false;
  bool _isSubmitting = false;
  bool _autoCaptureEnabled = true;
  bool _captured = false;
  bool _imageStreamRunning = false;
  bool _autoCaptureTriggered = false;
  bool _isLoadingBilling = true;
  bool _showResultCard = false;

  String _extractedMeterNumber = '';
  String _extractedMeterReading = '';
  String _rawText = '';
  String _confidence = 'low';

  String? _cameraError;
  String? _qualityMessage;
  String? _billingLoadError;
  String _linkedMeterNumber = '';
  String _customerName = '';
  BillingCustomerType _selectedCustomerType = BillingCustomerType.residential;

  BillingBill? _currentBill;

  Rect _scanRegion = const Rect.fromLTWH(0.05, 0.15, 0.90, 0.55);

  double _latestSharpness = 0;
  double _latestBrightness = 0;

  final List<_FrameStats> _recentFrameStats = [];
  List<Rect> _detectedDigitBoxes = [];

  int _captureCounter = 0;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _initializeCamera();
    _loadBillingContext();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _cameraController?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  // ── Billing context ──────────────────────────────────────────────────────

  Future<void> _loadBillingContext() async {
    try {
      final profile = await BillingService.loadLinkedProfile();
      final currentBill = await BillingService.loadCurrentBill();
      final selectedCustomerType =
          await BillingService.loadSelectedCustomerType();
      if (!mounted) return;
      setState(() {
        _linkedMeterNumber = profile.meterNumber;
        _customerName = profile.fullName;
        _selectedCustomerType = selectedCustomerType;
        _currentBill = currentBill;
        _isLoadingBilling = false;
      });
      if (currentBill != null) await _stopImageStream();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _billingLoadError = error.toString().replaceFirst('Exception: ', '');
        _isLoadingBilling = false;
      });
    }
  }

  // ── Camera ───────────────────────────────────────────────────────────────

  Future<void> _initializeCamera() async {
    final status = await Permission.camera.request();
    if (!status.isGranted) {
      if (!mounted) return;
      setState(() => _cameraError =
          'Camera permission is required to scan the meter.');
      return;
    }
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() => _cameraError = 'No camera found on this device.');
        return;
      }
      final selectedCamera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      _cameraController = CameraController(
        selectedCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );
      await _cameraController!.initialize();
      await _cameraController!.setFocusMode(FocusMode.auto);
      await _cameraController!.setExposureMode(ExposureMode.auto);
      await _cameraController!.setFlashMode(FlashMode.off);
      if (!mounted) return;
      setState(() => _isCameraReady = true);
      if (_currentBill == null) _startImageStream();
    } catch (e) {
      if (!mounted) return;
      setState(() => _cameraError = 'Failed to initialize camera: $e');
    }
  }

  Future<void> _startImageStream() async {
    if (_cameraController == null ||
        !_isCameraReady ||
        _imageStreamRunning ||
        _currentBill != null) return;
    try {
      await _cameraController!.startImageStream((CameraImage image) {
        if (!_autoCaptureEnabled ||
            _captured ||
            _isProcessing ||
            _currentBill != null) return;

        final stats = _computeFrameStats(image);
        _latestBrightness = stats.brightness;
        _latestSharpness = stats.sharpness;
        _recentFrameStats.add(stats);
        if (_recentFrameStats.length > 12) _recentFrameStats.removeAt(0);

        if (_shouldAutoCapture() && !_autoCaptureTriggered) {
          _autoCaptureTriggered = true;
          unawaited(_captureAndProcess(autoTriggered: true));
        }
        if (mounted) setState(() {});
      });
      _imageStreamRunning = true;
    } catch (_) {
      _imageStreamRunning = false;
    }
  }

  Future<void> _stopImageStream() async {
    if (_cameraController == null || !_imageStreamRunning) return;
    try {
      await _cameraController!.stopImageStream();
    } catch (_) {}
    _imageStreamRunning = false;
  }

  // ── Frame quality ────────────────────────────────────────────────────────

  _FrameStats _computeFrameStats(CameraImage image) {
    final bytes = image.planes.first.bytes;
    if (bytes.isEmpty) return const _FrameStats(brightness: 0, sharpness: 0);

    double brightnessSum = 0;
    double gradientSum = 0;
    for (var i = 1; i < bytes.length; i += 4) {
      final cur = bytes[i].toDouble();
      final prev = bytes[i - 1].toDouble();
      brightnessSum += cur;
      gradientSum += (cur - prev).abs();
    }
    final n = math.max(1, (bytes.length / 4).floor());
    return _FrameStats(
      brightness: brightnessSum / n,
      sharpness: gradientSum / n,
    );
  }

  bool _shouldAutoCapture() {
    if (_recentFrameStats.length < _minFramesBeforeCapture) return false;

    final sharpnessValues = _recentFrameStats.map((e) => e.sharpness).toList();
    final brightnessValues = _recentFrameStats.map((e) => e.brightness).toList();

    final avgSharpness =
        sharpnessValues.reduce((a, b) => a + b) / sharpnessValues.length;
    final avgBrightness =
        brightnessValues.reduce((a, b) => a + b) / brightnessValues.length;

    double variance = 0;
    for (final v in sharpnessValues) {
      variance += (v - avgSharpness) * (v - avgSharpness);
    }
    final stdDev = math.sqrt(variance / sharpnessValues.length);

    final isSharp = avgSharpness > _sharpnessThreshold;
    final isStable = stdDev < _stabilityThreshold;
    final brightnessOk =
        avgBrightness > _brightnessMin && avgBrightness < _brightnessMax;

    return isSharp && isStable && brightnessOk;
  }

  double _qualityScore() {
    final sharpnessScore = (_latestSharpness / 10).clamp(0.0, 1.0);
    final brightnessDistance = (_latestBrightness - 128).abs();
    final brightnessScore = (1 - (brightnessDistance / 128)).clamp(0.0, 1.0);
    return (sharpnessScore * 0.65) + (brightnessScore * 0.35);
  }

  // ── Safe image pre-processing (only grayscale + contrast) ───────────────
  // ── Image pre-processing: try 3 variants, merge best OCR results ─────────
  //
  // AQUAFLOW meter has TWO zones with OPPOSITE contrast polarity:
  //   MTR label  → black text on WHITE background  (normal)
  //   Digit panel → yellow/green digits on DARK background  (inverted)
  //
  // We process the image 3 ways and let _captureAndProcess pick the best.
  Future<_ProcessedImageData> _preProcessImage(
    String sourcePath, {
    _PreProcessMode mode = _PreProcessMode.normal,
  }) async {
    final bytes = await File(sourcePath).readAsBytes();
    final original = img.decodeImage(bytes);
    if (original == null) {
      return _ProcessedImageData(path: sourcePath, width: 1000, height: 1000);
    }

    final crop = _normalizedRegionToImageRect(
      _scanRegion,
      original.width,
      original.height,
    );

    final cropped = img.copyCrop(
      original,
      x: crop.left.round(),
      y: crop.top.round(),
      width: crop.width.round(),
      height: crop.height.round(),
    );

    final grayscale = img.grayscale(cropped);
    final enhanced = mode == _PreProcessMode.inverted
        ? img.adjustColor(img.invert(grayscale), contrast: 160)
        : img.adjustColor(grayscale, contrast: 130);

    final suffix = mode == _PreProcessMode.inverted
        ? 'inv'
        : 'norm';
    final outputPath =
        '${Directory.systemTemp.path}${Platform.pathSeparator}'
        'meter_scan_${DateTime.now().millisecondsSinceEpoch}_${_captureCounter}_$suffix.jpg';
    await File(outputPath).writeAsBytes(img.encodeJpg(enhanced, quality: 92));

    return _ProcessedImageData(
      path: outputPath,
      width: enhanced.width,
      height: enhanced.height,
    );
  }

  // ── OCR extraction (line‑aware, merges spaced digits) ───────────────────

  _ExtractedScanResult _extractDigits(
    RecognizedText recognizedText,
    int imageWidth,
    int imageHeight,
  ) {
    final lines = <_TextLine>[];

    String applySubstitutions(String value, {required bool forMeter}) {
      final buffer = StringBuffer();
      for (final rune in value.runes) {
        final char = String.fromCharCode(rune);
        switch (char) {
          case 'O':
          case 'o':
            buffer.write('0');
            break;
          case 'I':
          case 'l':
            buffer.write('1');
            break;
          case 'S':
            buffer.write(forMeter ? 'S' : '5');
            break;
          case 'B':
            buffer.write(forMeter ? 'B' : '8');
            break;
          case 'G':
            buffer.write(forMeter ? 'G' : '6');
            break;
          case 'Z':
            buffer.write(forMeter ? 'Z' : '2');
            break;
          default:
            buffer.write(char);
        }
      }
      return buffer.toString();
    }

    Rect normalizeBox(dynamic line) {
      final box = line.boundingBox as Rect;
      return _normalizedRect(box, imageWidth, imageHeight);
    }

    for (final block in recognizedText.blocks) {
      for (final line in block.lines) {
        final text = line.text.trim();
        if (text.isEmpty) continue;
        lines.add(_TextLine(text: text, boundingBox: line.boundingBox));
      }
    }

    lines.sort((left, right) {
      final topCompare = left.boundingBox.top.compareTo(right.boundingBox.top);
      if (topCompare != 0) return topCompare;
      return left.boundingBox.left.compareTo(right.boundingBox.left);
    });

    String meterNumber = '';
    String meterReading = '';
    final digitBoxes = <Rect>[];

    for (var index = 0; index < lines.length; index += 1) {
      final line = lines[index];
      final normalizedLine = applySubstitutions(line.text, forMeter: true)
          .replaceAll(RegExp(r'[^A-Z0-9\- ]'), ' ')
          .replaceAll(RegExp(r'\s+'), ' ')
          .trim();
      final meterMatch = RegExp(r'MTR\s*-?\s*(\d+)').firstMatch(normalizedLine);
      if (meterMatch == null) {
        continue;
      }

      meterNumber = 'MTR-${meterMatch.group(1)!}';
      digitBoxes.add(normalizeBox(line));

      if (index + 1 < lines.length) {
        final readingLine = lines[index + 1];
        final normalizedReading = applySubstitutions(readingLine.text, forMeter: false);
        final digitsOnly = normalizedReading.replaceAll(RegExp(r'[^0-9]'), '');
        if (digitsOnly.isNotEmpty) {
          meterReading = digitsOnly.length >= 5 ? digitsOnly.substring(0, 5) : digitsOnly;
          digitBoxes.add(normalizeBox(readingLine));
        }
      }
      break;
    }

    final bothValid = _isValidMeterNumber(meterNumber) && _isValidMeterReading(meterReading);
    return _ExtractedScanResult(
      meterNumber: meterNumber,
      meterReading: meterReading,
      confidence: bothValid ? 'high' : 'low',
      digitBoxes: digitBoxes,
      rawText: recognizedText.text,
    );
  }

  Rect _mergeBoundingBoxes(List<Rect> boxes) {
    if (boxes.isEmpty) return Rect.zero;
    double left = boxes.first.left;
    double top = boxes.first.top;
    double right = boxes.first.right;
    double bottom = boxes.first.bottom;
    for (final box in boxes) {
      left = math.min(left, box.left);
      top = math.min(top, box.top);
      right = math.max(right, box.right);
      bottom = math.max(bottom, box.bottom);
    }
    return Rect.fromLTRB(left, top, right, bottom);
  }

  Rect _normalizedRect(Rect absolute, int imageWidth, int imageHeight) {
    return Rect.fromLTWH(
      absolute.left / imageWidth,
      absolute.top / imageHeight,
      absolute.width / imageWidth,
      absolute.height / imageHeight,
    );
  }

  bool _isValidMeterNumber(String value) =>
      RegExp(r'^MTR-\d{4,8}$').hasMatch(value.trim().toUpperCase());

  bool _isValidMeterReading(String value) =>
      RegExp(r'^\d+$').hasMatch(value.trim());

  // ── Capture & process ────────────────────────────────────────────────────

  Future<void> _captureAndProcess({required bool autoTriggered}) async {
    if (_isProcessing ||
        _cameraController == null ||
        !_isCameraReady ||
        _currentBill != null) return;

    setState(() {
      _showResultCard = false;
      _isProcessing = true;
      _qualityMessage = null;
    });

    try {
      await _stopImageStream();
      final picture = await _cameraController!.takePicture();

      // ── Run OCR on all 3 preprocessing variants and merge best results ──
      // This is critical for AQUAFLOW meters: the MTR label and digit panel
      // have OPPOSITE contrast polarity, so no single pass captures both.
      final results = <_ExtractedScanResult>[];
      for (final mode in _PreProcessMode.values) {
        try {
          final processed = await _preProcessImage(picture.path, mode: mode);
          final inputImage = InputImage.fromFilePath(processed.path);
          final recognizedText = await _textRecognizer.processImage(inputImage);
          results.add(_extractDigits(recognizedText, processed.width, processed.height));
        } catch (_) {}
      }

      // Merge: pick the best meter number and best meter reading across all runs
      String bestMeterNumber = '';
      String bestMeterReading = '';
      List<Rect> bestDigitBoxes = [];
      String bestRawText = '';

      for (final r in results) {
        if (bestMeterNumber.isEmpty && _isValidMeterNumber(r.meterNumber)) {
          bestMeterNumber = r.meterNumber;
          bestDigitBoxes = r.digitBoxes;
          bestRawText = r.rawText;
        }
        if (bestMeterReading.isEmpty && _isValidMeterReading(r.meterReading) && r.meterReading.isNotEmpty) {
          bestMeterReading = r.meterReading;
        }
      }
      // If we still have nothing, fall back to whatever was found
      if (bestMeterNumber.isEmpty || bestMeterReading.isEmpty) {
        for (final r in results) {
          if (bestMeterNumber.isEmpty && r.meterNumber.isNotEmpty) bestMeterNumber = r.meterNumber;
          if (bestMeterReading.isEmpty && r.meterReading.isNotEmpty) bestMeterReading = r.meterReading;
          if (bestRawText.isEmpty) bestRawText = r.rawText;
        }
      }

      final extracted = _ExtractedScanResult(
        meterNumber: bestMeterNumber,
        meterReading: bestMeterReading,
        confidence: (_isValidMeterNumber(bestMeterNumber) && _isValidMeterReading(bestMeterReading) && bestMeterReading.isNotEmpty)
            ? 'high'
            : 'low',
        digitBoxes: bestDigitBoxes,
        rawText: bestRawText,
      );

      // Valid = both fields extracted; confidence is separate indicator shown in UI
      final isValid = _isValidMeterNumber(extracted.meterNumber) &&
          _isValidMeterReading(extracted.meterReading);

      if (!mounted) return;

      setState(() {
        _captured = true;
        _autoCaptureEnabled = false;
        _rawText = extracted.rawText;
        _detectedDigitBoxes = extracted.digitBoxes;
        _confidence = extracted.confidence;
        _extractedMeterNumber = extracted.meterNumber;
        _extractedMeterReading = extracted.meterReading;
        _showResultCard = true;
        _qualityMessage = isValid
            ? null
            : 'Digits may be unclear. Review below or rescan.';
      });

      if (_extractedMeterNumber.isEmpty && _extractedMeterReading.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
                'No digits found. Try adjusting the scan box or lighting.'),
          ),
        );
      } else if (!isValid) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text('Digits may be unclear – please review or rescan.'),
          ),
        );
      }
    } catch (error) {
      debugPrint('OCR Error: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to scan meter: $error'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _rescan() async {
    if (_currentBill != null) return;
    setState(() {
      _autoCaptureTriggered = false;
      _captured = false;
      _autoCaptureEnabled = true;
      _confidence = 'low';
      _rawText = '';
      _detectedDigitBoxes = [];
      _qualityMessage = null;
      _extractedMeterNumber = '';
      _extractedMeterReading = '';
      _showResultCard = false;
    });
    await _startImageStream();
  }

  // ── Bill generation ──────────────────────────────────────────────────────

  Future<void> _generateBill() async {
    if (_currentBill != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
              'A bill already exists for this month. Please pay it first.'),
        ),
      );
      return;
    }

    if (!_isValidMeterNumber(_extractedMeterNumber) ||
        !_isValidMeterReading(_extractedMeterReading)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
              'No valid reading extracted. Please scan the meter first.'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final bill = await BillingService.submitReading(
        meterNumber: BillingService.normalizeMeterNumber(_extractedMeterNumber),
        readingValue: int.parse(_extractedMeterReading),
        previousReadingValue: 0,
        source: _confidence == 'high'
            ? BillingSubmissionSource.ocr
            : BillingSubmissionSource.manual,
      );

      if (!mounted) return;

      setState(() {
        _currentBill = bill;
        _qualityMessage = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
              'Bill generated for ${bill.cycleKey}. Continue payment from the Bill section.'),
        ),
      );

      _closeWithResult();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _closeWithResult() {
    final b = _currentBill;
    Navigator.of(context).pop(<String, String>{
      'meter_number': b?.meterNumber ?? _extractedMeterNumber,
      'meter_reading': b?.readingValue.toString() ?? _extractedMeterReading,
      'billing_cycle': b?.cycleKey ?? BillingService.currentCycleKey(),
      'bill_amount': b?.amountDue.toStringAsFixed(2) ?? '',
      'payment_status': b?.paymentStatus ?? 'UNPAID',
      'payment_reference': b?.paymentReference ?? '',
    });
  }

  // ── Scan region helpers ──────────────────────────────────────────────────

  Rect _normalizedRegionToImageRect(
    Rect normalized, int imageWidth, int imageHeight,
  ) {
    final left =
        (normalized.left * imageWidth).clamp(0.0, imageWidth - 2.0);
    final top =
        (normalized.top * imageHeight).clamp(0.0, imageHeight - 2.0);
    final width = (normalized.width * imageWidth).clamp(2.0, imageWidth - left);
    final height =
        (normalized.height * imageHeight).clamp(2.0, imageHeight - top);
    return Rect.fromLTWH(left, top, width, height);
  }

  void _moveRegion(Offset delta, Size previewSize) {
    final dx = delta.dx / previewSize.width;
    final dy = delta.dy / previewSize.height;
    setState(() {
      _scanRegion = Rect.fromLTWH(
        (_scanRegion.left + dx).clamp(0.0, 1.0 - _scanRegion.width),
        (_scanRegion.top + dy).clamp(0.0, 1.0 - _scanRegion.height),
        _scanRegion.width,
        _scanRegion.height,
      );
    });
  }

  void _resizeRegion(Offset delta, Size previewSize) {
    final dw = delta.dx / previewSize.width;
    final dh = delta.dy / previewSize.height;
    setState(() {
      var w = (_scanRegion.width + dw).clamp(_minRegionWidth, 0.92);
      var h = (_scanRegion.height + dh).clamp(_minRegionHeight, 0.55);
      var l = _scanRegion.left;
      var t = _scanRegion.top;
      if (l + w > 1) l = 1 - w;
      if (t + h > 1) t = 1 - h;
      _scanRegion = Rect.fromLTWH(l, t, w, h);
    });
  }

  // ── UI components ────────────────────────────────────────────────────────

  Widget _buildScanOverlay(Size previewSize) {
    final left = previewSize.width * _scanRegion.left;
    final top = previewSize.height * _scanRegion.top;
    final width = previewSize.width * _scanRegion.width;
    final height = previewSize.height * _scanRegion.height;
    final scanRect = Rect.fromLTWH(left, top, width, height);

    return Stack(
      children: [
        // Darkened overlay
        Positioned.fill(
          child: IgnorePointer(
            child: CustomPaint(
              painter: _OverlayPainter(scanRect: scanRect),
            ),
          ),
        ),
        // Draggable/resizable scan box
        Positioned(
          left: left,
          top: top,
          width: width,
          height: height,
          child: GestureDetector(
            onPanUpdate: (d) => _moveRegion(d.delta, previewSize),
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (_, __) {
                final borderColor = _captured
                    ? const Color(0xFF22C55E)
                    : Color.lerp(
                        const Color(0xFF22C55E),
                        const Color(0xFF86EFAC),
                        _pulseController.value,
                      )!;
                return Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: borderColor, width: 2.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Stack(
                    children: [
                      ..._buildCornerAccents(width, height, borderColor),
                      if (_detectedDigitBoxes.isNotEmpty)
                        Positioned.fill(
                          child: CustomPaint(
                            painter:
                                _DigitBoxPainter(boxes: _detectedDigitBoxes),
                          ),
                        ),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: GestureDetector(
                          onPanUpdate: (d) => _resizeRegion(d.delta, previewSize),
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: const BoxDecoration(
                              color: Color(0xFF22C55E),
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(8),
                                bottomRight: Radius.circular(8),
                              ),
                            ),
                            child: const Icon(
                              Icons.open_in_full,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        // Hint text above box
        if (!_captured)
          Positioned(
            left: left,
            top: math.max(0, top - 26),
            width: width,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Align meter digits inside the box',
                  style: TextStyle(color: Colors.white, fontSize: 11),
                ),
              ),
            ),
          ),
      ],
    );
  }

  List<Widget> _buildCornerAccents(double w, double h, Color color) {
    const size = 16.0;
    const thick = 3.0;

    Widget corner(AlignmentGeometry align, BorderRadius br) => Positioned.fill(
          child: Align(
            alignment: align,
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                border: Border(
                  top: br == BorderRadius.only(topLeft: const Radius.circular(4)) ||
                          br == BorderRadius.only(topRight: const Radius.circular(4))
                      ? BorderSide(color: color, width: thick)
                      : BorderSide.none,
                  bottom: br == BorderRadius.only(bottomLeft: const Radius.circular(4)) ||
                          br == BorderRadius.only(bottomRight: const Radius.circular(4))
                      ? BorderSide(color: color, width: thick)
                      : BorderSide.none,
                  left: br == BorderRadius.only(topLeft: const Radius.circular(4)) ||
                          br == BorderRadius.only(bottomLeft: const Radius.circular(4))
                      ? BorderSide(color: color, width: thick)
                      : BorderSide.none,
                  right: br == BorderRadius.only(topRight: const Radius.circular(4)) ||
                          br == BorderRadius.only(bottomRight: const Radius.circular(4))
                      ? BorderSide(color: color, width: thick)
                      : BorderSide.none,
                ),
              ),
            ),
          ),
        );

    return [
      corner(Alignment.topLeft,
          BorderRadius.only(topLeft: const Radius.circular(4))),
      corner(Alignment.topRight,
          BorderRadius.only(topRight: const Radius.circular(4))),
      corner(Alignment.bottomLeft,
          BorderRadius.only(bottomLeft: const Radius.circular(4))),
      corner(Alignment.bottomRight,
          BorderRadius.only(bottomRight: const Radius.circular(4))),
    ];
  }

  Widget _buildQualityBar() {
    final score = _qualityScore().clamp(0.0, 1.0);
    final isGood = score >= _qualityPassScore;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(
            isGood ? Icons.check_circle : Icons.radio_button_unchecked,
            color: isGood ? const Color(0xFF22C55E) : Colors.white54,
            size: 14,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: score,
                minHeight: 5,
                backgroundColor: Colors.white12,
                color: isGood ? const Color(0xFF22C55E) : Colors.orangeAccent,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            isGood ? 'Good' : 'Adjusting…',
            style: TextStyle(
              color: isGood ? const Color(0xFF22C55E) : Colors.white54,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCaptureButton() {
    return Positioned(
      bottom: 100,
      left: 0,
      right: 0,
      child: Center(
        child: FloatingActionButton(
          heroTag: 'capture',
          onPressed: (_isProcessing || _currentBill != null)
              ? null
              : () => _captureAndProcess(autoTriggered: false),
          backgroundColor: Colors.white,
          child: const Icon(Icons.camera_alt, color: Colors.black, size: 28),
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    final hasBill = _currentBill != null;
    final hasValidScan = _extractedMeterNumber.isNotEmpty &&
        _extractedMeterReading.isNotEmpty;
    final canGenerate = hasValidScan && !hasBill;

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 24),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.90),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 12, top: 4),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                const Icon(Icons.receipt_long, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hasBill
                        ? 'Bill Generated'
                        : (hasValidScan ? 'Reading Captured' : 'Scan Result'),
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              hasBill
                  ? 'Go to the Bill section to complete payment.'
                  : 'Review the extracted values below.',
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
            if (_qualityMessage != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.orange.shade400),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        color: Colors.orangeAccent, size: 15),
                    const SizedBox(width: 8),
                    Expanded(
                        child: Text(_qualityMessage!,
                            style: const TextStyle(
                                color: Colors.white, fontSize: 12))),
                  ],
                ),
              ),
            ],
            if (!hasBill) ...[
              const SizedBox(height: 12),
              _buildReadOnlyField(
                  label: 'METER NUMBER',
                  value: _extractedMeterNumber,
                  icon: Icons.tag),
              const SizedBox(height: 8),
              _buildReadOnlyField(
                  label: 'METER READING',
                  value: _extractedMeterReading,
                  icon: Icons.speed_outlined),
              const SizedBox(height: 8),
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _confidence == 'high'
                          ? const Color(0xFF22C55E).withValues(alpha: 0.13)
                          : Colors.orange.withValues(alpha: 0.13),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: _confidence == 'high'
                            ? const Color(0xFF22C55E).withValues(alpha: 0.5)
                            : Colors.orange.withValues(alpha: 0.5),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _confidence == 'high'
                              ? Icons.verified_outlined
                              : Icons.info_outline,
                          size: 12,
                          color: _confidence == 'high'
                              ? const Color(0xFF22C55E)
                              : Colors.orangeAccent,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Confidence: ${_confidence.toUpperCase()}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _confidence == 'high'
                                ? const Color(0xFF22C55E)
                                : Colors.orangeAccent,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ] else ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white12),
                ),
                child: const Text(
                  'A bill already exists for this cycle. Open the Bill section to view details and complete payment.',
                  style: TextStyle(color: Colors.white60, height: 1.4),
                ),
              ),
            ],
            const SizedBox(height: 14),
            if (!hasBill) ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isProcessing ? null : _rescan,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('Rescan'),
                      style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white30)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: (canGenerate && !_isSubmitting) ? _generateBill : null,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 15,
                        height: 15,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.receipt_long, size: 16),
                label: const Text('Generate Bill'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(46),
                  backgroundColor:
                      canGenerate ? const Color(0xFF22C55E) : null,
                  foregroundColor: Colors.white,
                ),
              ),
            ] else ...[
              ElevatedButton.icon(
                onPressed: _closeWithResult,
                icon: const Icon(Icons.check_circle_outline, size: 16),
                label: const Text('Back to Bill Section'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(46),
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildReadOnlyField({
    required String label,
    required String value,
    required IconData icon,
  }) {
    final hasValue = value.isNotEmpty;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasValue
              ? const Color(0xFF22C55E).withValues(alpha: 0.55)
              : Colors.white.withValues(alpha: 0.12),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white54, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        letterSpacing: 0.6)),
                const SizedBox(height: 2),
                Text(
                  hasValue ? value : '—',
                  style: TextStyle(
                    color: hasValue ? Colors.white : Colors.white30,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
          if (hasValue)
            const Icon(Icons.check_circle, color: Color(0xFF22C55E), size: 16),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_cameraError != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Water Meter Scanner'), centerTitle: true),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(_cameraError!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16)),
          ),
        ),
      );
    }

    if (!_isCameraReady || _cameraController == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Water Meter Scanner'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          Positioned.fill(child: CameraPreview(_cameraController!)),
          Positioned.fill(
            child: LayoutBuilder(builder: (context, constraints) {
              final previewSize =
                  Size(constraints.maxWidth, constraints.maxHeight);
              return _buildScanOverlay(previewSize);
            }),
          ),
          if (!_captured)
            Positioned(
              top: MediaQuery.of(context).size.height *
                      (_scanRegion.top + _scanRegion.height) +
                  8,
              left: 0,
              right: 0,
              child: _buildQualityBar(),
            ),
          if (!_captured && !_showResultCard) _buildCaptureButton(),
          if (_isProcessing)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.40),
                child: const Center(
                    child:
                        CircularProgressIndicator(color: Colors.white)),
              ),
            ),
          if (_showResultCard) _buildResultCard(),
        ],
      ),
    );
  }
}

// ── Supporting widgets ────────────────────────────────────────────────────

class _OverlayPainter extends CustomPainter {
  const _OverlayPainter({required this.scanRect});
  final Rect scanRect;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.black.withValues(alpha: 0.30);
    final full = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cutout = Path()
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(10)));
    canvas.drawPath(
        Path.combine(PathOperation.difference, full, cutout), paint);
  }

  @override
  bool shouldRepaint(covariant _OverlayPainter old) => old.scanRect != scanRect;
}

class _DigitBoxPainter extends CustomPainter {
  const _DigitBoxPainter({required this.boxes});
  final List<Rect> boxes;

  @override
  void paint(Canvas canvas, Size size) {
    final fill = Paint()
      ..color = Colors.yellow.withValues(alpha: 0.18)
      ..style = PaintingStyle.fill;
    final stroke = Paint()
      ..color = Colors.yellow
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;

    for (final box in boxes) {
      final target = Rect.fromLTWH(
        box.left.clamp(0.0, 1.0) * size.width,
        box.top.clamp(0.0, 1.0) * size.height,
        box.width.clamp(0.0, 1.0) * size.width,
        box.height.clamp(0.0, 1.0) * size.height,
      );
      canvas.drawRect(target, fill);
      canvas.drawRect(target, stroke);
    }
  }

  @override
  bool shouldRepaint(covariant _DigitBoxPainter old) => old.boxes != boxes;
}

// ── Data classes ──────────────────────────────────────────────────────────

class _FrameStats {
  const _FrameStats({required this.brightness, required this.sharpness});
  final double brightness;
  final double sharpness;
}

class _TextLine {
  const _TextLine({required this.text, required this.boundingBox});
  final String text;
  final Rect boundingBox;
}

class _ExtractedScanResult {
  const _ExtractedScanResult({
    required this.meterNumber,
    required this.meterReading,
    required this.confidence,
    required this.digitBoxes,
    required this.rawText,
  });
  final String meterNumber;
  final String meterReading;
  final String confidence;
  final List<Rect> digitBoxes;
  final String rawText;
}

class _ProcessedImageData {
  const _ProcessedImageData(
      {required this.path, required this.width, required this.height});
  final String path;
  final int width;
  final int height;
}


// ── Preprocessing strategy enum ───────────────────────────────────────────
enum _PreProcessMode {
  normal,        // grayscale + moderate contrast (MTR label: dark text on white)
  inverted,      // invert then contrast (dark-bg LCD: light digits on dark bg)
  yellowExtract, // isolate yellow channel (AQUAFLOW: yellow digits on black)
  highContrast,  // extreme contrast: last resort for dim panels
}