import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dropdown_search/dropdown_search.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:city_water_flutter/services/auth_service.dart';
import 'package:city_water_flutter/services/location_service.dart';
import 'package:city_water_flutter/screens/auth/email_verification_screen.dart';
import 'package:city_water_flutter/screens/auth/login_screen.dart';
import 'package:city_water_flutter/screens/legal/privacy_policy_page.dart';
import 'package:city_water_flutter/screens/legal/terms_of_service_page.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';

class CreateAccountScreen extends StatefulWidget {
  const CreateAccountScreen({super.key});

  @override
  State<CreateAccountScreen> createState() => _CreateAccountScreenState();
}

class _CreateAccountScreenState extends State<CreateAccountScreen> {
  final TextEditingController fullName = TextEditingController();
  final TextEditingController phone = TextEditingController();
  final TextEditingController email = TextEditingController();
  final TextEditingController nationalId = TextEditingController();
  final TextEditingController meterNumber = TextEditingController();
  final TextEditingController password = TextEditingController();
  final TextEditingController confirmPassword = TextEditingController();
  final FlutterTts _tts = FlutterTts();
  double _passwordStrength = 0;
  Color _strengthColor = Colors.grey;
  bool _createHover = false;
  bool _signInHover = false;
  bool _signInPressed = false;
  bool _isSubmitting = false;
  bool _acceptTerms = false;
  String? emailError;
  List<Map<String, String>> subCities = [];
  List<Map<String, String>> woredas = [];
  bool _isLoadingLocations = true;
  String? _locationError;

  @override
  void initState() {
    super.initState();
    fullName.addListener(_onFormChanged);
    phone.addListener(_onFormChanged);
    email.addListener(_onFormChanged);
    nationalId.addListener(_onFormChanged);
    meterNumber.addListener(_onFormChanged);
    password.addListener(_onFormChanged);
    confirmPassword.addListener(_onFormChanged);
    _loadSubCities();
  }

