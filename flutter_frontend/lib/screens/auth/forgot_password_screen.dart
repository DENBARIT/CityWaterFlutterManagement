import 'dart:async';

import 'package:flutter/material.dart';
import 'package:city_water_flutter/services/auth_service.dart';
import 'package:city_water_flutter/screens/auth/reset_otp_verification_screen.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  static const int _requestCooldownSeconds = 60;

  final TextEditingController emailController = TextEditingController();
  bool _sendResetHover = false;
  bool _isSubmitting = false;
  int _cooldownSecondsRemaining = 0;
  Timer? _cooldownTimer;
  String? _emailError;

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    emailController.dispose();
    super.dispose();
  }

  void _startCooldown({int seconds = _requestCooldownSeconds}) {
    _cooldownTimer?.cancel();

    setState(() {
      _cooldownSecondsRemaining = seconds;
    });

    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      if (_cooldownSecondsRemaining <= 1) {
        setState(() {
          _cooldownSecondsRemaining = 0;
        });
        timer.cancel();
        return;
      }

      setState(() {
        _cooldownSecondsRemaining -= 1;
      });
    });
  }

  int _extractCooldownSeconds(String message) {
    final match = RegExp(r'(\d+)s').firstMatch(message);
    if (match == null) {
      return _requestCooldownSeconds;
    }
    return int.tryParse(match.group(1) ?? '') ?? _requestCooldownSeconds;
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

  Future<void> _sendResetLink() async {
    final email = emailController.text.trim();

    if (email.isEmpty || !email.contains('@')) {
      setState(() {
        _emailError = 'Please enter a valid email address.';
      });
      return;
    }

    setState(() {
      _emailError = null;
      _isSubmitting = true;
    });

    try {
      final response = await AuthService.forgotPassword(email: email);
      final cooldown = response['cooldownSeconds'] is int
          ? response['cooldownSeconds'] as int
          : _requestCooldownSeconds;
      _startCooldown(seconds: cooldown);

      if (!mounted) {
        return;
      }

      _showMessage(
        response['message']?.toString() ?? 'Reset OTP sent to your email.',
      );

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ResetOtpVerificationPage(
            email: email,
            resendCooldownSeconds: cooldown,
          ),
        ),
      );
    } catch (error) {
      final message = error.toString().replaceFirst('Exception: ', '');
      final cooldown = _extractCooldownSeconds(message);
      _startCooldown(seconds: cooldown);
      _showMessage(message, isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
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
                  padding: const EdgeInsets.all(20),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: Column(
                      children: [
                        /// Back Button
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
                              "Back",
                              style: TextStyle(fontSize: 14),
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),

                        /// Card
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
                              /// Icon
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
                                  Icons.vpn_key_outlined,
                                  color: Colors.white,
                                  size: 32,
                                ),
                              ),

                              const SizedBox(height: 25),

                              /// Title
                              const Text(
                                "Reset password",
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF111827),
                                ),
                              ),

                              const SizedBox(height: 8),

                              /// Subtitle
                              const Text(
                                "Enter your email to receive a 6-digit reset OTP code",
                                style: TextStyle(
                                  color: Color(0xFF6B7280),
                                  fontSize: 14,
                                ),
                              ),

                              const SizedBox(height: 30),

                              /// Email Field
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    "Email address",
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),

                                  const SizedBox(height: 8),

                                  TextField(
                                    controller: emailController,
                                    keyboardType: TextInputType.emailAddress,
                                    decoration: InputDecoration(
                                      hintText: "Enter your email",
                                      errorText: _emailError,
                                      prefixIcon: const Icon(
                                        Icons.email_outlined,
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
                                ],
                              ),

                              const SizedBox(height: 30),

                              /// Send Reset Button
                              SizedBox(
                                width: double.infinity,
                                child: MouseRegion(
                                  onEnter: (_) {
                                    setState(() => _sendResetHover = true);
                                  },
                                  onExit: (_) {
                                    setState(() => _sendResetHover = false);
                                  },
                                  child: GestureDetector(
                                    onTap:
                                        (_isSubmitting ||
                                            _cooldownSecondsRemaining > 0)
                                        ? null
                                        : _sendResetLink,
                                    child: AnimatedContainer(
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      height: 56,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(16),
                                        gradient: LinearGradient(
                                          colors: _sendResetHover
                                              ? const [
                                                  Color(0xFF0050C8),
                                                  Color(0xFF003A8F),
                                                ]
                                              : const [
                                                  Color(0xFF00C6FF),
                                                  Color(0xFF0072FF),
                                                ],
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF0072FF)
                                                .withValues(
                                                  alpha: _sendResetHover
                                                      ? 0.5
                                                      : 0.3,
                                                ),
                                            blurRadius: _sendResetHover
                                                ? 35
                                                : 20,
                                            offset: const Offset(0, 10),
                                          ),
                                        ],
                                      ),
                                      alignment: Alignment.center,
                                      child: _isSubmitting
                                          ? const SizedBox(
                                              width: 22,
                                              height: 22,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2.4,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                      Color
                                                    >(Colors.white),
                                              ),
                                            )
                                          : Text(
                                              _cooldownSecondsRemaining > 0
                                                  ? "OTP sent. Request again in ${_cooldownSecondsRemaining}s"
                                                  : "Send new reset OTP code",
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.white,
                                              ),
                                            ),
                                    ),
                                  ),
                                ),
                              ),

                              const SizedBox(height: 20),

                              /// Back to Login
                              TextButton.icon(
                                onPressed: () => Navigator.pop(context),
                                style: ButtonStyle(
                                  foregroundColor:
                                      WidgetStateProperty.resolveWith((states) {
                                        if (states.contains(
                                          WidgetState.hovered,
                                        )) {
                                          return const Color(0xFF0072FF);
                                        }
                                        return const Color(0xFF6B7280);
                                      }),
                                  overlayColor: WidgetStateProperty.resolveWith(
                                    (states) {
                                      if (states.contains(
                                        WidgetState.hovered,
                                      )) {
                                        return const Color(0x1F3B82F6);
                                      }
                                      return Colors.transparent;
                                    },
                                  ),
                                ),
                                icon: const Icon(Icons.login),
                                label: const Text("Back to login"),
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
