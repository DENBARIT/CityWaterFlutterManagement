import 'dart:convert';

import 'package:city_water_flutter/config/api_config.dart';
import 'package:city_water_flutter/services/ownership_change_service.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class BillingCustomerProfile {
  const BillingCustomerProfile({
    required this.fullName,
    required this.email,
    required this.meterNumber,
  });

  final String fullName;
  final String email;
  final String meterNumber;
}

class BillingTariff {
  const BillingTariff({
    required this.id,
    required this.customerType,
    required this.pricePerCubicMeter,
    required this.effectiveFrom,
  });

  final String id;
  final BillingCustomerType customerType;
  final double pricePerCubicMeter;
  final DateTime effectiveFrom;

  factory BillingTariff.fromJson(Map<String, dynamic> json) {
    return BillingTariff(
      id: json['id']?.toString() ?? '',
      customerType: BillingCustomerTypeParser.fromValue(
        json['customerType']?.toString() ?? '',
      ),
      pricePerCubicMeter:
          double.tryParse(json['pricePerCubicMeter']?.toString() ?? '') ?? 0,
      effectiveFrom:
          DateTime.tryParse(json['effectiveFrom']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'customerType': customerType.apiValue,
      'pricePerCubicMeter': pricePerCubicMeter,
      'effectiveFrom': effectiveFrom.toIso8601String(),
    };
  }
}

enum BillingCustomerType { residential, commercial, governmental }

extension BillingCustomerTypeX on BillingCustomerType {
  String get apiValue => name.toUpperCase();

  String get label {
    switch (this) {
      case BillingCustomerType.residential:
        return 'Residential';
      case BillingCustomerType.commercial:
        return 'Commercial';
      case BillingCustomerType.governmental:
        return 'Governmental';
    }
  }
}

extension BillingCustomerTypeParser on BillingCustomerType {
  static BillingCustomerType fromValue(String value) {
    switch (value.trim().toUpperCase()) {
      case 'COMMERCIAL':
        return BillingCustomerType.commercial;
      case 'GOVERNMENTAL':
        return BillingCustomerType.governmental;
      case 'RESIDENTIAL':
      default:
        return BillingCustomerType.residential;
    }
  }
}

class BillingBill {
  const BillingBill({
    required this.id,
    required this.cycleKey,
    required this.meterNumber,
    required this.customerName,
    required this.customerEmail,
    required this.customerType,
    required this.readingValue,
    required this.previousReadingValue,
    required this.consumption,
    required this.tariffPerCubicMeter,
    required this.amountDue,
    required this.paymentStatus,
    required this.source,
    required this.generatedAt,
    required this.dueDate,
    required this.paymentReference,
    required this.paidAt,
    required this.checkoutUrl,
  });

  final String id;
  final String cycleKey;
  final String meterNumber;
  final String customerName;
  final String customerEmail;
  final BillingCustomerType customerType;
  final int readingValue;
  final int? previousReadingValue;
  final double consumption;
  final double tariffPerCubicMeter;
  final double amountDue;
  final String paymentStatus;
  final String source;
  final DateTime generatedAt;
  final DateTime dueDate;
  final String? paymentReference;
  final DateTime? paidAt;
  final String? checkoutUrl;

  bool get isPaid => paymentStatus.toUpperCase() == 'PAID';

  BillingBill copyWith({
    String? id,
    String? paymentStatus,
    String? paymentReference,
    DateTime? paidAt,
    String? checkoutUrl,
  }) {
    return BillingBill(
      id: id ?? this.id,
      cycleKey: cycleKey,
      meterNumber: meterNumber,
      customerName: customerName,
      customerEmail: customerEmail,
      customerType: customerType,
      readingValue: readingValue,
      previousReadingValue: previousReadingValue,
      consumption: consumption,
      tariffPerCubicMeter: tariffPerCubicMeter,
      amountDue: amountDue,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      source: source,
      generatedAt: generatedAt,
      dueDate: dueDate,
      paymentReference: paymentReference ?? this.paymentReference,
      paidAt: paidAt ?? this.paidAt,
      checkoutUrl: checkoutUrl ?? this.checkoutUrl,
    );
  }

