import 'dart:convert';

import 'package:city_water_flutter/config/api_config.dart';
import 'package:city_water_flutter/services/location_service.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ComplaintLocation {
  const ComplaintLocation({
    required this.subCityId,
    required this.woredaId,
    required this.subCityName,
    required this.woredaName,
  });

  final String subCityId;
  final String woredaId;
  final String subCityName;
  final String woredaName;
}

class ComplaintService {
  static Future<String> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('login_access_token') ?? '';
  }

  static Future<ComplaintLocation> fetchRegisteredLocation() async {
    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/me');
    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final decoded = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = (decoded is Map<String, dynamic>)
          ? (decoded['message']?.toString() ?? 'Failed to load profile data')
          : 'Failed to load profile data';
      throw Exception(message);
    }

    final payload = (decoded is Map<String, dynamic>)
        ? (decoded['data'] is Map<String, dynamic>
              ? decoded['data'] as Map<String, dynamic>
              : decoded)
        : <String, dynamic>{};

    final subCityId = payload['subCityId']?.toString() ?? '';
    final woredaId = payload['woredaId']?.toString() ?? '';

    if (subCityId.isEmpty || woredaId.isEmpty) {
      throw Exception('Your profile is missing sub city or woreda assignment.');
    }

    final subCities = await LocationService.fetchSubCities();
    final woredas = await LocationService.fetchWoredas(subCityId);

    final subCityName =
        subCities.firstWhere(
          (item) => item['id'] == subCityId,
          orElse: () => {'name': ''},
        )['name'] ??
        '';

    final woredaName =
        woredas.firstWhere(
          (item) => item['id'] == woredaId,
          orElse: () => {'name': ''},
        )['name'] ??
        '';

    return ComplaintLocation(
      subCityId: subCityId,
      woredaId: woredaId,
      subCityName: subCityName,
      woredaName: woredaName,
    );
  }

  static String _normalizeCategory(String category) {
    final normalized = category.trim().toUpperCase();

    switch (normalized) {
      case 'METER':
        return 'METER_DAMAGE';
      default:
        return normalized.isEmpty ? 'OTHER' : normalized;
    }
  }

  static Future<Map<String, dynamic>> submitComplaint({
    required String title,
    required String description,
    required String category,
    String? location,
  }) async {
    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/complaints');
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title.trim(),
        'description': description.trim(),
        'category': _normalizeCategory(category),
        if ((location ?? '').trim().isNotEmpty) 'location': location!.trim(),
      }),
    );

    final decoded = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = (decoded is Map<String, dynamic>)
          ? (decoded['message']?.toString() ?? 'Failed to submit complaint')
          : 'Failed to submit complaint';
      throw Exception(message);
    }

    final data = (decoded is Map<String, dynamic>)
        ? (decoded['data'] is Map<String, dynamic>
              ? decoded['data'] as Map<String, dynamic>
              : decoded)
        : <String, dynamic>{};

    return data;
  }
}

class ComplaintNotificationFeed {
  const ComplaintNotificationFeed({
    required this.unreadCount,
    required this.items,
  });

  final int unreadCount;
  final List<ComplaintNotificationItem> items;

  factory ComplaintNotificationFeed.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final parsedItems = (itemsRaw is List)
        ? itemsRaw
              .whereType<Map<String, dynamic>>()
              .map(ComplaintNotificationItem.fromJson)
              .where((item) => item.type == 'COMPLAINT_UPDATE')
              .toList()
        : <ComplaintNotificationItem>[];

    return ComplaintNotificationFeed(
      unreadCount: parsedItems.where((item) => !item.isRead).length,
      items: parsedItems,
    );
  }
}

class ComplaintNotificationItem {
  const ComplaintNotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.isRead,
    required this.type,
    required this.complaintId,
    required this.complaintTitle,
    required this.complaintCategory,
    required this.sentById,
  });

  final String id;
  final String title;
  final String message;
  final DateTime? createdAt;
  final bool isRead;
  final String type;
  final String complaintId;
  final String complaintTitle;
  final String complaintCategory;
  final String sentById;

  factory ComplaintNotificationItem.fromJson(Map<String, dynamic> json) {
    final createdAtText = json['createdAt']?.toString();
    final data = json['data'];
    final dataMap = data is Map<String, dynamic>
        ? data
        : const <String, dynamic>{};

    return ComplaintNotificationItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      createdAt: createdAtText == null
          ? null
          : DateTime.tryParse(createdAtText),
      isRead: json['isRead'] == true,
      type: json['type']?.toString() ?? '',
      complaintId: dataMap['complaintId']?.toString() ?? '',
      complaintTitle: dataMap['complaintTitle']?.toString() ?? '',
      complaintCategory: dataMap['complaintCategory']?.toString() ?? '',
      sentById: dataMap['sentById']?.toString() ?? '',
    );
  }
}

class ComplaintNotificationService {
  static Future<String> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('login_access_token') ?? '';
  }

  static Future<ComplaintNotificationFeed> fetchComplaintNotifications() async {
    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/notifications');
    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final decoded = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = (decoded is Map<String, dynamic>)
          ? (decoded['message']?.toString() ??
                decoded['error']?.toString() ??
                'Failed to load complaint notifications')
          : 'Failed to load complaint notifications';
      throw Exception(message);
    }

    final data = (decoded is Map<String, dynamic>)
        ? (decoded['data'] is Map<String, dynamic>
              ? decoded['data'] as Map<String, dynamic>
              : decoded)
        : <String, dynamic>{};

    return ComplaintNotificationFeed.fromJson(data);
  }

  static Future<void> markComplaintNotificationAsRead(
    String notificationId,
  ) async {
    final id = notificationId.trim();
    if (id.isEmpty) {
      return;
    }

    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/notifications/$id/read');
    final response = await http.patch(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final decoded = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = (decoded is Map<String, dynamic>)
          ? (decoded['message']?.toString() ??
                decoded['error']?.toString() ??
                'Failed to mark complaint notification as read')
          : 'Failed to mark complaint notification as read';
      throw Exception(message);
    }
  }
}
