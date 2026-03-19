import 'package:flutter/material.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  Widget _sectionCard(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(
              fontSize: 14.5,
              height: 1.6,
              color: Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: const Text('Privacy Policy'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF111827),
        elevation: 0,
      ),
      body: Stack(
        children: [
          const Positioned.fill(child: AuthBackground()),
          Container(
            color: Colors.white.withValues(alpha: 0.9),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF00C6FF), Color(0xFF0072FF)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Text(
                          'Your privacy is important to us. This policy explains how we collect and protect your information.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            height: 1.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _sectionCard(
                        '1. Information We Collect',
                        'We collect information such as email address, meter number, and submitted meter readings.',
                      ),
                      _sectionCard(
                        '2. How We Use Data',
                        'Your data is used to manage water usage records and generate billing information.',
                      ),
                      _sectionCard(
                        '3. Meter Image Processing',
                        'Images captured for meter readings are processed using OCR technology.',
                      ),
                      _sectionCard(
                        '4. Data Security',
                        'Security measures are implemented to protect user information from unauthorized access.',
                      ),
                      _sectionCard(
                        '5. Data Sharing',
                        'User information is not shared with third parties except when required by law.',
                      ),
                      _sectionCard(
                        '6. User Rights',
                        'Users may request corrections or updates to their stored personal information.',
                      ),
                      _sectionCard(
                        '7. Policy Updates',
                        'We may update this privacy policy when necessary to reflect system improvements.',
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Last Updated: March 2026',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