  factory BillingBill.fromJson(Map<String, dynamic> json) {
    return BillingBill(
      id: json['id']?.toString() ?? '',
      cycleKey: json['cycleKey']?.toString() ?? '',
      meterNumber: json['meterNumber']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? '',
      customerEmail: json['customerEmail']?.toString() ?? '',
      customerType: BillingCustomerTypeParser.fromValue(
        json['customerType']?.toString() ?? '',
      ),
      readingValue: int.tryParse(json['readingValue']?.toString() ?? '') ?? 0,
      previousReadingValue: int.tryParse(
        json['previousReadingValue']?.toString() ?? '',
      ),
      consumption: double.tryParse(json['consumption']?.toString() ?? '') ?? 0,
      tariffPerCubicMeter:
          double.tryParse(json['tariffPerCubicMeter']?.toString() ?? '') ?? 0,
      amountDue: double.tryParse(json['amountDue']?.toString() ?? '') ?? 0,
      paymentStatus: json['paymentStatus']?.toString() ?? 'UNPAID',
      source: json['source']?.toString() ?? 'MANUAL',
      generatedAt:
          DateTime.tryParse(json['generatedAt']?.toString() ?? '') ??
          DateTime.now(),
      dueDate:
          DateTime.tryParse(json['dueDate']?.toString() ?? '') ??
          DateTime.now(),
      paymentReference: _toNullableString(json['paymentReference']),
      paidAt: DateTime.tryParse(json['paidAt']?.toString() ?? ''),
      checkoutUrl: _toNullableString(json['checkoutUrl']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'cycleKey': cycleKey,
      'meterNumber': meterNumber,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerType': customerType.apiValue,
      'readingValue': readingValue,
      'previousReadingValue': previousReadingValue,
      'consumption': consumption,
      'tariffPerCubicMeter': tariffPerCubicMeter,
      'amountDue': amountDue,
      'paymentStatus': paymentStatus,
      'source': source,
      'generatedAt': generatedAt.toIso8601String(),
      'dueDate': dueDate.toIso8601String(),
      'paymentReference': paymentReference,
      'paidAt': paidAt?.toIso8601String(),
      'checkoutUrl': checkoutUrl,
    };
  }

  static String? _toNullableString(dynamic value) {
    final raw = value?.toString();
    if (raw == null ||
        raw.trim().isEmpty ||
        raw.trim().toLowerCase() == 'null') {
      return null;
    }
    return raw.trim();
  }
}

enum BillingSubmissionSource { ocr, manual }

class BillingService {
  static const String _tariffCacheKey = 'billing_tariff_cache_v1';
  static const String _customerTypeKey = 'billing_customer_type_v1';

  static String currentCycleKey([DateTime? value]) {
    final date = value ?? DateTime.now();
    final month = date.month.toString().padLeft(2, '0');
    return '${date.year}-$month';
  }

  static String normalizeMeterNumber(String value) {
    final normalized = value.trim().toUpperCase().replaceAll(' ', '');
    if (RegExp(r'^\d{5}$').hasMatch(normalized)) {
      return 'MTR-$normalized';
    }
    return normalized;
  }

  static Future<BillingCustomerProfile> loadLinkedProfile() async {
    final profile = await OwnershipChangeService.fetchUserProfileDetails();
    return BillingCustomerProfile(
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      meterNumber: normalizeMeterNumber(profile.meterNumber),
    );
  }

  static Future<BillingCustomerType> loadSelectedCustomerType() async {
    final prefs = await SharedPreferences.getInstance();
    return BillingCustomerTypeParser.fromValue(
      prefs.getString(_customerTypeKey) ??
          BillingCustomerType.residential.apiValue,
    );
  }

  static Future<void> saveSelectedCustomerType(
    BillingCustomerType customerType,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_customerTypeKey, customerType.apiValue);
  }

  static Future<BillingTariff> loadActiveTariff({
    BillingCustomerType? customerType,
  }) async {
    final selectedCustomerType =
        customerType ?? await loadSelectedCustomerType();
    final prefs = await SharedPreferences.getInstance();
    final cache = prefs.getString(_tariffCacheKey);

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/super-admin/tariffs'),
        headers: await _authHeaders(),
      );

      final decoded = _decodeBody(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(_extractMessage(decoded, 'Unable to load tariff.'));
      }

      final rows =
          _extractRows(decoded)
              .map(BillingTariff.fromJson)
              .where(
                (tariff) =>
                    !tariff.effectiveFrom.isAfter(DateTime.now()) &&
                    tariff.customerType == selectedCustomerType,
              )
              .toList()
            ..sort((a, b) => b.effectiveFrom.compareTo(a.effectiveFrom));

      if (rows.isEmpty) {
        throw Exception('No active tariff is configured yet.');
      }

