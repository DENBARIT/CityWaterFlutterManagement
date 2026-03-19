import 'dart:convert';

import 'package:city_water_flutter/config/api_config.dart';
import 'package:http/http.dart' as http;

class LocationService {
  static Future<List<Map<String, String>>> fetchSubCities() async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/locations/sub-cities');
    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Failed to fetch sub cities');
    }

    final decoded = jsonDecode(response.body);
    final List<dynamic> list = _extractDataList(decoded);

    return list
        .map(
          (item) => {
            'id': item['id'].toString(),
            'name': item['name'].toString(),
          },
        )
        .toList();
  }

  static Future<List<Map<String, String>>> fetchWoredas(
    String subCityId,
  ) async {
    final uri = Uri.parse(
      '${ApiConfig.baseUrl}/locations/woredas?subCityId=$subCityId',
    );
    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Failed to fetch woredas');
    }

    final decoded = jsonDecode(response.body);
    final List<dynamic> list = _extractDataList(decoded);

    return list
        .map(
          (item) => {
            'id': item['id'].toString(),
            'name': item['name'].toString(),
            'subCityId': item['subCityId'].toString(),
          },
        )
        .toList();
  }

  static List<dynamic> _extractDataList(dynamic decoded) {
    if (decoded is Map<String, dynamic> && decoded['data'] is List<dynamic>) {
      return decoded['data'] as List<dynamic>;
    }

    if (decoded is List<dynamic>) {
      return decoded;
    }

    return <dynamic>[];
  }
}
