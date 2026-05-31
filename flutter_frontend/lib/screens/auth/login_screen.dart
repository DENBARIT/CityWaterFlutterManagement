import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:city_water_flutter/my_flutter_app/main.dart' as aqua_home;
import 'package:city_water_flutter/screens/auth/forgot_password_screen.dart';
import 'package:city_water_flutter/screens/auth/register_screen.dart';
import 'package:city_water_flutter/screens/post_sign_in_page.dart';
import 'package:city_water_flutter/services/auth_service.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final syneFontFamily = GoogleFonts.syne().fontFamily;

    return MaterialApp(
      title: 'Login',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: syneFontFamily,
        textTheme: GoogleFonts.syneTextTheme(),
        primaryTextTheme: GoogleFonts.syneTextTheme(),
      ),
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final FocusNode _emailFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();

  bool _isPhone = false;
  bool _forgotHover = false;
  bool _signupHover = false;
  bool _signupPressed = false;
  bool _signinHover = false;
  bool _homeHover = false;
  bool _showPassword = false;
  bool _isSubmitting = false;
  final Map<String, bool> _socialHover = <String, bool>{};

  String _toE164Phone(String rawPhone) {
    final trimmed = rawPhone.trim();
    if (trimmed.startsWith('+')) {
      return trimmed;
    }

    if (trimmed.startsWith('0')) {
      return '+251${trimmed.substring(1)}';
    }

    return trimmed;
  }

  String _deriveDisplayName(String identifier) {
    final value = identifier.trim();
    if (value.contains('@')) {
      final local = value.split('@').first;
      if (local.isNotEmpty) {
        return local;
      }
    }

    if (value.isNotEmpty) {
      return value;
    }

    return 'User';
  }

  Future<void> _handleSignIn() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final identifier = _isPhone
          ? _toE164Phone(_emailController.text)
          : _emailController.text.trim();

      final loginResult = await AuthService.login(
        phoneOrEmail: identifier,
        password: _passwordController.text,
      );
      final data = loginResult['data'] as Map<String, dynamic>?;
      final userName = data?['fullName']?.toString().trim().isNotEmpty == true
          ? data!['fullName'].toString().trim()
          : _deriveDisplayName(identifier);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('is_logged_in', true);
      await prefs.setString('logged_in_username', userName);
      if (data != null) {
        await prefs.setString(
          'login_access_token',
          data['accessToken']?.toString() ?? '',
        );
        await prefs.setString(
          'login_refresh_token',
          data['refreshToken']?.toString() ?? '',
        );
      }

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const PostSignInPage()),
        (route) => false,
      );
    } catch (error) {
      if (!mounted) return;
      final text = error.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _handleFacebookSignIn() async {
    if (_isSubmitting) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final result = await AuthService.loginWithFacebook();
      final data = result['data'] as Map<String, dynamic>?;
      final userName =
          result['displayName']?.toString().trim().isNotEmpty == true
          ? result['displayName'].toString().trim()
          : result['email'].toString().split('@').first;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('is_logged_in', true);
      await prefs.setString('logged_in_username', userName);
      if (data != null) {
        await prefs.setString(
          'login_access_token',
          data['accessToken']?.toString() ?? '',
        );
        await prefs.setString(
          'login_refresh_token',
          data['refreshToken']?.toString() ?? '',
        );
      }

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const PostSignInPage()),
        (route) => false,
      );
    } catch (error) {
      if (!mounted) return;
      final text = error.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _emailFocus.addListener(_onFocusChanged);
    _passwordFocus.addListener(_onFocusChanged);
  }

  void _onFocusChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final isMobile = screenWidth <= 450;
    // Make the login card a bit wider on larger screens and slightly wider on mobile
    final cardWidth = screenWidth > 450 ? 520.0 : screenWidth * 0.94;
    final verticalPadding = isMobile ? 12.0 : 32.0;
    final viewportCardHeight = screenHeight - (verticalPadding * 2);
    final cardHeight = isMobile
        ? (viewportCardHeight > 620 ? viewportCardHeight : 620.0)
        : 877.0;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const Positioned.fill(child: AuthBackground()),
          Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(vertical: verticalPadding),
              child: SizedBox(
                width: cardWidth,
                height: cardHeight,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(40),
                  child: Container(
                    width: cardWidth,
                    height: cardHeight,
                    color: Colors.transparent,
                    child: Stack(
                      children: [
                        // Back home button positioned just above the welcome text
                        Positioned(
                          left: 40,
                          top: 150,
                          child: MouseRegion(
                            cursor: SystemMouseCursors.click,
                            onEnter: (_) => setState(() => _homeHover = true),
                            onExit: (_) => setState(() => _homeHover = false),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () {
                                  Navigator.of(context).pushAndRemoveUntil(
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          const aqua_home.AquaConnectHome(),
                                    ),
                                    (route) => false,
                                  );
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 180),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _homeHover
                                        ? const Color(0xFF0B3B67)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.arrow_back_ios_new,
                                        size: 16,
                                        color: _homeHover
                                            ? Colors.white
                                            : const Color(0xFF0B3B67),
                                      ),
                                      const SizedBox(width: 8),
                                      // Fancy single-colored (gradient) text when idle, white on hover
                                      _homeHover
                                          ? RichText(
                                              text: TextSpan(
                                                style: GoogleFonts.syne(
                                                  textStyle: const TextStyle(
                                                    color: Colors.white,
                                                    shadows: [
                                                      Shadow(
                                                        color: Colors.black26,
                                                        offset: Offset(0, 2),
                                                        blurRadius: 4,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                children: const [
                                                  TextSpan(
                                                    text: 'Back ',
                                                    style: TextStyle(
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                  TextSpan(
                                                    text: 'home',
                                                    style: TextStyle(
                                                      fontSize: 15,
                                                      fontWeight: FontWeight.w900,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            )
                                          : ShaderMask(
                                              shaderCallback: (bounds) =>
                                                  const LinearGradient(
                                                colors: [
                                                  Color(0xFF00C6FF),
                                                  Color(0xFF0072FF),
                                                ],
                                              ).createShader(bounds),
                                              blendMode: BlendMode.srcIn,
                                              child: RichText(
                                                text: TextSpan(
                                                  style: GoogleFonts.syne(
                                                    textStyle: const TextStyle(
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                  children: const [
                                                    TextSpan(
                                                      text: 'Back ',
                                                      style: TextStyle(
                                                        fontSize: 13,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                    ),
                                                    TextSpan(
                                                      text: 'home',
                                                      style: TextStyle(
                                                        fontSize: 15,
                                                        fontWeight:
                                                            FontWeight.w900,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(40, 200, 40, 40),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header
                                const Text(
                                  'Welcome Back!',
                                  style: TextStyle(
                                    fontSize: 30,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF111827),
                                    height: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Sign in to your account to continue',
                                  style: TextStyle(
                                    fontSize: 15,
                                    color: Color(0xFF6B7280),
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 36),
                                Row(
                                  children: [
                                    GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _isPhone = false;
                                        });
                                      },
                                      child: Text(
                                        "Email",
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: !_isPhone
                                              ? const Color(0xFF0072FF)
                                              : const Color(0xFF6B7280),
                                        ),
                                      ),
                                    ),

                                    const SizedBox(width: 6),

                                    const Text(
                                      "/",
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),

                                    const SizedBox(width: 6),

                                    GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _isPhone = true;
                                        });
                                      },
                                      child: Text(
                                        "Phone",
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: _isPhone
                                              ? const Color(0xFF0072FF)
                                              : const Color(0xFF6B7280),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                _inputField(
                                  controller: _emailController,
                                  hint: _isPhone
                                      ? 'Enter your phone number'
                                      : 'Enter your email',
                                  prefixIcon: _isPhone
                                      ? Icons.phone_outlined
                                      : Icons.email_outlined,
                                  keyboardType: _isPhone
                                      ? TextInputType.phone
                                      : TextInputType.emailAddress,
                                ),
                                const SizedBox(height: 16),

                                // Password
                                _label('Password'),
                                const SizedBox(height: 6),
                                _passwordField(),
                                const SizedBox(height: 10),

                                Align(
                                  alignment: Alignment.centerRight,
                                  child: MouseRegion(
                                    onEnter: (_) {
                                      setState(() => _forgotHover = true);
                                    },
                                    onExit: (_) {
                                      setState(() => _forgotHover = false);
                                    },
                                    child: GestureDetector(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const ForgotPasswordPage(),
                                          ),
                                        );
                                      },
                                      child: AnimatedDefaultTextStyle(
                                        duration: const Duration(
                                          milliseconds: 200,
                                        ),
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: _forgotHover
                                              ? const Color(0xFF003A8F)
                                              : const Color(0xFF3B82F6),
                                          decoration: _forgotHover
                                              ? TextDecoration.underline
                                              : TextDecoration.none,
                                        ),
                                        child: const Text('Forgot Password?'),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 28),

                                // Sign In button
                                _gradientButton('Sign In', () {
                                  _handleSignIn();
                                }),
                                const SizedBox(height: 14),

                                // Sign up
                                Center(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text(
                                        "Don't have an account? ",
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF111827),
                                        ),
                                      ),
                                      MouseRegion(
                                        onEnter: (_) => setState(
                                          () => _signupHover = true,
                                        ),
                                        onExit: (_) => setState(
                                          () => _signupHover = false,
                                        ),
                                        child: GestureDetector(
                                          behavior: HitTestBehavior.opaque,
                                          onTapDown: (_) {
                                            setState(() {
                                              _signupPressed = true;
                                            });
                                          },
                                          onTapCancel: () {
                                            setState(() {
                                              _signupPressed = false;
                                            });
                                          },
                                          onTapUp: (_) {
                                            setState(() {
                                              _signupPressed = false;
                                            });
                                          },
                                          onTap: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (_) =>
                                                    const CreateAccountScreen(),
                                              ),
                                            );
                                          },
                                          child: AnimatedContainer(
                                            duration: const Duration(
                                              milliseconds: 180,
                                            ),
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 12,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: (_signupHover ||
                                                      _signupPressed)
                                                  ? const Color(0xFFEAF3FF)
                                                  : const Color(0xFFF8FBFF),
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                              border: Border.all(
                                                color: (_signupHover ||
                                                        _signupPressed)
                                                    ? const Color(0xFF1E88E5)
                                                    : const Color(0xFFBFDBFE),
                                              ),
                                            ),
                                            child: AnimatedDefaultTextStyle(
                                              duration: const Duration(
                                                milliseconds: 180,
                                              ),
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w800,
                                                color: (_signupHover ||
                                                        _signupPressed)
                                                    ? const Color(0xFF003A8F)
                                                    : const Color(0xFF1E88E5),
                                                decoration: TextDecoration.none,
                                              ),
                                              child: const Text('Sign Up'),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 18),

                                // Divider
                                _orDivider(),
                                const SizedBox(height: 20),

                                // Social buttons
                                if (AuthService.facebookLoginEnabled)
                                  _socialButton(
                                    label: 'Facebook',
                                    icon: const FaIcon(
                                      FontAwesomeIcons.facebook,
                                      size: 18,
                                      color: Color(0xFF1877F2),
                                    ),
                                    onTap: _handleFacebookSignIn,
                                  ),

                              ],
                            ),
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

  Widget _label(String text) => Text(
    text,
    style: const TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w500,
      color: Color(0xFF4B5563),
    ),
  );

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 56,
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _emailFocus.hasFocus
              ? const Color(0xFF0072FF)
              : const Color(0xFFE5E7EB),
          width: _emailFocus.hasFocus ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          const SizedBox(width: 16),
          Icon(
            prefixIcon,
            color: _emailFocus.hasFocus
                ? const Color(0xFF0072FF)
                : const Color(0xFF9CA3AF),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextFormField(
              controller: controller,
              focusNode: _emailFocus,
              keyboardType: keyboardType,
              style: const TextStyle(fontSize: 15, color: Color(0xFF1F2937)),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(
                  color: Color(0xFF9CA3AF),
                  fontSize: 15,
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
              validator: (v) {
                if (v == null || v.isEmpty) {
                  return 'Required';
                }

                if (_isPhone) {
                  final phoneRegex = RegExp(r'^(09|07)\d{8}$');
                  if (!phoneRegex.hasMatch(v)) {
                    return 'Enter valid Ethiopian phone';
                  }
                }

                return null;
              },
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }

  Widget _passwordField() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 56,
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _passwordFocus.hasFocus
              ? const Color(0xFF0072FF)
              : const Color(0xFFE5E7EB),
          width: _passwordFocus.hasFocus ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          const SizedBox(width: 16),
          Icon(
            Icons.lock_outline,
            color: _passwordFocus.hasFocus
                ? const Color(0xFF0072FF)
                : const Color(0xFF9CA3AF),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextFormField(
              controller: _passwordController,
              focusNode: _passwordFocus,
              obscureText: !_showPassword,
              style: const TextStyle(fontSize: 15, color: Color(0xFF1F2937)),
              decoration: const InputDecoration(
                hintText: 'Enter your password',
                hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 15),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _showPassword = !_showPassword),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Icon(
                _showPassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                color: _passwordFocus.hasFocus
                    ? const Color(0xFF0072FF)
                    : const Color(0xFF9CA3AF),
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _gradientButton(String label, VoidCallback onTap) {
    return MouseRegion(
      onEnter: (_) => setState(() => _signinHover = true),
      onExit: (_) => setState(() => _signinHover = false),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: _signinHover
                  ? const [Color(0xFF0050C8), Color(0xFF003A8F)]
                  : const [Color(0xFF00C6FF), Color(0xFF0072FF)],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(
                  0xFF0072FF,
                ).withValues(alpha: _signinHover ? 0.5 : 0.3),
                blurRadius: _signinHover ? 35 : 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: _isSubmitting
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
        ),
      ),
    );
  }

  Widget _orDivider() {
    return Row(
      children: const [
        Expanded(child: Divider(color: Color(0xFFE5E7EB), thickness: 1)),
        Expanded(child: Divider(color: Color(0xFFE5E7EB), thickness: 1)),
      ],
    );
  }

  Widget _socialButton({
    required String label,
    required Widget icon,
    required VoidCallback onTap,
  }) {
    final bool hover = _socialHover[label] ?? false;

    return MouseRegion(
      onEnter: (_) => setState(() => _socialHover[label] = true),
      onExit: (_) => setState(() => _socialHover[label] = false),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 50,
          decoration: BoxDecoration(
            color: hover ? const Color(0xFFEAF3FF) : const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: hover ? const Color(0xFF0072FF) : const Color(0xFFE5E7EB),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              icon,
              const SizedBox(width: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  color: hover
                      ? const Color(0xFF0072FF)
                      : const Color(0xFF4B5563),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

}
