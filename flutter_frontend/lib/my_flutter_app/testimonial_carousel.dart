import 'dart:async';

import 'package:flutter/material.dart';

const Color _headingColor = Color(0xFF0F52BA);
const Color _bodyColor = Color(0xFF424242);
const Color _primaryBlue = Color(0xFF1E88E5);
const Color _cardSurface = Color(0xEBFFFFFF);
const Color _cardBorder = Color(0x331E88E5);
const Color _cardBorderHover = Color(0xFF90CAF9);

class TestimonialData {
  const TestimonialData({
    required this.name,
    required this.role,
    required this.quote,
    required this.rating,
  });

  final String name;
  final String role;
  final String quote;
  final int rating;
}

class TestimonialCarousel extends StatefulWidget {
  const TestimonialCarousel({required this.testimonials, super.key});

  final List<TestimonialData> testimonials;

  @override
  State<TestimonialCarousel> createState() => _TestimonialCarouselState();
}

class _TestimonialCarouselState extends State<TestimonialCarousel> {
  late final int _maxCard;
  late final PageController _pageController;
  late final List<TestimonialData> _testimonials;
  int _currentCard = 0;
  Timer? _autoScrollTimer;
  bool _isPageAnimating = false;

  @override
  void initState() {
    super.initState();
    _testimonials = widget.testimonials;
    _maxCard = _testimonials.length - 1;
    _pageController = PageController(viewportFraction: 0.92, initialPage: 0);
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || _maxCard <= 0) {
        return;
      }

      final int next = _currentCard + 1 > _maxCard ? 0 : _currentCard + 1;
      unawaited(
        _animateToPage(
          next,
          duration: const Duration(milliseconds: 700),
          curve: Curves.easeInOutCubicEmphasized,
        ),
      );
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int idx) {
    setState(() {
      _currentCard = idx;
    });
  }

  Future<void> _animateToPage(
    int page, {
    required Duration duration,
    required Curve curve,
  }) async {
    if (_isPageAnimating || !_pageController.hasClients) {
      return;
    }

    _isPageAnimating = true;
    try {
      await _pageController.animateToPage(
        page,
        duration: duration,
        curve: curve,
      );
    } finally {
      _isPageAnimating = false;
    }
  }

  void _scrollBy(int delta) {
    final int next = (_currentCard + delta).clamp(0, _maxCard);
    unawaited(
      _animateToPage(
        next,
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeInOutCubicEmphasized,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Row(
          children: <Widget>[
            if (_currentCard > 0)
              ArrowNavButton(
                icon: Icons.chevron_left_rounded,
                onPressed: () => _scrollBy(-1),
              ),
            if (_currentCard > 0) const SizedBox(width: 10),
            Expanded(
              child: SizedBox(
                height: 290,
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _testimonials.length,
                  onPageChanged: _onPageChanged,
                  itemBuilder: (BuildContext context, int index) {
                    return TestimonialCard(data: _testimonials[index]);
                  },
                ),
              ),
            ),
            if (_currentCard < _maxCard) const SizedBox(width: 10),
            if (_currentCard < _maxCard)
              ArrowNavButton(
                icon: Icons.chevron_right_rounded,
                onPressed: () => _scrollBy(1),
              ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List<Widget>.generate(_testimonials.length, (int i) {
            final bool isActive = i == _currentCard;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 5),
              width: isActive ? 16 : 9,
              height: 9,
              decoration: BoxDecoration(
                color: isActive
                    ? _primaryBlue
                    : _primaryBlue.withValues(alpha: 0.38),
                borderRadius: BorderRadius.circular(6),
                boxShadow: isActive
                    ? <BoxShadow>[
                        BoxShadow(
                          color: _primaryBlue.withValues(alpha: 0.32),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : <BoxShadow>[],
              ),
            );
          }),
        ),
      ],
    );
  }
}

class TestimonialCard extends StatefulWidget {
  const TestimonialCard({required this.data, super.key});

  final TestimonialData data;

  @override
  State<TestimonialCard> createState() => _TestimonialCardState();
}

class _TestimonialCardState extends State<TestimonialCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        transform: Matrix4.translationValues(0, _isHovered ? -4 : 0, 0),
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
        decoration: BoxDecoration(
          color: _cardSurface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: _isHovered ? _cardBorderHover : _cardBorder,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: _primaryBlue.withValues(alpha: _isHovered ? 0.22 : 0.14),
              blurRadius: _isHovered ? 30 : 22,
              offset: const Offset(0, 16),
              spreadRadius: 2,
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Container(
              width: 4,
              decoration: BoxDecoration(
                color: _primaryBlue,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _primaryBlue.withValues(alpha: 0.10),
                      border: Border.all(color: _cardBorder),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      '“',
                      style: TextStyle(
                        color: _primaryBlue,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        height: 1.0,
                        fontFamily: 'Georgia',
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Expanded(
                    child: Text(
                      widget.data.quote,
                      maxLines: 5,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _bodyColor,
                        fontSize: 14,
                        height: 1.5,
                        fontFamily: 'Georgia',
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: <Widget>[
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              widget.data.name,
                              style: const TextStyle(
                                color: _headingColor,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Georgia',
                              ),
                            ),
                            Text(
                              widget.data.role,
                              style: const TextStyle(
                                color: _bodyColor,
                                fontSize: 12,
                                fontFamily: 'Georgia',
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List<Widget>.generate(5, (int index) {
                          final bool isFilled = index < widget.data.rating;
                          return Icon(
                            isFilled
                                ? Icons.star_rounded
                                : Icons.star_border_rounded,
                            color: _primaryBlue,
                            size: 18,
                          );
                        }),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ArrowNavButton extends StatelessWidget {
  const ArrowNavButton({
    required this.icon,
    required this.onPressed,
    super.key,
  });

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkResponse(
        onTap: onPressed,
        radius: 26,
        splashColor: _primaryBlue.withValues(alpha: 0.16),
        highlightColor: _primaryBlue.withValues(alpha: 0.08),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _cardSurface,
            border: Border.all(color: _cardBorder, width: 1),
          ),
          child: Icon(icon, color: _primaryBlue, size: 26),
        ),
      ),
    );
  }
}
