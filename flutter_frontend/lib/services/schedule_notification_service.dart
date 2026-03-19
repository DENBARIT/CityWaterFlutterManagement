import 'dart:convert';

import 'package:city_water_flutter/config/api_config.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ScheduleNotificationFeed {
  const ScheduleNotificationFeed({
    required this.unreadCount,
    required this.items,
  });

  final int unreadCount;
  final List<ScheduleNotificationItem> items;

  factory ScheduleNotificationFeed.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final parsedItems = (itemsRaw is List)
        ? itemsRaw
              .whereType<Map<String, dynamic>>()
              .map(ScheduleNotificationItem.fromJson)
              .toList()
        : <ScheduleNotificationItem>[];

    return ScheduleNotificationFeed(
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      items: parsedItems,
    );
  }
}

class ScheduleNotificationItem {
  const ScheduleNotificationItem({
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

  factory ScheduleNotificationItem.fromJson(Map<String, dynamic> json) {
    final createdAtText = json['createdAt']?.toString();

    return ScheduleNotificationItem(
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

class ScheduleNotificationService {
  static Future<String> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('login_access_token') ?? '';
  }

  static Future<ScheduleNotificationFeed> fetchScheduleNotifications() async {
    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/schedule-notifications');
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
                'Failed to load schedule notifications')
          : 'Failed to load schedule notifications';
      throw Exception(message);
    }

    final data = (decoded is Map<String, dynamic>)
        ? (decoded['data'] is Map<String, dynamic>
              ? decoded['data'] as Map<String, dynamic>
              : decoded)
        : <String, dynamic>{};

    return ScheduleNotificationFeed.fromJson(data);
  }
}

class WaterScheduleFeed {
  const WaterScheduleFeed({required this.items});

  final List<WaterScheduleItem> items;

  factory WaterScheduleFeed.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final parsedItems = (itemsRaw is List)
        ? itemsRaw
              .whereType<Map<String, dynamic>>()
              .map(WaterScheduleItem.fromJson)
              .toList()
        : <WaterScheduleItem>[];

    return WaterScheduleFeed(items: parsedItems);
  }
}

class WaterScheduleItem {
  const WaterScheduleItem({
    required this.id,
    required this.day,
    required this.dayLabel,
    required this.dayAm,
    required this.startTime,
    required this.endTime,
    required this.startTime12,
    required this.endTime12,
    required this.note,
    required this.messageGregorian,
    required this.messageEthiopian,
    required this.woredaName,
    required this.createdAt,
  });

  final String id;
  final String day;
  final String dayLabel;
  final String dayAm;
  final String startTime;
  final String endTime;
  final String startTime12;
  final String endTime12;
  final String note;
  final String messageGregorian;
  final String messageEthiopian;
  final String woredaName;
  final DateTime? createdAt;

  static String _formatTime12(String value) {
    final raw = value.trim();
    if (!raw.contains(':')) {
      return raw;
    }

    final parts = raw.split(':');
    if (parts.length < 2) {
      return raw;
    }

    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) {
      return raw;
    }

    final period = hour >= 12 ? 'PM' : 'AM';
    final hour12 = hour % 12 == 0 ? 12 : hour % 12;
    return '${hour12.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')} $period';
  }

  factory WaterScheduleItem.fromJson(Map<String, dynamic> json) {
    final createdAtText = json['createdAt']?.toString();
    final startTimeRaw = json['startTime']?.toString() ?? '';
    final endTimeRaw = json['endTime']?.toString() ?? '';
    final startTime12Raw = json['startTime12']?.toString() ?? '';
    final endTime12Raw = json['endTime12']?.toString() ?? '';
    final woreda = json['woreda'];
    final dayLabel = json['dayLabel']?.toString() ?? '';
    final dayAm = json['dayAm']?.toString() ?? '';
    final messageGregorianRaw = json['messageGregorian']?.toString() ?? '';
    final messageEthiopianRaw = json['messageEthiopian']?.toString() ?? '';

    final normalizedStartTime = startTimeRaw.length >= 5
        ? startTimeRaw.substring(0, 5)
        : startTimeRaw;
    final normalizedEndTime = endTimeRaw.length >= 5
        ? endTimeRaw.substring(0, 5)
        : endTimeRaw;

    final start12 = startTime12Raw.isNotEmpty
        ? startTime12Raw
        : _formatTime12(normalizedStartTime);
    final end12 = endTime12Raw.isNotEmpty
        ? endTime12Raw
        : _formatTime12(normalizedEndTime);

    final messageGregorian = messageGregorianRaw.isNotEmpty
        ? messageGregorianRaw
        : '${dayLabel.isNotEmpty ? dayLabel : (json['day']?.toString() ?? '')} from $start12 to $end12';

    final messageEthiopian = messageEthiopianRaw.isNotEmpty
        ? messageEthiopianRaw
        : '${dayAm.isNotEmpty ? dayAm : ''} ከ $start12 እስከ $end12';

    return WaterScheduleItem(
      id: json['id']?.toString() ?? '',
      day: json['day']?.toString() ?? '',
      dayLabel: dayLabel,
      dayAm: dayAm,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      startTime12: start12,
      endTime12: end12,
      note: json['note']?.toString() ?? '',
      messageGregorian: messageGregorian,
      messageEthiopian: messageEthiopian,
      woredaName: woreda is Map<String, dynamic>
          ? woreda['name']?.toString() ?? ''
          : '',
      createdAt: createdAtText == null
          ? null
          : DateTime.tryParse(createdAtText),
    );
  }
}

class WaterScheduleService {
  static Future<String> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('login_access_token') ?? '';
  }

  static Future<WaterScheduleFeed> fetchSchedules() async {
    final token = await _token();
    if (token.isEmpty) {
      throw Exception('Missing login token.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/schedules');
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
                'Failed to load schedules')
          : 'Failed to load schedules';
      throw Exception(message);
    }

    final data = (decoded is Map<String, dynamic>)
        ? (decoded['data'] is Map<String, dynamic>
              ? decoded['data'] as Map<String, dynamic>
              : decoded)
        : <String, dynamic>{};

    return WaterScheduleFeed.fromJson(data);
  }
}
