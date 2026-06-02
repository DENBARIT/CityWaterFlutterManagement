import 'package:flutter/foundation.dart';

class ApiConfig {
  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');

    if (fromEnv.isNotEmpty) {
      return fromEnv;
    }

    if (kIsWeb) {
      return 'http://localhost:5001';
    }

    return 'http://10.4.105.105:5001';
  }
}
