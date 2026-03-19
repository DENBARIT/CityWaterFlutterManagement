import 'dart:convert';

import 'package:city_water_flutter/config/api_config.dart';
// import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:http/http.dart' as http;

class AuthService {
  static const bool facebookLoginEnabled = false;

  static Future<Map<String, dynamic>> login({
    required String phoneOrEmail,
    required String password,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/login');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'emailOrPhone': phoneOrEmail, 'password': password}),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 && decoded is Map<String, dynamic>) {
      return decoded;
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static Future<Map<String, dynamic>> socialLogin({
    required String provider,
    required String email,
    String? providerToken,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/social-login');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'provider': provider,
        'email': email,
        'providerToken': providerToken,
      }),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 && decoded is Map<String, dynamic>) {
      return decoded;
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static Future<Map<String, dynamic>> loginWithFacebook() async {
    throw Exception(
      'Facebook sign-in is not configured for this build. Use Google or email login.',
    );
  }

  static Future<Map<String, dynamic>> registerCustomer({
    required String fullName,
    required String phoneE164,
    required String email,
    required String password,
    required String nationalId,
    required String meterNumber,
    required String subCityId,
    required String woredaId,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/register');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'fullName': fullName,
        'phoneE164': phoneE164,
        'email': email,
        'password': password,
        'nationalId': nationalId,
        'meterNumber': meterNumber,
        'subCityId': subCityId,
        'woredaId': woredaId,
      }),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 || response.statusCode == 201) {
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }

      return <String, dynamic>{};
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static Future<Map<String, dynamic>> validateOtp({
    required String email,
    required String otp,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/validate-otp');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'otp': otp}),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 && decoded is Map<String, dynamic>) {
      return decoded;
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static Future<Map<String, dynamic>> resendOtp({required String email}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/resend-otp');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 && decoded is Map<String, dynamic>) {
      return decoded;
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static Future<Map<String, dynamic>> forgotPassword({
    required String email,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/forgot-password');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 && decoded is Map<String, dynamic>) {
      return decoded;
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/reset-password');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      }),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 && decoded is Map<String, dynamic>) {
      return decoded;
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static Future<Map<String, dynamic>> validateResetOtp({
    required String email,
    required String otp,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/validate-reset-otp');

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'otp': otp}),
    );

    final decoded = _decodeBody(response.body);

    if (response.statusCode == 200 && decoded is Map<String, dynamic>) {
      return decoded;
    }

    throw Exception(_extractErrorMessage(decoded));
  }

  static dynamic _decodeBody(String body) {
    try {
      return jsonDecode(body);
    } catch (_) {
      return null;
    }
  }

  static String _extractErrorMessage(dynamic decoded) {
    if (decoded is Map<String, dynamic>) {
      if (decoded['message'] is String) {
        final message = decoded['message'] as String;

        if (decoded['errors'] is List) {
          final errors = decoded['errors'] as List<dynamic>;
          final details = errors
              .whereType<Map<String, dynamic>>()
              .expand((e) => (e['messages'] as List<dynamic>? ?? const []))
              .whereType<String>()
              .toList();

          if (details.isNotEmpty) {
            return '$message\n- ${details.join('\n- ')}';
          }
        }

        return message;
      }
    }

    return 'Registration failed. Please try again.';
  }
}
