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

class _MeterScanScreenState extends State<MeterScanScreen> {
  static const double _minRegionWidth = 0.45;
  static const double _minRegionHeight = 0.18;

  CameraController? _cameraController;
  final TextRecognizer _textRecognizer = TextRecognizer(
    script: TextRecognitionScript.latin,
  );

  final TextEditingController _meterNumberController = TextEditingController();
  final TextEditingController _meterReadingController = TextEditingController();
  final TextEditingController _previousReadingController =
      TextEditingController();

  bool _isCameraReady = false;
  bool _isProcessing = false;
  bool _isSubmitting = false;
  bool _autoCaptureEnabled = true;
  bool _captured = false;
  bool _imageStreamRunning = false;
  bool _autoCaptureTriggered = false;
  bool _isLoadingBilling = true;

  String _rawText = '';
  String _confidence = 'low';
  String? _cameraError;
  String? _qualityMessage;
  String? _billingLoadError;
  String _linkedMeterNumber = '';
  String _customerName = '';
  BillingCustomerType _selectedCustomerType = BillingCustomerType.residential;

  BillingBill? _currentBill;

  Rect _scanRegion = const Rect.fromLTWH(0.16, 0.33, 0.68, 0.24);
  double _latestSharpness = 0;
  double _latestBrightness = 0;

  final List<_FrameStats> _recentFrameStats = <_FrameStats>[];
  List<Rect> _detectedDigitBoxes = <Rect>[];

