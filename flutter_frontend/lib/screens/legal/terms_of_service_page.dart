import 'package:flutter/material.dart';
import 'package:city_water_flutter/widgets/auth_background.dart';

class TermsOfServicePage extends StatelessWidget {
  const TermsOfServicePage({super.key});

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
        title: const Text('Terms of Service'),
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4A90E2), Color(0xFF357ABD)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Text(
                          'Please read these terms carefully before using the City Water Administration System.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            height: 1.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _sectionCard(
                        '1. Introduction',
                        'By creating an account and using this application, you agree to comply with these terms.',
                      ),
                      _sectionCard(
                        '2. User Responsibilities',
                        'Users must provide accurate information and ensure that submitted meter readings are correct.',
                      ),
                      _sectionCard(
                        '3. Meter Reading Submission',
                        'Meter readings should be submitted using the application\'s OCR scanning system.',
                      ),
                      _sectionCard(
                        '4. Accuracy of Data',
                        'Submitting false meter readings may lead to account suspension.',
                      ),
                      _sectionCard(
                        '5. Account Security',
                        'Users are responsible for maintaining the confidentiality of their account credentials.',
                      ),
                      _sectionCard(
                        '6. Service Availability',
                        'The system may occasionally be unavailable due to maintenance or technical updates.',
                      ),
                      _sectionCard(
                        '7. Account Termination',
                        'Accounts that violate system rules may be suspended or removed.',
                      ),
                      _sectionCard(
                        '8. Changes to Terms',
                        'These terms may be updated periodically as the system evolves.',
                      ),
                      const SizedBox(height: 20),
                      const Center(
                        child: Text(
                          'Last Updated: March 2026',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                          ),
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
