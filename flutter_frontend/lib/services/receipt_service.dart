import 'dart:io';

import 'package:city_water_flutter/services/billing_service.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class ReceiptService {
  static Future<File> generateReceipt(BillingBill bill) async {
    final document = pw.Document();
    final paidAt = bill.paidAt ?? DateTime.now();
    final receiptId = _receiptIdFor(bill);

    document.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(28),
          theme: pw.ThemeData.withFont(base: pw.Font.helvetica()),
        ),
        build: (context) {
          return [
            pw.Container(
              padding: const pw.EdgeInsets.all(20),
              decoration: pw.BoxDecoration(
                gradient: pw.LinearGradient(
                  colors: [
                    PdfColor.fromInt(0xFF0B3B67),
                    PdfColor.fromInt(0xFF1E90FF),
                  ],
                  begin: pw.Alignment.topLeft,
                  end: pw.Alignment.bottomRight,
                ),
                borderRadius: pw.BorderRadius.circular(18),
              ),
              child: pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'AquaConnect Water Receipt',
                        style: pw.TextStyle(
                          color: PdfColors.white,
                          fontSize: 22,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'Payment confirmed and ready for download',
                        style: pw.TextStyle(
                          color: PdfColors.white,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                  pw.Container(
                    padding: const pw.EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: pw.BoxDecoration(
                      color: PdfColors.white,
                      borderRadius: pw.BorderRadius.circular(999),
                    ),
                    child: pw.Text(
                      'PAID',
                      style: pw.TextStyle(
                        color: PdfColors.green800,
                        fontSize: 11,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 18),
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: _infoCard(
                    title: 'Receipt Details',
                    children: [
                      _infoRow('Receipt No.', receiptId),
                      _infoRow('Cycle', bill.cycleKey),
                      _infoRow('Paid At', _formatDateTime(paidAt)),
                      _infoRow('Status', 'PAID'),
                    ],
                  ),
                ),
                pw.SizedBox(width: 12),
                pw.Expanded(
                  child: _infoCard(
                    title: 'Customer Details',
                    children: [
                      _infoRow('Name', bill.customerName),
                      _infoRow('Email', bill.customerEmail),
                      _infoRow('Meter No.', bill.meterNumber),
                    ],
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 18),
            _infoCard(
              title: 'Bill Summary',
              children: [
                _summaryRow('Previous Reading', _formatInt(bill.previousReadingValue ?? 0)),
                _summaryRow('Current Reading', _formatInt(bill.readingValue)),
                _summaryRow('Consumption', '${bill.consumption.toStringAsFixed(2)} m³'),
                _summaryRow('Tariff per m³', '${bill.tariffPerCubicMeter.toStringAsFixed(2)} ETB'),
                pw.Divider(color: PdfColors.grey300),
                _summaryRow(
                  'Amount Paid',
                  '${bill.amountDue.toStringAsFixed(2)} ETB',
                  emphasize: true,
                ),
              ],
            ),
            pw.SizedBox(height: 18),
            _infoCard(
              title: 'Payment Reference',
              children: [
                pw.Text(
                  bill.paymentReference?.trim().isNotEmpty == true
                      ? bill.paymentReference!.trim()
                      : 'No payment reference provided.',
                  style: const pw.TextStyle(fontSize: 11),
                ),
              ],
            ),
            pw.SizedBox(height: 18),
            pw.Container(
              padding: const pw.EdgeInsets.all(14),
              decoration: pw.BoxDecoration(
                color: PdfColors.blue50,
                borderRadius: pw.BorderRadius.circular(14),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Thank you for paying your water bill.',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.blue900,
                    ),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'Please keep this receipt for your records.',
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                ],
              ),
            ),
          ];
        },
      ),
    );

    final file = await _receiptFileFor(bill);
    await file.writeAsBytes(await document.save());
    return file;
  }

  static Future<void> downloadReceipt(BillingBill bill) async {
    final file = await generateReceipt(bill);
    await shareReceiptFile(file);
  }

  static Future<void> shareReceiptFile(File file) async {
    final bytes = await file.readAsBytes();
    await Printing.sharePdf(bytes: bytes, filename: file.uri.pathSegments.last);
  }

  static pw.Widget _infoCard({
    required String title,
    required List<pw.Widget> children,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(16),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(16),
        border: pw.Border.all(color: PdfColors.grey300, width: 1),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            title,
            style: pw.TextStyle(
              fontSize: 13,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.blue900,
            ),
          ),
          pw.SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }

  static pw.Widget _infoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 6),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 92,
            child: pw.Text(
              label,
              style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              value,
              style: const pw.TextStyle(
                fontSize: 10,
                color: PdfColors.black,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _summaryRow(
    String label,
    String value, {
    bool emphasize = false,
  }) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 8),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(
              fontSize: emphasize ? 11 : 10,
              fontWeight: emphasize ? pw.FontWeight.bold : pw.FontWeight.normal,
            ),
          ),
          pw.Text(
            value,
            style: pw.TextStyle(
              fontSize: emphasize ? 11 : 10,
              fontWeight: emphasize ? pw.FontWeight.bold : pw.FontWeight.normal,
              color: emphasize ? PdfColors.blue900 : PdfColors.black,
            ),
          ),
        ],
      ),
    );
  }

  static Future<File> _receiptFileFor(BillingBill bill) async {
    final directory = await getApplicationDocumentsDirectory();
    final receiptsDirectory = Directory('${directory.path}${Platform.pathSeparator}receipts');
    if (!await receiptsDirectory.exists()) {
      await receiptsDirectory.create(recursive: true);
    }

    final safeCycle = bill.cycleKey.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
    final safeMeter = bill.meterNumber.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
    final fileName = 'receipt_${safeCycle}_$safeMeter.pdf';
    return File('${receiptsDirectory.path}${Platform.pathSeparator}$fileName');
  }

  static String _receiptIdFor(BillingBill bill) {
    final reference = bill.paymentReference?.trim();
    if (reference != null && reference.isNotEmpty) {
      return reference;
    }
    return 'RCPT-${bill.cycleKey}-${bill.id.substring(0, bill.id.length > 8 ? 8 : bill.id.length)}';
  }

  static String _formatDateTime(DateTime value) {
    final local = value.toLocal();
    final year = local.year.toString().padLeft(4, '0');
    final month = local.month.toString().padLeft(2, '0');
    final day = local.day.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$year-$month-$day $hour:$minute';
  }

  static String _formatInt(int value) => value.toString();
}