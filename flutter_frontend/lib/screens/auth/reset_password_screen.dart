import 'package:flutter/material.dart';
import 'package:city_water_flutter/services/auth_service.dart';
import 'package:city_water_flutter/screens/auth/login_screen.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';

class ResetPasswordPage extends StatefulWidget {
  final String email;
  final String otp;

  const ResetPasswordPage({super.key, required this.email, required this.otp});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isSubmitting = false;
  bool _showNewPassword = false;
  double _passwordStrength = 0;
  Color _strengthColor = Colors.grey;

  String get _passwordStrengthLabel {
    if (_passwordStrength <= 0.34) {
      return 'Weak';
    }

    if (_passwordStrength <= 0.69) {
      return 'Medium';
    }

    return 'Strong';
  }

  void _updatePasswordStrength(String value) {
    final hasLower = RegExp(r'[a-z]').hasMatch(value);
    final hasUpper = RegExp(r'[A-Z]').hasMatch(value);
    final hasNumber = RegExp(r'[0-9]').hasMatch(value);
    final hasSpecial = RegExp(r'[@$!%*?&#~]').hasMatch(value);

    int score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (hasLower) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    final normalized = score / 6;

    setState(() {
      if (value.isEmpty) {
        _passwordStrength = 0;
        _strengthColor = Colors.grey;
      } else if (normalized <= 0.34) {
        _passwordStrength = normalized.clamp(0.2, 0.34);
        _strengthColor = Colors.red;
      } else if (normalized <= 0.69) {
        _passwordStrength = normalized;
        _strengthColor = Colors.orange;
      } else {
        _passwordStrength = normalized;
        _strengthColor = Colors.green;
      }
    });
  }

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
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

  Future<void> _submitReset() async {
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (newPassword.length < 8) {
      _showMessage(
        'New password must be at least 8 characters.',
        isError: true,
      );
      return;
    }

    if (!RegExp(r'[A-Z]').hasMatch(newPassword)) {
      _showMessage('Password must contain an uppercase letter.', isError: true);
      return;
    }

    if (!RegExp(r'[0-9]').hasMatch(newPassword)) {
      _showMessage('Password must contain a number.', isError: true);
      return;
    }

    if (newPassword != confirmPassword) {
      _showMessage('Passwords do not match.', isError: true);
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await AuthService.resetPassword(
        email: widget.email,
        otp: widget.otp,
        newPassword: newPassword,
      );

      if (!mounted) {
        return;
      }

      _showMessage(
        response['message']?.toString() ?? 'Password reset successful.',
      );

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
                                  Icons.lock_reset,
                                  color: Colors.white,
                                  size: 32,
                                ),
                              ),
                              const SizedBox(height: 25),
                              const Text(
                                'Create new password',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Set a new password for ${widget.email}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Color(0xFF6B7280),
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 24),
                              TextField(
                                controller: _newPasswordController,
                                obscureText: !_showNewPassword,
                                onChanged: _updatePasswordStrength,
                                decoration: InputDecoration(
                                  hintText: 'New password',
                                  prefixIcon: const Icon(Icons.lock_outline),
                                  suffixIcon: IconButton(
                                    onPressed: () {
                                      setState(() {
                                        _showNewPassword = !_showNewPassword;
                                      });
                                    },
                                    icon: Icon(
                                      _showNewPassword
                                          ? Icons.visibility_off
                                          : Icons.visibility,
                                    ),
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
                              const SizedBox(height: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: LinearProgressIndicator(
                                      value: _passwordStrength,
                                      minHeight: 6,
                                      backgroundColor: Colors.grey.shade300,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        _strengthColor,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    _passwordStrength == 0
                                        ? 'Enter password'
                                        : _passwordStrengthLabel == 'Weak'
                                        ? 'Weak password'
                                        : _passwordStrengthLabel == 'Medium'
                                        ? 'Medium password'
                                        : 'Strong password',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: _strengthColor,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              TextField(
                                controller: _confirmPasswordController,
                                obscureText: true,
                                decoration: InputDecoration(
                                  hintText: 'Confirm password',
                                  prefixIcon: const Icon(
                                    Icons.lock_person_outlined,
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
                                  onTap: _isSubmitting ? null : _submitReset,
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
                                            'Reset Password',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
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
