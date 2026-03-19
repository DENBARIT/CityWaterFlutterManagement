part of '../main.dart';

class _FeatureSection extends StatelessWidget {
  const _FeatureSection({required this.features});

  final List<_FeatureCardData> features;

  @override
  Widget build(BuildContext context) {
    return _FeatureSectionBody(features: features);
  }
}

class _FeatureSectionBody extends StatefulWidget {
  const _FeatureSectionBody({required this.features});

  final List<_FeatureCardData> features;

  @override
  State<_FeatureSectionBody> createState() => _FeatureSectionBodyState();
}

class _FeatureSectionBodyState extends State<_FeatureSectionBody> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = 0;
  }

  void _goPrevious() {
    if (_currentIndex == 0) {
      return;
    }
    setState(() {
      _currentIndex -= 1;
    });
  }

  void _goNext() {
    if (_currentIndex >= widget.features.length - 1) {
      return;
    }
    setState(() {
      _currentIndex += 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    final Size viewport = MediaQuery.sizeOf(context);
    final bool isLandscape = viewport.width > viewport.height;
    final bool isShortLandscape = isLandscape && viewport.height < 560;
    final bool atFirstCard = _currentIndex == 0;
    final bool atLastCard = _currentIndex == widget.features.length - 1;
    final double textScale = MediaQuery.textScalerOf(context).scale(1);
    final double baseHeight = lerpDouble(
      320,
      430,
      (textScale - 1).clamp(0.0, 1.0),
    )!;
    final double viewportHeight = isShortLandscape
        ? baseHeight.clamp(260, 330)
        : baseHeight;
    final double sideGap = viewport.width < 360
        ? 6
        : (isShortLandscape ? 8 : 10);

    return _SectionShell(
      padding: const EdgeInsets.fromLTRB(10, 28, 10, 0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          SizedBox(
            height: viewportHeight,
            child: Row(
              children: <Widget>[
                if (atFirstCard)
                  const SizedBox(width: 40, height: 40)
                else
                  _ArrowNavButton(
                    icon: Icons.chevron_left_rounded,
                    onPressed: _goPrevious,
                  ),
                SizedBox(width: sideGap),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 320),
                    switchInCurve: Curves.easeOutCubic,
                    switchOutCurve: Curves.easeInCubic,
                    transitionBuilder:
                        (Widget child, Animation<double> animation) {
                          final Animation<Offset> slide = Tween<Offset>(
                            begin: const Offset(0.08, 0),
                            end: Offset.zero,
                          ).animate(animation);
                          return FadeTransition(
                            opacity: animation,
                            child: SlideTransition(
                              position: slide,
                              child: child,
                            ),
                          );
                        },
                    child: SizedBox(
                      key: ValueKey<int>(_currentIndex),
                      width: double.infinity,
                      child: _FeatureCard(
                        data: widget.features[_currentIndex],
                        index: _currentIndex,
                      ),
                    ),
                  ),
                ),
                SizedBox(width: sideGap),
                if (atLastCard)
                  const SizedBox(width: 40, height: 40)
                else
                  _ArrowNavButton(
                    icon: Icons.chevron_right_rounded,
                    onPressed: _goNext,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List<Widget>.generate(widget.features.length, (int i) {
              final bool isActive = i == _currentIndex;
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
      ),
    );
  }
}

class _ArrowNavButton extends StatelessWidget {
  const _ArrowNavButton({required this.icon, required this.onPressed});

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

class _FeatureCard extends StatefulWidget {
  const _FeatureCard({required this.data, required this.index});
  final int index;

  final _FeatureCardData data;

  @override
  State<_FeatureCard> createState() => _FeatureCardState();
}

class _FeatureCardState extends State<_FeatureCard> {
  bool _isHovered = false;
  bool _isPressed = false;
  double _iconRotation = 0.0;

  @override
  Widget build(BuildContext context) {
    final bool isActive = _isHovered || _isPressed;
    final int direction = widget.index.isEven ? 1 : -1;
    final double tilt = _isPressed
        ? -0.015 * direction
        : (_isHovered ? 0.012 * direction : 0.0);

    return MouseRegion(
      onEnter: (_) {
        setState(() {
          _isHovered = true;
          _iconRotation = 1.0;
        });
      },
      onExit: (_) {
        setState(() {
          _isHovered = false;
          _isPressed = false;
          _iconRotation = 0.0;
        });
      },
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) => setState(() => _isPressed = false),
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          duration: const Duration(milliseconds: 180),
          scale: _isPressed ? 0.97 : (isActive ? 1.03 : 1),
          child: AnimatedRotation(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            turns: tilt,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              transform: Matrix4.translationValues(0, isActive ? -5 : 0, 0),
              width: 270,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(30),
                color: _cardSurface,
                border: Border.all(
                  color: isActive ? _cardBorderHover : _cardBorder,
                  width: 1,
                ),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: _primaryBlue.withValues(
                      alpha: isActive ? 0.24 : 0.14,
                    ),
                    blurRadius: isActive ? 32 : 26,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: <Widget>[
                  AnimatedRotation(
                    turns: _iconRotation,
                    duration: const Duration(milliseconds: 600),
                    curve: Curves.easeInOut,
                    child: Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        border: Border.all(
                          color: isActive ? _cardBorderHover : _cardBorder,
                          width: 1,
                        ),
                      ),
                      child: Icon(
                        widget.data.icon,
                        color: isActive ? _primaryBlueHover : _primaryBlue,
                        size: 30,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    widget.data.title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: _headingColor,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Georgia',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.data.description,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: _bodyColor,
                      fontSize: 18,
                      height: 1.6,
                      fontFamily: 'Georgia',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FeatureCardData {
  const _FeatureCardData({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.description,
  });

  final String title;
  final IconData icon;
  final Color iconColor;
  final String description;
}