  int _captureCounter = 0;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _loadBillingContext();
  }

  Future<void> _loadBillingContext() async {
    try {
      final profile = await BillingService.loadLinkedProfile();
      final currentBill = await BillingService.loadCurrentBill();
      final selectedCustomerType =
          await BillingService.loadSelectedCustomerType();

      if (!mounted) {
        return;
      }

      setState(() {
        _linkedMeterNumber = profile.meterNumber;
        _customerName = profile.fullName;
        _selectedCustomerType = selectedCustomerType;
        _currentBill = currentBill;
        _isLoadingBilling = false;
        if (_meterNumberController.text.trim().isEmpty) {
          _meterNumberController.text = profile.meterNumber;
        }
      });

      if (currentBill != null) {
        await _stopImageStream();
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _billingLoadError = error.toString().replaceFirst('Exception: ', '');
        _isLoadingBilling = false;
      });
    }
  }

  Future<void> _initializeCamera() async {
    final status = await Permission.camera.request();

    if (!status.isGranted) {
      if (!mounted) {
        return;
      }
      setState(() {
        _cameraError = 'Camera permission is required to scan the meter.';
      });
      return;
    }

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() {
          _cameraError = 'No camera found on this device.';
        });
        return;
      }

      final selectedCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        selectedCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );

      await _cameraController!.initialize();
      await _cameraController!.setFocusMode(FocusMode.auto);
      await _cameraController!.setExposureMode(ExposureMode.auto);
      await _cameraController!.setFlashMode(FlashMode.off);

      if (!mounted) {
        return;
      }

      setState(() {
        _isCameraReady = true;
      });

      if (_currentBill == null) {
        _startImageStream();
      }
    } catch (e) {
      if (!mounted) {
        return;
      }
      setState(() {
        _cameraError = 'Failed to initialize camera: $e';
      });
    }
  }

  @override
  void dispose() {
    _meterNumberController.dispose();
    _meterReadingController.dispose();
    _previousReadingController.dispose();
    _cameraController?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  Future<void> _startImageStream() async {
    if (_cameraController == null ||
        !_isCameraReady ||
        _imageStreamRunning ||
        _currentBill != null) {
      return;
    }

    try {
      await _cameraController!.startImageStream((CameraImage image) {
        if (!_autoCaptureEnabled ||
            _captured ||
            _isProcessing ||
            _currentBill != null) {
          return;
        }

        final stats = _computeFrameStats(image);
        _latestBrightness = stats.brightness;
        _latestSharpness = stats.sharpness;
        _recentFrameStats.add(stats);
        if (_recentFrameStats.length > 15) {
          _recentFrameStats.removeAt(0);
        }

        if (_shouldAutoCapture() && !_autoCaptureTriggered) {
          _autoCaptureTriggered = true;
          unawaited(_captureAndProcess(autoTriggered: true));
        }

        if (mounted) {
          setState(() {});
        }
      });
      _imageStreamRunning = true;
    } catch (_) {
      _imageStreamRunning = false;
    }
  }

  Future<void> _stopImageStream() async {
    if (_cameraController == null || !_imageStreamRunning) {
      return;
    }

    try {
      await _cameraController!.stopImageStream();
    } catch (_) {
      // Ignore stop stream failures and continue with best effort.
    }
    _imageStreamRunning = false;
  }

  _FrameStats _computeFrameStats(CameraImage image) {
    final bytes = image.planes.first.bytes;
    if (bytes.isEmpty) {
      return const _FrameStats(brightness: 0, sharpness: 0);
    }

    double brightnessSum = 0;
    double gradientSum = 0;

    for (var i = 1; i < bytes.length; i += 16) {
      final current = bytes[i].toDouble();
      final previous = bytes[i - 1].toDouble();
      brightnessSum += current;
      gradientSum += (current - previous).abs();
    }

    final sampleCount = math.max(1, (bytes.length / 16).floor());
    final avgBrightness = brightnessSum / sampleCount;
    final avgGradient = gradientSum / sampleCount;
    return _FrameStats(brightness: avgBrightness, sharpness: avgGradient);
  }

  bool _shouldAutoCapture() {
    if (_recentFrameStats.length < 8) {
      return false;
    }

    final sharpnessValues = _recentFrameStats.map((e) => e.sharpness).toList();
    final brightnessValues = _recentFrameStats
        .map((e) => e.brightness)
        .toList();

    final avgSharpness =
        sharpnessValues.reduce((a, b) => a + b) / sharpnessValues.length;
    final avgBrightness =
        brightnessValues.reduce((a, b) => a + b) / brightnessValues.length;

    double variation = 0;
    for (final value in sharpnessValues) {
      variation += (value - avgSharpness) * (value - avgSharpness);
    }
    final stdDev = math.sqrt(variation / sharpnessValues.length);

    final isSharp = avgSharpness > 11;
    final isStable = stdDev < 4.5;
    final brightnessOk = avgBrightness > 70 && avgBrightness < 200;
    return isSharp && isStable && brightnessOk;
  }

  Future<_ProcessedImageData> _preProcessImage(String sourcePath) async {
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

    final avgLuma = _averageLuma(cropped);
    final target = 128.0;
    final brightnessOffset = ((target - avgLuma) * 0.7).clamp(-45.0, 45.0);

    final enhanced = img.adjustColor(
      cropped,
      brightness: brightnessOffset,
      contrast: 1.18,
    );

    final gray = img.grayscale(enhanced);
    final denoised = img.gaussianBlur(gray, radius: 1);

    final sharpened = img.convolution(
      denoised,
      filter: <num>[0, -1, 0, -1, 5, -1, 0, -1, 0],
      div: 1,
      offset: 0,
    );

    final outputPath =
        '${Directory.systemTemp.path}${Platform.pathSeparator}meter_scan_${DateTime.now().millisecondsSinceEpoch}_${_captureCounter++}.jpg';
    await File(outputPath).writeAsBytes(img.encodeJpg(sharpened, quality: 96));
    return _ProcessedImageData(
      path: outputPath,
      width: sharpened.width,
      height: sharpened.height,
    );
  }

  double _averageLuma(img.Image image) {
    var sum = 0.0;
    var count = 0;
    for (var y = 0; y < image.height; y += 3) {
      for (var x = 0; x < image.width; x += 3) {
        final pixel = image.getPixel(x, y);
        sum += img.getLuminance(pixel);
        count++;
      }
    }
    return count == 0 ? 0 : sum / count;
  }

  _ExtractedScanResult _extractDigits(
    RecognizedText recognizedText,
    int imageWidth,
    int imageHeight,
  ) {
    final digitElements = <_DigitElement>[];

    for (final block in recognizedText.blocks) {
      for (final line in block.lines) {
        for (final element in line.elements) {
          final digits = element.text.replaceAll(RegExp(r'[^0-9]'), '');
          if (digits.isEmpty) {
            continue;
          }
          final box = element.boundingBox;
          digitElements.add(_DigitElement(digits: digits, box: box));
        }
      }
    }

    digitElements.sort((a, b) {
      final vertical = (a.box.top - b.box.top).abs();
      if (vertical > 12) {
        return a.box.top.compareTo(b.box.top);
      }
      return a.box.left.compareTo(b.box.left);
    });

    final candidates = <String>[];
    final boxes = <Rect>[];

    for (final element in digitElements) {
      final matches = RegExp(r'\d{5}').allMatches(element.digits);
      for (final match in matches) {
        if (candidates.length >= 2) {
          break;
        }
        candidates.add(match.group(0)!);
        boxes.add(
          Rect.fromLTWH(
            element.box.left / imageWidth,
            element.box.top / imageHeight,
            element.box.width / imageWidth,
            element.box.height / imageHeight,
          ),
        );
      }
      if (candidates.length >= 2) {
        break;
      }
    }

    if (candidates.length < 2) {
      final mergedDigits = recognizedText.text.replaceAll(
        RegExp(r'[^0-9]'),
        '',
      );
      final mergedMatches = RegExp(r'\d{5}').allMatches(mergedDigits).toList();
      if (mergedMatches.length >= 2) {
        candidates
          ..clear()
          ..add(mergedMatches[0].group(0)!)
          ..add(mergedMatches[1].group(0)!);
      }
    }

    final meterNumber = candidates.isNotEmpty ? 'MTR-${candidates.first}' : '';
    final meterReading = candidates.length > 1 ? candidates[1] : '';

    final bothValid =
        _isValidMeterNumber(meterNumber) && _isValidMeterReading(meterReading);
    final qualityScore = _qualityScore();
    final confidence = bothValid && qualityScore >= 0.62 ? 'high' : 'low';

    return _ExtractedScanResult(
      meterNumber: meterNumber,
      meterReading: meterReading,
      confidence: confidence,
      digitBoxes: boxes,
      rawText: recognizedText.text,
    );
  }

  double _qualityScore() {
    final sharpnessScore = (_latestSharpness / 18).clamp(0.0, 1.0);
    final brightnessDistance = (_latestBrightness - 128).abs();
    final brightnessScore = (1 - (brightnessDistance / 128)).clamp(0.0, 1.0);
    return (sharpnessScore * 0.65) + (brightnessScore * 0.35);
  }

  bool _isValidMeterNumber(String value) {
    return RegExp(r'^MTR-\d{5}$').hasMatch(value.trim().toUpperCase());
  }

  bool _isValidMeterReading(String value) {
    return RegExp(r'^\d+$').hasMatch(value.trim());
  }

  bool _isValidOptionalMeterReading(String value) {
    final trimmed = value.trim();
    return trimmed.isEmpty || _isValidMeterReading(trimmed);
  }

  Future<void> _captureAndProcess({required bool autoTriggered}) async {
    if (_isProcessing ||
        _cameraController == null ||
        !_isCameraReady ||
        _currentBill != null) {
      return;
    }

    setState(() {
      _isProcessing = true;
      _qualityMessage = null;
    });

    try {
      await _stopImageStream();
      final picture = await _cameraController!.takePicture();

      final processed = await _preProcessImage(picture.path);
      final inputImage = InputImage.fromFilePath(processed.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);
      final extracted = _extractDigits(
        recognizedText,
        processed.width,
        processed.height,
      );

      final isValid =
          _isValidMeterNumber(extracted.meterNumber) &&
          _isValidMeterReading(extracted.meterReading) &&
          extracted.confidence == 'high';

      if (!mounted) {
        return;
      }

      setState(() {
        _captured = true;
        _autoCaptureEnabled = false;
        _rawText = extracted.rawText;
        _detectedDigitBoxes = extracted.digitBoxes;
        _confidence = extracted.confidence;
        _meterNumberController.text = extracted.meterNumber;
        _meterReadingController.text = extracted.meterReading;
        _qualityMessage = isValid
            ? null
            : 'Scan quality is low. Please review or edit the values before submitting.';
      });

      if (!isValid) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              'Scan quality is low. Please review or edit the values before submitting.',
            ),
          ),
        );
      }

      if (autoTriggered && !isValid) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              'Auto scan did not pass validation. Please adjust the values manually.',
            ),
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
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  Future<void> _rescan() async {
    if (_currentBill != null) {
      return;
    }

    setState(() {
      _autoCaptureTriggered = false;
      _captured = false;
      _autoCaptureEnabled = true;
      _confidence = 'low';
      _rawText = '';
      _detectedDigitBoxes = <Rect>[];
      _qualityMessage = null;
    });
    await _startImageStream();
  }

  Future<void> _submit() async {
    final meterNumber = BillingService.normalizeMeterNumber(
      _meterNumberController.text,
    );
    final meterReading = _meterReadingController.text.trim();
    final previousReadingText = _previousReadingController.text.trim();
    final previousReadingValue = previousReadingText.isEmpty
        ? null
        : int.tryParse(previousReadingText);

    if (_currentBill != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            'A bill already exists for this month. Please pay it first.',
          ),
        ),
      );
      return;
    }

    if (!_isValidMeterNumber(meterNumber) ||
        !_isValidMeterReading(meterReading) ||
        !_isValidOptionalMeterReading(previousReadingText) ||
        (previousReadingText.isNotEmpty && previousReadingValue == null)) {
      setState(() {
        _qualityMessage =
            'Enter a valid meter number, meter reading, and optional previous month reading before submitting.';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            'Enter a valid meter number, meter reading, and optional previous month reading before submitting.',
          ),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final bill = await BillingService.submitReading(
        meterNumber: meterNumber,
        readingValue: int.parse(meterReading),
        previousReadingValue: previousReadingValue,
        source: _captured && _confidence == 'high'
            ? BillingSubmissionSource.ocr
            : BillingSubmissionSource.manual,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _currentBill = bill;
        _meterNumberController.text = bill.meterNumber;
        _meterReadingController.text = bill.readingValue.toString();
        _qualityMessage = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            'Bill generated for ${bill.cycleKey}. Continue payment from the Bill section.',
          ),
        ),
      );

      _closeWithResult();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _closeWithResult() {
    final currentBill = _currentBill;
    Navigator.of(context).pop(<String, String>{
      'meter_number':
          currentBill?.meterNumber ?? _meterNumberController.text.trim(),
      'meter_reading':
          currentBill?.readingValue.toString() ??
          _meterReadingController.text.trim(),
      'billing_cycle':
          currentBill?.cycleKey ?? BillingService.currentCycleKey(),
      'bill_amount': currentBill?.amountDue.toStringAsFixed(2) ?? '',
      'payment_status': currentBill?.paymentStatus ?? 'UNPAID',
      'payment_reference': currentBill?.paymentReference ?? '',
    });
  }

  Rect _normalizedRegionToImageRect(
    Rect normalized,
    int imageWidth,
    int imageHeight,
  ) {
    final left = (normalized.left * imageWidth).clamp(0.0, imageWidth - 2.0);
    final top = (normalized.top * imageHeight).clamp(0.0, imageHeight - 2.0);
    final width = (normalized.width * imageWidth).clamp(2.0, imageWidth - left);
    final height = (normalized.height * imageHeight).clamp(
      2.0,
      imageHeight - top,
    );

    return Rect.fromLTWH(left, top, width, height);
  }

  void _moveRegion(Offset delta, Size previewSize) {
    final dx = delta.dx / previewSize.width;
    final dy = delta.dy / previewSize.height;
    setState(() {
      final left = (_scanRegion.left + dx).clamp(0.0, 1.0 - _scanRegion.width);
      final top = (_scanRegion.top + dy).clamp(0.0, 1.0 - _scanRegion.height);
      _scanRegion = Rect.fromLTWH(
        left,
        top,
        _scanRegion.width,
        _scanRegion.height,
      );
    });
  }

  void _resizeRegion(Offset delta, Size previewSize) {
    final dw = delta.dx / previewSize.width;
    final dh = delta.dy / previewSize.height;
    setState(() {
      final width = (_scanRegion.width + dw).clamp(_minRegionWidth, 0.92);
      final height = (_scanRegion.height + dh).clamp(_minRegionHeight, 0.65);
      _scanRegion = Rect.fromLTWH(
        _scanRegion.left,
        _scanRegion.top,
        width,
        height,
      );

      if (_scanRegion.right > 1) {
        _scanRegion = Rect.fromLTWH(
          1 - _scanRegion.width,
          _scanRegion.top,
          _scanRegion.width,
          _scanRegion.height,
        );
      }

      if (_scanRegion.bottom > 1) {
        _scanRegion = Rect.fromLTWH(
          _scanRegion.left,
          1 - _scanRegion.height,
          _scanRegion.width,
          _scanRegion.height,
        );
      }
    });
  }

  Widget _buildScanOverlay(Size previewSize) {
    final left = previewSize.width * _scanRegion.left;
    final top = previewSize.height * _scanRegion.top;
    final width = previewSize.width * _scanRegion.width;
    final height = previewSize.height * _scanRegion.height;

    return Stack(
      children: [
        Positioned.fill(
          child: IgnorePointer(
            child: CustomPaint(
              painter: _OverlayPainter(
                scanRect: Rect.fromLTWH(left, top, width, height),
              ),
            ),
          ),
        ),
        Positioned(
          left: left,
          top: top,
          width: width,
          height: height,
          child: GestureDetector(
            onPanUpdate: (details) => _moveRegion(details.delta, previewSize),
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF22C55E), width: 3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                children: [
                  if (_detectedDigitBoxes.isNotEmpty)
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _DigitBoxPainter(boxes: _detectedDigitBoxes),
                      ),
                    ),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: GestureDetector(
                      onPanUpdate: (details) =>
                          _resizeRegion(details.delta, previewSize),
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: const BoxDecoration(
                          color: Color(0xFF22C55E),
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(10),
                            bottomRight: Radius.circular(9),
                          ),
                        ),
                        child: const Icon(
                          Icons.open_in_full,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBillingCard() {
    final hasBill = _currentBill != null;

    InputDecoration fieldDecoration(String label) {
      return InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white70),
        counterStyle: const TextStyle(color: Colors.white54),
        enabledBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.white30),
        ),
        focusedBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.white, width: 1.2),
        ),
        disabledBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.white24),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.78),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.receipt_long, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  hasBill ? 'Bill Already Generated' : 'Generate Monthly Bill',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            hasBill
                ? 'This month already has a generated bill. Payment is available from the Bill section in the dashboard.'
                : 'Enter the meter number and meter reading manually or scan them first. The app will verify the meter belongs to the signed-in account.',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 10),
          if (_billingLoadError != null)
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.red.shade300),
              ),
              child: Text(
                _billingLoadError!,
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          if (_isLoadingBilling)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: LinearProgressIndicator(minHeight: 2),
            )
          else if (_linkedMeterNumber.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _InfoChip(
                    icon: Icons.badge_outlined,
                    label: _customerName.isNotEmpty
                        ? _customerName
                        : 'Signed-in customer',
                  ),
                  _InfoChip(
                    icon: Icons.water_damage_outlined,
                    label: 'Linked meter: $_linkedMeterNumber',
                  ),
                  _InfoChip(
                    icon: Icons.calendar_month_outlined,
                    label: 'Cycle: ${BillingService.currentCycleKey()}',
                  ),
                  _InfoChip(
                    icon: Icons.category_outlined,
                    label: 'Type: ${_selectedCustomerType.label}',
                  ),
                ],
              ),
            ),
          if (_qualityMessage != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.orange.shade300),
              ),
              child: Text(
                _qualityMessage!,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          if (!hasBill) ...[
            TextField(
              controller: _meterNumberController,
              keyboardType: TextInputType.text,
              textCapitalization: TextCapitalization.characters,
              enabled: !hasBill,
              maxLength: 9,
              style: const TextStyle(color: Colors.white),
              decoration: fieldDecoration('Meter Number (MTR-12345)'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _meterReadingController,
              keyboardType: TextInputType.number,
              enabled: !hasBill,
              maxLength: 8,
              style: const TextStyle(color: Colors.white),
              decoration: fieldDecoration('Meter Reading'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _previousReadingController,
              keyboardType: TextInputType.number,
              enabled: !hasBill,
              maxLength: 8,
              style: const TextStyle(color: Colors.white),
              decoration: fieldDecoration('Previous Month Reading (optional)'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Use this only when the meter has no stored previous reading.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Confidence: ${_confidence.toUpperCase()}',
                style: TextStyle(
                  color: _confidence == 'high'
                      ? Colors.greenAccent
                      : Colors.orangeAccent,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Raw OCR: ${_rawText.isEmpty ? 'No OCR capture yet.' : _rawText}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ] else ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white24),
              ),
              child: const Text(
                'A bill already exists for this cycle. Open the Bill section to view details and complete payment.',
                style: TextStyle(color: Colors.white70, height: 1.4),
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (!hasBill) ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isProcessing ? null : _rescan,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Scan Again'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white38),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _submit,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 15,
                            height: 15,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.receipt_long),
                    label: const Text('Generate Bill'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed:
                        (_isProcessing ||
                            _isLoadingBilling ||
                            _currentBill != null)
                        ? null
                        : () => _captureAndProcess(autoTriggered: false),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Scan Now'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: (_isProcessing || _currentBill != null)
                        ? null
                        : () {
                            setState(() {
                              _autoCaptureEnabled = !_autoCaptureEnabled;
                              _autoCaptureTriggered = false;
                            });
                            if (_autoCaptureEnabled) {
                              _startImageStream();
                            }
                          },
                    icon: Icon(
                      _autoCaptureEnabled
                          ? Icons.pause_circle_outline
                          : Icons.play_circle_outline,
                      color: Colors.white,
                    ),
                    label: Text(
                      _autoCaptureEnabled ? 'Auto: On' : 'Auto: Off',
                      style: const TextStyle(color: Colors.white),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                    ),
                  ),
                ),
              ],
            ),
          ] else ...[
            OutlinedButton.icon(
              onPressed: _closeWithResult,
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Back to Bill Section'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white38),
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_cameraError != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Water Meter Scanner'),
          centerTitle: true,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              _cameraError!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ),
      );
    }

    if (!_isCameraReady || _cameraController == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Water Meter Scanner'),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final previewSize = Size(
                  constraints.maxWidth,
                  constraints.maxHeight,
                );
                return Stack(
                  children: [
                    Positioned.fill(child: CameraPreview(_cameraController!)),
                    Positioned.fill(child: _buildScanOverlay(previewSize)),
                  ],
                );
              },
            ),
          ),
          if (_isProcessing)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.45),
                child: const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                ),
              ),
            ),
          Positioned(bottom: 0, left: 0, right: 0, child: _buildBillingCard()),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white70, size: 14),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _OverlayPainter extends CustomPainter {
  const _OverlayPainter({required this.scanRect});

  final Rect scanRect;

  @override
  void paint(Canvas canvas, Size size) {
    final overlay = Paint()..color = Colors.black.withValues(alpha: 0.45);
    final full = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cutout = Path()
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(12)));
    final result = Path.combine(PathOperation.difference, full, cutout);
    canvas.drawPath(result, overlay);
  }

  @override
  bool shouldRepaint(covariant _OverlayPainter oldDelegate) {
    return oldDelegate.scanRect != scanRect;
  }
}