      final activeTariff = rows.first;
      await prefs.setString(_tariffCacheKey, jsonEncode(activeTariff.toJson()));
      return activeTariff;
    } catch (_) {
      if (cache != null && cache.isNotEmpty) {
        final decodedCache = _decodeBody(cache);
        if (decodedCache is Map<String, dynamic>) {
          final cachedTariff = BillingTariff.fromJson(decodedCache);
          if (cachedTariff.customerType == selectedCustomerType) {
            return cachedTariff;
          }
        }
      }
      rethrow;
    }
  }

  static Future<BillingBill?> loadCurrentBill() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/auth/billing/current'),
      headers: await _authHeaders(),
    );

    final decoded = _decodeBody(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractMessage(decoded, 'Unable to load current bill.'));
    }

    if (decoded is! Map<String, dynamic>) {
      return null;
    }

    final data = decoded['data'];
    if (data is Map<String, dynamic>) {
      return BillingBill.fromJson(data);
    }

    return null;
  }

  static Future<BillingBill> submitReading({
    required String meterNumber,
    required int readingValue,
    int? previousReadingValue,
    BillingCustomerType? customerType,
    required BillingSubmissionSource source,
  }) async {
    final normalizedMeter = normalizeMeterNumber(meterNumber);
    final selectedCustomerType =
        customerType ?? await loadSelectedCustomerType();
    if (readingValue < 0) {
      throw Exception('Meter reading must be a positive number.');
    }

    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/auth/billing/submit-reading'),
      headers: await _authHeaders(),
      body: jsonEncode(<String, dynamic>{
        'meterNumber': normalizedMeter,
        'readingValue': readingValue,
        ...?(previousReadingValue == null
            ? null
            : <String, dynamic>{'previousReadingValue': previousReadingValue}),
        'customerType': selectedCustomerType.apiValue,
        'source': source.name.toUpperCase(),
      }),
    );

    final decoded = _decodeBody(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        _extractMessage(decoded, 'Unable to submit reading and generate bill.'),
      );
    }

    if (decoded is! Map<String, dynamic>) {
      throw Exception('Invalid billing response from server.');
    }

    final data = decoded['data'];
    if (data is! Map<String, dynamic>) {
      throw Exception('Generated bill payload is missing.');
    }

    return BillingBill.fromJson(data);
  }

  static Future<BillingBill> payCurrentBill() async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/auth/billing/pay-current'),
      headers: await _authHeaders(),
    );

    final decoded = _decodeBody(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractMessage(decoded, 'Unable to process payment.'));
    }

    if (decoded is! Map<String, dynamic>) {
      throw Exception('Invalid payment response from server.');
    }

    final data = decoded['data'];
    if (data is Map<String, dynamic>) {
      final billPayload = data['bill'];
      final paymentPayload = data['payment'];
      if (billPayload is Map<String, dynamic>) {
        if (paymentPayload is Map<String, dynamic>) {
          final merged = Map<String, dynamic>.from(billPayload)
            ..addAll(<String, dynamic>{
              'checkoutUrl': paymentPayload['checkoutUrl'],
            });
          return BillingBill.fromJson(merged);
        }
        return BillingBill.fromJson(billPayload);
      }
    }

    throw Exception('Paid bill payload is missing.');
  }

  static Future<Map<String, String>> _authHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('login_access_token') ?? '';

    return <String, String>{
      'Content-Type': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  static dynamic _decodeBody(String body) {
    try {
      return jsonDecode(body);
    } catch (_) {
      return null;
    }
  }

  static List<Map<String, dynamic>> _extractRows(dynamic decoded) {
    if (decoded is List) {
      return decoded.whereType<Map<String, dynamic>>().toList();
    }

    if (decoded is Map<String, dynamic>) {
      final data = decoded['data'];
      if (data is List) {
        return data.whereType<Map<String, dynamic>>().toList();
      }
    }

    return <Map<String, dynamic>>[];
  }

  static String _extractMessage(dynamic decoded, String fallback) {
    if (decoded is Map<String, dynamic>) {
      final message = decoded['message']?.toString().trim();
      if (message != null && message.isNotEmpty) {
        return message;
      }
      final error = decoded['error']?.toString().trim();
      if (error != null && error.isNotEmpty) {
        return error;
      }

      final data = decoded['data'];
      if (data is Map<String, dynamic>) {
        final nestedMessage = data['message']?.toString().trim();
        if (nestedMessage != null && nestedMessage.isNotEmpty) {
          return nestedMessage;
        }
      }
    }

    return fallback;
  }
}
