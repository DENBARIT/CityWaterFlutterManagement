import 'dart:convert';

import 'package:city_water_flutter/config/api_config.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AnnouncementFeed {
  const AnnouncementFeed({required this.unreadCount, required this.items});

  final int unreadCount;
  final List<UserAnnouncement> items;

  factory AnnouncementFeed.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final parsedItems = (itemsRaw is List)
        ? itemsRaw
              .whereType<Map<String, dynamic>>()
              .map(UserAnnouncement.fromJson)
              .toList()
        : <UserAnnouncement>[];

    return AnnouncementFeed(
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      items: parsedItems,
    );
  }
}

class UserAnnouncement {
  const UserAnnouncement({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.isRead,
  });

  final String id;
  final String title;
  final String message;
  final DateTime? createdAt;
  final bool isRead;

  factory UserAnnouncement.fromJson(Map<String, dynamic> json) {
    final createdAtText = json['createdAt']?.toString();

    return UserAnnouncement(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      createdAt: createdAtText == null
          ? null
          : DateTime.tryParse(createdAtText),
      isRead: json['isRead'] == true,
    );
  }
}

class AnnouncementService {
  static Future<String> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('login_access_token') ?? '';
  }

  static Future<AnnouncementFeed> fetchAnnouncements() async {
    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/announcements');
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
                'Failed to load announcements')
          : 'Failed to load announcements';
      throw Exception(message);
    }

    final data = (decoded is Map<String, dynamic>)
        ? (decoded['data'] is Map<String, dynamic>
              ? decoded['data'] as Map<String, dynamic>
              : decoded)
        : <String, dynamic>{};

    return AnnouncementFeed.fromJson(data);
  }

  static Future<int> markAnnouncementAsRead(String announcementId) async {
    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final id = announcementId.trim();
    if (id.isEmpty) {
      throw Exception('Announcement id is required.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/announcements/$id/read');
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
                'Failed to mark announcement as read')
          : 'Failed to mark announcement as read';
      throw Exception(message);
    }

    final payload = (decoded is Map<String, dynamic>)
        ? (decoded['data'] is Map<String, dynamic>
              ? decoded['data'] as Map<String, dynamic>
              : decoded)
        : <String, dynamic>{};

    return (payload['unreadCount'] as num?)?.toInt() ?? 0;
  }
}
