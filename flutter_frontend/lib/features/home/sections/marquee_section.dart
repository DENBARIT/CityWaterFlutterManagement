part of '../main.dart';

// Marquee section for valued customers
class _ValuedCustomersMarquee extends StatelessWidget {
  const _ValuedCustomersMarquee();

  static const List<String> customerPhotos = <String>[
    'assets/valued customer/customers.jpg',
    'assets/valued customer/admin.jpg',
    'assets/valued customer/aa.png',
    'assets/valued customer/images.jpg',
    'assets/valued customer/research.jpg',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18),
      color: _testimonialSectionBg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          const Text(
            'Valued customers',
            style: TextStyle(
              fontFamily: 'Georgia',
              fontWeight: FontWeight.w800,
              fontSize: 22,
              color: _headingColor,
              letterSpacing: 0.7,
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(height: 104, child: _PhotoMarquee(items: customerPhotos)),
        ],
      ),
    );
  }
}

// Simple marquee effect using animation
class _PhotoMarquee extends StatefulWidget {
  const _PhotoMarquee({required this.items});
  final List<String> items;

  @override
  State<_PhotoMarquee> createState() => _PhotoMarqueeState();
}

class _PhotoMarqueeState extends State<_PhotoMarquee>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  static const double _chipWidth = 104;
  static const double _chipGap = 18;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 16),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final double oneTrackWidth = widget.items.length * (_chipWidth + _chipGap);

    Widget buildTrack() {
      return Row(
        children: widget.items
            .map<Widget>(
              (String assetPath) => Padding(
                padding: const EdgeInsets.only(right: _chipGap),
                child: SizedBox(
                  width: _chipWidth,
                  child: Column(
                    children: <Widget>[
                      Container(
                        width: 92,
                        height: 92,
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          border: Border.all(color: _cardBorder, width: 1.2),
                          boxShadow: <BoxShadow>[
                            BoxShadow(
                              color: _primaryBlue.withValues(alpha: 0.18),
                              blurRadius: 14,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Image.asset(assetPath, fit: BoxFit.cover),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
            .toList(),
      );
    }

    return ClipRect(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (BuildContext context, Widget? child) {
          final double offset = -(_controller.value * oneTrackWidth);
          return Stack(
            children: <Widget>[
              Positioned(left: offset, child: buildTrack()),
              Positioned(left: offset + oneTrackWidth, child: buildTrack()),
            ],
          );
        },
      ),
    );
  }
}
