import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:city_water_flutter/services/auth_service.dart';
import 'package:city_water_flutter/screens/auth/login_screen.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';

class EmailVerificationPage extends StatefulWidget {
  final String email;

  const EmailVerificationPage({super.key, required this.email});

  @override
  State<EmailVerificationPage> createState() => _EmailVerificationPageState();
}

class _EmailVerificationPageState extends State<EmailVerificationPage> {
  static const int _otpDurationSeconds = 600;
  static const int _resendCooldownSeconds = 60;

  final List<TextEditingController> _controllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());
  bool _isVerifying = false;
  bool _isResending = false;
  int _secondsRemaining = _otpDurationSeconds;
  int _resendSecondsRemaining = _resendCooldownSeconds;
  Timer? _otpTimer;

  bool get _isOtpExpired => _secondsRemaining <= 0;

  @override
  void initState() {
    super.initState();
    _startOtpTimer();
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        _focusNodes[0].requestFocus();
      }
    });
  }

  void _startOtpTimer({int resendCooldown = _resendCooldownSeconds}) {
    _otpTimer?.cancel();
    setState(() {
      _secondsRemaining = _otpDurationSeconds;
      _resendSecondsRemaining = resendCooldown;
    });

    _otpTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      if (_secondsRemaining <= 1) {
        setState(() {
          _secondsRemaining = 0;
        });
        timer.cancel();
        return;
      }

      setState(() {
        _secondsRemaining -= 1;
        if (_resendSecondsRemaining > 0) {
          _resendSecondsRemaining -= 1;
        }
      });
    });
  }

  int _extractCooldownSeconds(String message) {
    final match = RegExp(r'(\d+)s').firstMatch(message);
    if (match == null) {
      return _resendCooldownSeconds;
    }
    return int.tryParse(match.group(1) ?? '') ?? _resendCooldownSeconds;
  }

  String _formatCountdown() {
    final minutes = (_secondsRemaining ~/ 60).toString().padLeft(2, '0');
    final seconds = (_secondsRemaining % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  void dispose() {
    _otpTimer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
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

  Future<void> _handleVerify() async {
    if (_isOtpExpired) {
      _showMessage('OTP expired. Please resend code.', isError: true);
      return;
    }

    final String code = _controllers.map((c) => c.text).join();

    if (code.length != 6) {
      _showMessage('Please enter the 6-digit OTP code.', isError: true);
      return;
    }

    setState(() {
      _isVerifying = true;
    });

    try {
      final response = await AuthService.validateOtp(
        email: widget.email,
        otp: code,
      );

      if (!mounted) {
        return;
      }

      _showMessage(response['message']?.toString() ?? 'Email verified.');

      await Future.delayed(const Duration(milliseconds: 500));

      if (!mounted) {
        return;
      }

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    } catch (error) {
      _showMessage(
        error.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isVerifying = false;
        });
      }
    }
  }

  Future<void> _handleResend() async {
    if (_isResending) {
      return;
    }

    setState(() {
      _isResending = true;
    });

    try {
      final response = await AuthService.resendOtp(email: widget.email);
      final serverCooldown = response['cooldownSeconds'] is int
          ? response['cooldownSeconds'] as int
          : _resendCooldownSeconds;
      for (final controller in _controllers) {
        controller.clear();
      }
      _focusNodes[0].requestFocus();
      _startOtpTimer(resendCooldown: serverCooldown);
      _showMessage(
        response['message']?.toString() ??
            'OTP sent. You can request again in ${serverCooldown}s.',
      );
    } catch (error) {
      final message = error.toString().replaceFirst('Exception: ', '');
      final cooldown = _extractCooldownSeconds(message);
      setState(() {
        if (_resendSecondsRemaining < cooldown) {
          _resendSecondsRemaining = cooldown;
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
                  padding: const EdgeInsets.all(16.0),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 400),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Back to Create Account
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                            },
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
                        const SizedBox(height: 32),

                        // Main Card
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 20,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // Icon
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF22D3EE), // cyan-400
                                      Color(0xFF3B82F6), // blue-500
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(32),
                                ),
                                child: const Icon(
                                  Icons.email_outlined,
                                  color: Colors.white,
                                  size: 32,
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Title
                              const Text(
                                'Verify Your Email',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Description
                              RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: TextStyle(
                                    color: Color(0xFF6B7280),
                                    fontSize: 14,
                                  ),
                                  children: [
                                    const TextSpan(
                                      text: 'We have sent a six digit code to ',
                                    ),
                                    TextSpan(
                                      text: widget.email,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _isOtpExpired
                                    ? 'OTP expired. Request a new code.'
                                    : 'Code expires in ${_formatCountdown()}',
                                style: TextStyle(
                                  color: _isOtpExpired
                                      ? const Color(0xFFDC2626)
                                      : const Color(0xFF2563EB),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 32),

                              // 6 Digit Code Input
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  double totalWidth = constraints.maxWidth;
                                  const double spacing = 8;
                                  final double boxWidth =
                                      (totalWidth - (spacing * 5)) / 6;

                                  return Row(
                                    children: List.generate(6, (index) {
                                      return Padding(
                                        padding: EdgeInsets.only(
                                          right: index == 5 ? 0 : spacing,
                                        ),
                                        child: SizedBox(
                                          width: boxWidth,
                                          height: 56,
                                          child: TextField(
                                            controller: _controllers[index],
                                            focusNode: _focusNodes[index],
                                            textAlign: TextAlign.center,
                                            textAlignVertical:
                                                TextAlignVertical.center,
                                            keyboardType: TextInputType.number,
                                            maxLength: 1,
                                            style: const TextStyle(
                                              fontSize: 24,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF111827),
                                            ),
                                            cursorColor: Color(0xFF111827),
                                            decoration: InputDecoration(
                                              counterText: '',
                                              filled: true,
                                              fillColor: Colors.white,
                                              contentPadding: EdgeInsets.zero,
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFFD1D5DB),
                                                  width: 2,
                                                ),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFF3B82F6),
                                                  width: 2,
                                                ),
                                              ),
                                            ),
                                            inputFormatters: [
                                              FilteringTextInputFormatter
                                                  .digitsOnly,
                                            ],
                                            onChanged: (value) {
                                              if (value.length > 1) {
                                                final pasted = value.replaceAll(
                                                  RegExp(r'\D'),
                                                  '',
                                                );

                                                if (pasted.length == 6) {
                                                  for (int i = 0; i < 6; i++) {
                                                    _controllers[i].text =
                                                        pasted[i];
                                                  }

                                                  _focusNodes[5].unfocus();
                                                }
                                                return;
                                              }

                                              if (value.isNotEmpty &&
                                                  index < 5) {
                                                _focusNodes[index + 1]
                                                    .requestFocus();
                                              }

                                              if (value.isEmpty && index > 0) {
                                                _focusNodes[index - 1]
                                                    .requestFocus();
                                              }
                                            },
                                          ),
                                        ),
                                      );
                                    }),
                                  );
                                },
                              ),
                              const SizedBox(height: 32),

                              // Verify Button
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        Color(0xFF22D3EE), // cyan-400
                                        Color(0xFF3B82F6), // blue-500
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: ElevatedButton(
                                    onPressed: _isVerifying || _isOtpExpired
                                        ? null
                                        : _handleVerify,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: _isVerifying
                                        ? const SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.4,
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                    Colors.white,
                                                  ),
                                            ),
                                          )
                                        : const Text(
                                            'Verify Email',
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white,
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Resend Code
                              Column(
                                children: [
                                  GestureDetector(
                                    onTap:
                                        (_isResending ||
                                            _resendSecondsRemaining > 0)
                                        ? null
                                        : _handleResend,
                                    child: Text(
                                      _isResending
                                          ? 'Sending new OTP...'
                                          : 'Send new OTP code',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color:
                                            (_isResending ||
                                                _resendSecondsRemaining > 0)
                                            ? const Color(0xFF9CA3AF)
                                            : const Color(0xFF3B82F6),
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _resendSecondsRemaining > 0
                                        ? "Didn't receive code? Try again in ${_resendSecondsRemaining}s"
                                        : "Didn't receive code?",
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: Color(0xFF6B7280),
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
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
