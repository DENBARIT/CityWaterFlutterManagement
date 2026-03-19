import 'dart:async';

import 'package:city_water_flutter/screens/auth/reset_password_screen.dart';
import 'package:city_water_flutter/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';

class ResetOtpVerificationPage extends StatefulWidget {
  final String email;
  final int resendCooldownSeconds;

  const ResetOtpVerificationPage({
    super.key,
    required this.email,
    this.resendCooldownSeconds = 0,
  });

  @override
  State<ResetOtpVerificationPage> createState() =>
      _ResetOtpVerificationPageState();
}

class _ResetOtpVerificationPageState extends State<ResetOtpVerificationPage> {
  static const int _otpDurationSeconds = 600;
  static const int _defaultCooldownSeconds = 60;
  static const int _maxAttempts = 3;
  static const Duration _lockDuration = Duration(hours: 24);

  final TextEditingController _otpController = TextEditingController();

  int _secondsRemaining = _otpDurationSeconds;
  int _resendCooldownRemaining = 0;
  int _attemptsRemaining = _maxAttempts;
  DateTime? _lockedUntil;
  bool _isSubmitting = false;
  bool _isResending = false;
  Timer? _timer;

  bool get _isOtpExpired => _secondsRemaining <= 0;
  bool get _isLocked =>
      _lockedUntil != null && DateTime.now().isBefore(_lockedUntil!);
  String get _lockKey =>
      'reset_otp_lock_until_${widget.email.trim().toLowerCase()}';

  @override
  void initState() {
    super.initState();
    _resendCooldownRemaining = widget.resendCooldownSeconds;
    _startTimers();
    _loadLockState();
  }

  Future<void> _loadLockState() async {
    final prefs = await SharedPreferences.getInstance();
    final lockMillis = prefs.getInt(_lockKey);

    if (lockMillis == null) {
      return;
    }

    final lockTime = DateTime.fromMillisecondsSinceEpoch(lockMillis);

    if (!mounted) {
      return;
    }

    if (lockTime.isAfter(DateTime.now())) {
      setState(() {
        _lockedUntil = lockTime;
      });
    } else {
      await prefs.remove(_lockKey);
    }
  }

