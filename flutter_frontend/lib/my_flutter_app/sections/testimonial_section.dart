part of '../main.dart';

class _TestimonialSection extends StatelessWidget {
  const _TestimonialSection({required this.testimonials});

  final List<TestimonialData> testimonials;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: _testimonialSectionBg,
      child: _SectionShell(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Testimonials',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Georgia',
                ),
              ),
            ),
            const SizedBox(height: 14),
            TestimonialCarousel(testimonials: testimonials),
          ],
        ),
      ),
    );
  }
}