  void _onFormChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    fullName.removeListener(_onFormChanged);
    phone.removeListener(_onFormChanged);
    email.removeListener(_onFormChanged);
    nationalId.removeListener(_onFormChanged);
    meterNumber.removeListener(_onFormChanged);
    password.removeListener(_onFormChanged);
    confirmPassword.removeListener(_onFormChanged);
    fullName.dispose();
    phone.dispose();
    email.dispose();
    nationalId.dispose();
    meterNumber.dispose();
    password.dispose();
    confirmPassword.dispose();
    super.dispose();
  }

  bool showPassword = false;

  String? selectedSubCity;
  String? selectedWoreda;

  bool get isFormValid {
    return fullName.text.isNotEmpty &&
        phone.text.isNotEmpty &&
        email.text.isNotEmpty &&
        password.text.isNotEmpty &&
        confirmPassword.text.isNotEmpty &&
        selectedSubCity != null &&
        selectedWoreda != null &&
        _acceptTerms;
  }

  String get passwordStrength {
    if (password.text.length < 6) {
      return "Weak";
    }

    if (password.text.length < 10) {
      return "Medium";
    }

    return "Strong";
  }

  void _updatePasswordStrength(String value) {
    setState(() {
      if (value.length < 4) {
        _passwordStrength = 0.25;
        _strengthColor = Colors.red;
      } else if (value.length < 7) {
        _passwordStrength = 0.5;
        _strengthColor = Colors.orange;
      } else if (value.length < 10) {
        _passwordStrength = 0.75;
        _strengthColor = Colors.blue;
      } else {
        _passwordStrength = 1;
        _strengthColor = Colors.green;
      }
    });
  }

  Future<void> _loadSubCities() async {
    setState(() {
      _isLoadingLocations = true;
      _locationError = null;
    });

    try {
      final subCityData = await LocationService.fetchSubCities();

      if (!mounted) {
        return;
      }

      setState(() {
        subCities = subCityData;
        _isLoadingLocations = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoadingLocations = false;
        _locationError = 'Failed to load sub cities. Check backend connection.';
      });
    }
  }

  Future<void> _loadWoredas(String subCityId) async {
    setState(() {
      woredas = [];
      _locationError = null;
      selectedWoreda = null;
    });

    try {
      final woredaData = await LocationService.fetchWoredas(subCityId);

      if (!mounted) {
        return;
      }

      setState(() {
        woredas = woredaData;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _locationError = 'Failed to load woredas. Please try again.';
      });
    }
  }

  String? _selectedNameById(List<Map<String, String>> items, String? id) {
    if (id == null) {
      return null;
    }

    for (final item in items) {
      if (item['id'] == id) {
        return item['name'];
      }
    }

    return null;
  }

  Widget inputField(
    String label,
    String hint,
    TextEditingController controller, {
    bool obscure = false,
    Widget? suffix,
    String? prefixText,
    TextInputType keyboardType = TextInputType.text,
    ValueChanged<String>? onChanged,
    String? errorText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),

        const SizedBox(height: 6),

        TextField(
          controller: controller,
          inputFormatters: label == "Phone Number"
              ? [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(9),
                ]
              : label == "National ID (FIN Number)"
              ? [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(12),
                ]
              : label == "Meter Number"
              ? [FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9\-]'))]
              : null,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: GoogleFonts.syne(
            color: Colors.black,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          cursorColor: Colors.black,
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hint,
            errorText: errorText,
            hintStyle: GoogleFonts.syne(
              color: const Color(0xFFD1D5DB),
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
            filled: true,
            fillColor: const Color(0xffE3F2FD),
            prefixText: prefixText,
            prefixStyle: prefixText != null
                ? GoogleFonts.syne(
                    color: Colors.black,
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  )
                : null,
            suffixIcon: suffix,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xff1E90FF), width: 2),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
          ),
        ),

        const SizedBox(height: 14),
      ],
    );
  }

  void _goBackToLogin() {
    Navigator.of(
      context,
    ).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> speak(String text) async {
    await _tts.speak(text);
  }

  Widget _createAccountButton() {
    final bool enabled = isFormValid && !_isSubmitting;

    return MouseRegion(
      onEnter: (_) => setState(() => _createHover = true),
      onExit: (_) => setState(() => _createHover = false),
      cursor: enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: GestureDetector(
        onTap: enabled
            ? () async {
                if (!_acceptTerms) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Please accept the Terms and Privacy Policy.',
                      ),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  return;
                }

                final String fullNameValue = fullName.text.trim();

                if (fullNameValue.split(' ').length < 2) {
                  _showError('Please enter your first and last name.');
                  return;
                }

                if (phone.text.length != 9) {
                  _showError("Phone number must be 9 digits after +251.");
                  return;
                }

                if (nationalId.text.length != 12) {
                  _showError("FIN must be exactly 12 digits.");
                  return;
                }

                if (!email.text.contains("@gmail.com")) {
                  _showError("Email must be a @gmail.com address.");
                  return;
                }

                if (!RegExp(r'^MTR-\d{5}$').hasMatch(meterNumber.text)) {
                  _showError("Meter number must be in format MTR-12345");
                  return;
                }

                if (password.text != confirmPassword.text) {
                  _showError("Passwords do not match.");
                  return;
                }

                if (selectedSubCity == null || selectedWoreda == null) {
                  _showError('Please select both sub city and woreda.');
                  return;
                }

                setState(() {
                  _isSubmitting = true;
                });

                final String phoneE164 = _toE164(phone.text.trim());

                await SystemSound.play(SystemSoundType.click);
                await speak("Creating account");

                try {
                  final response = await AuthService.registerCustomer(
                    fullName: fullNameValue,
                    phoneE164: phoneE164,
                    email: email.text.trim(),
                    password: password.text,
                    nationalId: nationalId.text.trim(),
                    meterNumber: meterNumber.text.trim(),
                    subCityId: selectedSubCity!,
                    woredaId: selectedWoreda!,
                  );

                  final verificationEmail =
                      response['email']?.toString().trim().isNotEmpty == true
                      ? response['email'].toString().trim()
                      : email.text.trim();

                  if (!mounted) {
                    return;
                  }

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          EmailVerificationPage(email: verificationEmail),
                    ),
                  );
                } catch (error) {
                  _showError(error.toString().replaceFirst('Exception: ', ''));
                } finally {
                  if (mounted) {
                    setState(() {
                      _isSubmitting = false;
                    });
                  }
                }
              }
            : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: enabled
                ? LinearGradient(
                    colors: _createHover
                        ? const [Color(0xFF0050C8), Color(0xFF003A8F)]
                        : const [Color(0xFF00C6FF), Color(0xFF0072FF)],
                  )
                : LinearGradient(
                    colors: [Colors.grey.shade400, Colors.grey.shade500],
                  ),
            boxShadow: enabled
                ? [
                    BoxShadow(
                      color: const Color(
                        0xFF0072FF,
                      ).withValues(alpha: _createHover ? 0.5 : 0.3),
                      blurRadius: _createHover ? 35 : 20,
                      offset: const Offset(0, 10),
                    ),
                  ]
                : [],
          ),
          alignment: Alignment.center,
          child: _isSubmitting
              ? const SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text(
                  "Create Account",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
        ),
      ),
    );
  }

  String _toE164(String value) {
    if (value.startsWith('+')) {
      return value;
    }

    if (value.startsWith('0')) {
      return '+251${value.substring(1)}';
    }

    return '+251$value';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const Positioned.fill(child: AuthBackground()),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  /// Back Button
                  TextButton.icon(
                    onPressed: _goBackToLogin,
                    style: ButtonStyle(
                      foregroundColor: WidgetStateProperty.resolveWith((
                        states,
                      ) {
                        if (states.contains(WidgetState.hovered)) {
                          return const Color(0xFF0072FF);
                        }
                        return const Color(0xFF6B7280);
                      }),
                      overlayColor: WidgetStateProperty.resolveWith((states) {
                        if (states.contains(WidgetState.hovered)) {
                          return const Color(0x1F3B82F6);
                        }
                        return Colors.transparent;
                      }),
                    ),
                    icon: const Icon(Icons.arrow_back, size: 20),
                    label: const Text(
                      "Back",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  /// Title
                  const Text(
                    "Create Account",
                    style: TextStyle(
                      fontSize: 38,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 5),

                  const Text(
                    "Join us and manage your utilities",
                    style: TextStyle(fontSize: 18, color: Colors.black),
                  ),

                  const SizedBox(height: 20),

                  if (_isLoadingLocations)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 12),
                      child: LinearProgressIndicator(minHeight: 3),
                    ),

                  if (_locationError != null)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEAEA),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _locationError!,
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                          TextButton(
                            onPressed: _loadSubCities,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),

                  /// Secure box
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xffE5F4FE),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: const [
                        CircleAvatar(
                          backgroundColor: Color(0xff1E90FF),
                          radius: 12,
                          child: Icon(
                            Icons.security,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),

                        SizedBox(width: 10),

                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Secure Registration",
                                style: TextStyle(
                                  color: Color(0xff1E90FF),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),

                              SizedBox(height: 3),

                              Text(
                                "Your data is encrypted and protected with industry-standard security protocols.",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  /// FORM
                  inputField("Full Name", "Eleni Tesfaye", fullName),

                  inputField(
                    "Phone Number",
                    "912345678",
                    phone,
                    prefixText: '+251 ',
                    keyboardType: TextInputType.phone,
                  ),

                  inputField(
                    "Email",
                    "eleni.tesfaye@gmail.com",
                    email,
                    keyboardType: TextInputType.emailAddress,
                    errorText: emailError,
                    onChanged: (value) {
                      setState(() {
                        if (!value.contains("@gmail.com")) {
                          emailError = "Email must be a @gmail.com address";
                        } else {
                          emailError = null;
                        }
                      });
                    },
                  ),

                  inputField(
                    "National ID (FIN Number)",
                    "Your 12-Digit FIN Number",
                    nationalId,
                  ),

                  inputField(
                    "Meter Number",
                    "MTR-00123",
                    meterNumber,
                    onChanged: (value) {
                      if (!value.startsWith("MTR-")) {
                        meterNumber.text = "MTR-";
                        meterNumber.selection = TextSelection.fromPosition(
                          const TextPosition(offset: 4),
                        );
                        return;
                      }

                      if (value.length > 9) {
                        meterNumber.text = value.substring(0, 9);
                        meterNumber.selection = TextSelection.fromPosition(
                          TextPosition(offset: meterNumber.text.length),
                        );
                      }
                    },
                  ),

                  /// Sub City
                  const Text(
                    "Sub City",
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 6),

                  DropdownSearch<String>(
                    popupProps: PopupProps.menu(
                      showSearchBox: true,
                      searchFieldProps: const TextFieldProps(
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        cursorColor: Colors.black,
                        decoration: InputDecoration(
                          hintText: "Search Sub City",
                          hintStyle: TextStyle(
                            color: Color(0xFF6B7280),
                            fontSize: 14,
                          ),
                          prefixIcon: Icon(Icons.search),
                        ),
                      ),
                    ),
                    items: subCities.map((e) => e["name"]!).toList(),
                    selectedItem: _selectedNameById(subCities, selectedSubCity),
                    dropdownDecoratorProps: DropDownDecoratorProps(
                      dropdownSearchDecoration: InputDecoration(
                        hintText: "Select Sub City",
                        hintStyle: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 14,
                        ),
                        filled: true,
                        fillColor: const Color(0xffE6EEF5),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: Color(0xff1E90FF),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                    dropdownBuilder: (context, selectedItem) {
                      return Text(
                        selectedItem ?? "Select Sub City",
                        style: TextStyle(
                          color: selectedItem == null
                              ? const Color(0xFF6B7280)
                              : Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      );
                    },
                    onChanged: (value) async {
                      if (value == null) {
                        return;
                      }

                      final selected = subCities.firstWhere(
                        (c) => c["name"] == value,
                      );

                      setState(() {
                        selectedSubCity = selected["id"];
                        selectedWoreda = null;
                      });

                      await _loadWoredas(selected["id"]!);
                    },
                  ),

                  const SizedBox(height: 14),

                  /// Woreda
                  const Text(
                    "Woreda",
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 6),

                  DropdownSearch<String>(
                    popupProps: PopupProps.menu(
                      showSearchBox: true,
                      searchFieldProps: const TextFieldProps(
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        cursorColor: Colors.black,
                        decoration: InputDecoration(
                          hintText: "Search Woreda",
                          hintStyle: TextStyle(
                            color: Color(0xFF6B7280),
                            fontSize: 14,
                          ),
                          prefixIcon: Icon(Icons.search),
                        ),
                      ),
                    ),
                    items: woredas.map((e) => e["name"]!).toList(),
                    selectedItem: _selectedNameById(woredas, selectedWoreda),
                    dropdownDecoratorProps: DropDownDecoratorProps(
                      dropdownSearchDecoration: InputDecoration(
                        hintText: "Select Woreda",
                        hintStyle: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 14,
                        ),
                        filled: true,
                        fillColor: const Color(0xffE6EEF5),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: Color(0xff1E90FF),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                    dropdownBuilder: (context, selectedItem) {
                      return Text(
                        selectedItem ?? "Select Woreda",
                        style: TextStyle(
                          color: selectedItem == null
                              ? const Color(0xFF6B7280)
                              : Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      );
                    },
                    onChanged: (value) {
                      if (value == null) {
                        return;
                      }

                      final selected = woredas.firstWhere(
                        (w) => w["name"] == value,
                      );

                      setState(() {
                        selectedWoreda = selected["id"];
                      });
                    },
                  ),

                  const SizedBox(height: 20),

                  /// Password
                  inputField(
                    "Password",
                    "Enter password",
                    password,
                    obscure: !showPassword,
                    onChanged: _updatePasswordStrength,
                    suffix: IconButton(
                      icon: Icon(
                        showPassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          showPassword = !showPassword;
                        });
                      },
                    ),
                  ),

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
                        passwordStrength == "Weak"
                            ? "Weak password"
                            : passwordStrength == "Medium"
                            ? "Medium password"
                            : "Strong password",
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: _strengthColor,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  /// Confirm Password
                  inputField(
                    "Confirm Password",
                    "Re-enter password",
                    confirmPassword,
                    obscure: true,
                  ),

                  const SizedBox(height: 10),

                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _acceptTerms,
                        activeColor: const Color(0xFF0072FF),
                        onChanged: _isSubmitting
                            ? null
                            : (value) {
                                setState(() {
                                  _acceptTerms = value ?? false;
                                });
                              },
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Wrap(
                            children: [
                              const Text(
                                'I agree to the ',
                                style: TextStyle(
                                  color: Color(0xFF111827),
                                  fontSize: 14,
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          const TermsOfServicePage(),
                                    ),
                                  );
                                },
                                child: const Text(
                                  'Terms of Service',
                                  style: TextStyle(
                                    color: Color(0xFF1E90FF),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    decoration: TextDecoration.underline,
                                    decorationColor: Color(0xFF1E90FF),
                                  ),
                                ),
                              ),
                              const Text(
                                ' and ',
                                style: TextStyle(
                                  color: Color(0xFF111827),
                                  fontSize: 14,
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => const PrivacyPolicyPage(),
                                    ),
                                  );
                                },
                                child: const Text(
                                  'Privacy Policy',
                                  style: TextStyle(
                                    color: Color(0xFF1E90FF),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    decoration: TextDecoration.underline,
                                    decorationColor: Color(0xFF1E90FF),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 6),

                  /// Create Button
                  SizedBox(
                    width: double.infinity,
                    child: _createAccountButton(),
                  ),

                  const SizedBox(height: 15),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.security, size: 16, color: Color(0xFF0072FF)),
                      SizedBox(width: 6),
                      Text("Secure", style: TextStyle(color: Colors.black)),
                      SizedBox(width: 15),

                      Icon(
                        Icons.enhanced_encryption,
                        size: 16,
                        color: Color(0xFF0072FF),
                      ),
                      SizedBox(width: 6),
                      Text("Encrypted", style: TextStyle(color: Colors.black)),
                      SizedBox(width: 15),

                      Icon(Icons.shield, size: 16, color: Color(0xFF0072FF)),
                      SizedBox(width: 6),
                      Text("Private", style: TextStyle(color: Colors.black)),
                    ],
                  ),

                  const SizedBox(height: 20),

                  /// Sign In
                  Center(
                    child: MouseRegion(
                      onEnter: (_) => setState(() => _signInHover = true),
                      onExit: (_) => setState(() => _signInHover = false),
                      cursor: SystemMouseCursors.click,
                      child: GestureDetector(
                        onTapDown: (_) {
                          setState(() => _signInPressed = true);
                        },
                        onTapCancel: () {
                          setState(() => _signInPressed = false);
                        },
                        onTapUp: (_) {
                          setState(() => _signInPressed = false);
                        },
                        onTap: _goBackToLogin,
                        child: RichText(
                          text: TextSpan(
                            style: const TextStyle(color: Colors.black),
                            children: [
                              const TextSpan(text: "Already have an account? "),
                              TextSpan(
                                text: "Sign In",
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: (_signInHover || _signInPressed)
                                      ? const Color(0xFF003A8F)
                                      : const Color(0xFF3B82F6),
                                  decoration: (_signInHover || _signInPressed)
                                      ? TextDecoration.underline
                                      : TextDecoration.none,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