  Future<void> _persistLock(DateTime lockUntil) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_lockKey, lockUntil.millisecondsSinceEpoch);
  }

  void _startTimers() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      setState(() {
        if (_secondsRemaining > 0) {
          _secondsRemaining -= 1;
        }

        if (_resendCooldownRemaining > 0) {
          _resendCooldownRemaining -= 1;
        }

        if (_isLocked && _lockedUntil != null) {
          if (!DateTime.now().isBefore(_lockedUntil!)) {
            _lockedUntil = null;
            _attemptsRemaining = _maxAttempts;
          }
        }
      });
    });
  }

  String _formatDuration(int totalSeconds) {
    final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  String _formatLockRemaining() {
    if (_lockedUntil == null) {
      return '24:00:00';
    }

    final diff = _lockedUntil!.difference(DateTime.now());
    final safe = diff.isNegative ? Duration.zero : diff;
    final hours = safe.inHours.toString().padLeft(2, '0');
    final minutes = (safe.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (safe.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  int _extractCooldownSeconds(String message) {
    final match = RegExp(r'(\d+)s').firstMatch(message);
    if (match == null) {
      return _defaultCooldownSeconds;
    }
    return int.tryParse(match.group(1) ?? '') ?? _defaultCooldownSeconds;
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _verifyOtp() async {
    if (_isLocked) {
      _showMessage(
        'Too many invalid attempts. Try again in ${_formatLockRemaining()}.',
        isError: true,
      );
      return;
    }

    if (_isOtpExpired) {
      _showMessage('OTP expired. Request a new OTP code.', isError: true);
      return;
    }

    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      _showMessage('Enter the 6-digit OTP from your email.', isError: true);
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await AuthService.validateResetOtp(
        email: widget.email,
        otp: otp,
      );

      if (!mounted) {
        return;
      }

      _showMessage(
        response['message']?.toString() ?? 'OTP verified successfully.',
      );

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ResetPasswordPage(email: widget.email, otp: otp),
        ),
      );
    } catch (error) {
      final message = error.toString().replaceFirst('Exception: ', '');
      if (message.toLowerCase().contains('invalid otp')) {
        setState(() {
          if (_attemptsRemaining > 0) {
            _attemptsRemaining -= 1;
          }
        });

        if (_attemptsRemaining == 0) {
          final lockUntil = DateTime.now().add(_lockDuration);
          await _persistLock(lockUntil);
          if (!mounted) {
            return;
          }
          setState(() {
            _lockedUntil = lockUntil;
          });
          _showMessage(
            'You entered invalid OTP 3 times. Try again after 24 hours.',
            isError: true,
          );
        } else {
          _showMessage(
            'Invalid OTP. $_attemptsRemaining attempts remaining.',
            isError: true,
          );
        }
      } else {
        _showMessage(message, isError: true);
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _resendOtp() async {
    if (_isResending || _resendCooldownRemaining > 0 || _isLocked) {
      return;
    }

    setState(() {
      _isResending = true;
    });

    try {
      final response = await AuthService.forgotPassword(email: widget.email);
      final cooldown = response['cooldownSeconds'] is int
          ? response['cooldownSeconds'] as int
          : _defaultCooldownSeconds;

      if (!mounted) {
        return;
      }

      setState(() {
        _secondsRemaining = _otpDurationSeconds;
        _resendCooldownRemaining = cooldown;
        _attemptsRemaining = _maxAttempts;
      });

      _otpController.clear();
      _showMessage(
        response['message']?.toString() ??
            'New reset OTP sent. You can request again in ${cooldown}s.',
      );
    } catch (error) {
      final message = error.toString().replaceFirst('Exception: ', '');
      final cooldown = _extractCooldownSeconds(message);

      if (!mounted) {
        return;
      }

      setState(() {
        if (_resendCooldownRemaining < cooldown) {
          _resendCooldownRemaining = cooldown;
        }
      });

      _showMessage(message, isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _isResending = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: AuthBackground()),
          Container(
            color: Colors.transparent,
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: Column(
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () => Navigator.pop(context),
                            style: ButtonStyle(
                              foregroundColor: WidgetStateProperty.resolveWith((
                                states,
                              ) {
                                if (states.contains(WidgetState.hovered)) {
                                  return const Color(0xFF0072FF);
                                }
                                return const Color(0xFF6B7280);
                              }),
                              overlayColor: WidgetStateProperty.resolveWith((
                                states,
                              ) {
                                if (states.contains(WidgetState.hovered)) {
                                  return const Color(0x1F3B82F6);
                                }
                                return Colors.transparent;
                              }),
                            ),
                            icon: const Icon(Icons.arrow_back, size: 20),
                            label: const Text(
                              'Back',
                              style: TextStyle(fontSize: 14),
                            ),
                          ),
                        ),
                        const SizedBox(height: 30),
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 20,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF22D3EE),
                                      Color(0xFF3B82F6),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(32),
                                ),
                                child: const Icon(
                                  Icons.verified_user_outlined,
                                  color: Colors.white,
                                  size: 32,
                                ),
                              ),
                              const SizedBox(height: 25),
                              const Text(
                                'Verify Reset OTP',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Enter the 6-digit code sent to ${widget.email}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Color(0xFF6B7280),
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _isOtpExpired
                                    ? 'OTP expired. Request a new OTP code.'
                                    : 'Code expires in ${_formatDuration(_secondsRemaining)}',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: _isOtpExpired
                                      ? const Color(0xFFDC2626)
                                      : const Color(0xFF2563EB),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _isLocked
                                    ? 'Too many attempts. Try again in ${_formatLockRemaining()}.'
                                    : 'Invalid OTP attempts left: $_attemptsRemaining',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: _isLocked
                                      ? const Color(0xFFB91C1C)
                                      : const Color(0xFF6B7280),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (_resendCooldownRemaining > 0) ...[
                                const SizedBox(height: 10),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: const Color(0xFFBFDBFE),
                                    ),
                                  ),
                                  child: Text(
                                    'New reset OTP request available in ${_resendCooldownRemaining}s.',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: Color(0xFF1E40AF),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 24),
                              TextField(
                                controller: _otpController,
                                enabled: !_isLocked,
                                keyboardType: TextInputType.number,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  LengthLimitingTextInputFormatter(6),
                                ],
                                decoration: InputDecoration(
                                  hintText: 'Enter 6-digit OTP',
                                  prefixIcon: const Icon(
                                    Icons.lock_clock_outlined,
                                  ),
                                  filled: true,
                                  fillColor: Colors.grey.shade100,
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: const BorderSide(
                                      color: Color(0xFFD1D5DB),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: const BorderSide(
                                      color: Color(0xFF3B82F6),
                                      width: 2,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                child: GestureDetector(
                                  onTap: (_isSubmitting || _isLocked)
                                      ? null
                                      : _verifyOtp,
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    height: 56,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(16),
                                      gradient: const LinearGradient(
                                        colors: [
                                          Color(0xFF00C6FF),
                                          Color(0xFF0072FF),
                                        ],
                                      ),
                                    ),
                                    alignment: Alignment.center,
                                    child: _isSubmitting
                                        ? const SizedBox(
                                            height: 22,
                                            width: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.4,
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                    Colors.white,
                                                  ),
                                            ),
                                          )
                                        : const Text(
                                            'Verify OTP',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 14),
                              TextButton(
                                onPressed:
                                    (_isResending ||
                                        _resendCooldownRemaining > 0 ||
                                        _isLocked)
                                    ? null
                                    : _resendOtp,
                                child: Text(
                                  _isResending
                                      ? 'Sending new OTP...'
                                      : _resendCooldownRemaining > 0
                                      ? 'Send new reset OTP code in ${_resendCooldownRemaining}s'
                                      : 'Send new reset OTP code',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
