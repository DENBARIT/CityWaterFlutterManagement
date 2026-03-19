part of '../main.dart';

class _SupportingDigitizationText extends StatefulWidget {
  const _SupportingDigitizationText();

  @override
  State<_SupportingDigitizationText> createState() =>
      _SupportingDigitizationTextState();
}

class _SupportingDigitizationTextState
    extends State<_SupportingDigitizationText>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (BuildContext context, Widget? child) {
        final double t = Curves.easeInOut.transform(_controller.value);
        final double y = lerpDouble(-10, 10, t)!;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Transform.translate(
            offset: Offset(0, y),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                'Accelerating the digitization transformation!',
                textAlign: TextAlign.center,
                maxLines: 1,
                style: TextStyle(
                  fontFamily: 'Georgia',
                  fontWeight: FontWeight.w700,
                  fontSize: 24,
                  color: Color.lerp(
                    const Color(0xFFA8EEFF),
                    const Color(0xFFD5F7FF),
                    t,
                  ),
                  letterSpacing: 0.7,
                  shadows: <Shadow>[
                    Shadow(
                      color: const Color(
                        0xFF12BFE3,
                      ).withValues(alpha: 0.24 + (t * 0.24)),
                      blurRadius: 10 + (10 * t),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _FooterSection extends StatelessWidget {
  const _FooterSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 18),
      color: const Color(0xFF021521),
      child: const FittedBox(
        fit: BoxFit.scaleDown,
        child: Text(
          '2026 @AquaConnect, Ethiopia',
          textAlign: TextAlign.center,
          maxLines: 1,
          style: TextStyle(
            color: Color(0xFF9ADBED),
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
            fontFamily: 'Georgia',
          ),
        ),
      ),
    );
  }
}