class _DigitBoxPainter extends CustomPainter {
  const _DigitBoxPainter({required this.boxes});

  final List<Rect> boxes;

  @override
  void paint(Canvas canvas, Size size) {
    final fill = Paint()
      ..color = Colors.yellow.withValues(alpha: 0.2)
      ..style = PaintingStyle.fill;
    final stroke = Paint()
      ..color = Colors.yellow
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    for (final box in boxes) {
      final normalized = Rect.fromLTWH(
        box.left.clamp(0.0, 1.0),
        box.top.clamp(0.0, 1.0),
        box.width.clamp(0.0, 1.0),
        box.height.clamp(0.0, 1.0),
      );
      final target = Rect.fromLTWH(
        normalized.left * size.width,
        normalized.top * size.height,
        normalized.width * size.width,
        normalized.height * size.height,
      );
      canvas.drawRect(target, fill);
      canvas.drawRect(target, stroke);
    }
  }

  @override
  bool shouldRepaint(covariant _DigitBoxPainter oldDelegate) {
    return oldDelegate.boxes != boxes;
  }
}

class _FrameStats {
  const _FrameStats({required this.brightness, required this.sharpness});

  final double brightness;
  final double sharpness;
}

class _DigitElement {
  const _DigitElement({required this.digits, required this.box});

  final String digits;
  final Rect box;
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
  const _ProcessedImageData({
    required this.path,
    required this.width,
    required this.height,
  });

  final String path;
  final int width;
  final int height;
}
