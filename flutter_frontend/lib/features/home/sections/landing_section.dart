part of '../main.dart';

class _LandingSection extends StatelessWidget {
  const _LandingSection({
    required this.isCompact,
    required this.appBarHeight,
    required this.showTopBar,
    required this.onMenuSelected,
  });

  final bool isCompact;
  final double appBarHeight;
  final bool showTopBar;
  final ValueChanged<String> onMenuSelected;

  @override
  Widget build(BuildContext context) {
    final Size viewport = MediaQuery.sizeOf(context);
    final double screenHeight = viewport.height;
    final bool isLandscape = viewport.width > viewport.height;
    final bool isShortLandscape = isLandscape && screenHeight < 560;
    final bool isCompactPortrait = isCompact && !isLandscape;
    final double textScale = MediaQuery.textScalerOf(context).scale(1);
    final double sectionHeight = isCompactPortrait
        ? (screenHeight - appBarHeight - MediaQuery.paddingOf(context).bottom)
              .clamp(460.0, double.infinity)
        : screenHeight * textScale.clamp(1.0, 2.2);
    final double effectiveSectionHeight = isShortLandscape
        ? sectionHeight * 0.9
        : sectionHeight;

    return SizedBox(
      height: effectiveSectionHeight,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(isCompact ? 28 : 34),
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            const Positioned.fill(
              child: Image(
                image: AssetImage(_landingBackgroundAsset),
                fit: BoxFit.cover,
                opacity: AlwaysStoppedAnimation<double>(0.72),
              ),
            ),
            const Positioned.fill(
              child: Image(
                image: AssetImage(_landingBackgroundAsset),
                fit: BoxFit.cover,
              ),
            ),
            const Positioned.fill(
              child: IgnorePointer(child: _LandingAmbientBubbles()),
            ),
            SafeArea(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: isCompact ? 20 : 34,
                  vertical: isShortLandscape ? 12 : 18,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    if (showTopBar)
                      _TopBar(onSelected: onMenuSelected)
                    else
                      const SizedBox(height: 48),
                    Expanded(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 920),
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: <Widget>[
                            Expanded(
                              child: Column(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: <Widget>[
                                  const Text(
                                    'Digital water services for modern utilities',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: Color(0xFFE8F9FF),
                                      fontSize: 24,
                                      fontWeight: FontWeight.w600,
                                      fontStyle: FontStyle.italic,
                                      letterSpacing: 0.8,
                                      fontFamily: 'Georgia',
                                      shadows: <Shadow>[
                                        Shadow(
                                          color: Color(0xFF72E9FF),
                                          blurRadius: 20,
                                          offset: Offset(0, 4),
                                        ),
                                        Shadow(
                                          color: Color(0xAA0A4A72),
                                          blurRadius: 16,
                                          offset: Offset(0, 8),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const _CenterSplashGlow(
                                    child: _PulseHeroTitle(),
                                  ),
                                  const _RotatingServiceText(),
                                ],
                              ),
                            ),
                            SizedBox(height: isCompact ? 14 : 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: <Widget>[
                                Expanded(
                                  child: _LandingActionButton(
                                    label: 'Get Started!',
                                    onTap: () {
                                      Navigator.of(
                                        context,
                                      ).pushNamed(_signUpRoute);
                                    },
                                  ),
                                ),
                                SizedBox(width: isCompact ? 18 : 28),
                                Expanded(
                                  child: _LandingActionButton(
                                    label: 'Sign In',
                                    onTap: () {
                                      Navigator.of(
                                        context,
                                      ).pushNamed(_signInRoute);
                                    },
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: isCompact ? 4 : 10),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CenterSplashGlow extends StatefulWidget {
  const _CenterSplashGlow({required this.child});

  final Widget child;

  @override
  State<_CenterSplashGlow> createState() => _CenterSplashGlowState();
}

class _CenterSplashGlowState extends State<_CenterSplashGlow>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isMobile = MediaQuery.sizeOf(context).width < 760;

    if (!isMobile) {
      return SizedBox(
        width: 340,
        height: 340,
        child: Stack(
          alignment: Alignment.center,
          children: <Widget>[
            Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: <Color>[
                    const Color(0xFF65D8FF).withValues(alpha: 0.34),
                    const Color(0xFF65D8FF).withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                  stops: const <double>[0.18, 0.62, 1.0],
                ),
              ),
            ),
            Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFFB5F4FF).withValues(alpha: 0.42),
                  width: 2.4,
                ),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: const Color(0xFF4BD4FF).withValues(alpha: 0.36),
                    blurRadius: 42,
                    spreadRadius: 4,
                  ),
                ],
              ),
            ),
            widget.child,
          ],
        ),
      );
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (BuildContext context, Widget? child) {
        final double t = Curves.easeInOut.transform(_controller.value);
        final double bloom = 0.92 + (0.14 * t);
        final double innerOpacity = 0.22 + (0.14 * t);
        final double outerOpacity = 0.24 + (0.18 * t);
        final double shadowOpacity = 0.22 + (0.28 * t);

        return SizedBox(
          width: 340,
          height: 340,
          child: Stack(
            alignment: Alignment.center,
            children: <Widget>[
              Transform.scale(
                scale: bloom,
                child: Container(
                  width: 320,
                  height: 320,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: <Color>[
                        const Color(0xFF6FE3FF).withValues(alpha: outerOpacity),
                        const Color(0xFF65D8FF).withValues(alpha: innerOpacity),
                        Colors.transparent,
                      ],
                      stops: const <double>[0.16, 0.58, 1.0],
                    ),
                  ),
                ),
              ),
              Transform.scale(
                scale: 0.96 + (0.05 * t),
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(
                        0xFFB5F4FF,
                      ).withValues(alpha: 0.34 + (0.16 * t)),
                      width: 2.4,
                    ),
                    boxShadow: <BoxShadow>[
                      BoxShadow(
                        color: const Color(
                          0xFF4BD4FF,
                        ).withValues(alpha: shadowOpacity),
                        blurRadius: 34 + (18 * t),
                        spreadRadius: 2 + (4 * t),
                      ),
                    ],
                  ),
                ),
              ),
              child ?? widget.child,
            ],
          ),
        );
      },
    );
  }
}

class _LandingAmbientBubbles extends StatefulWidget {
  const _LandingAmbientBubbles();

  @override
  State<_LandingAmbientBubbles> createState() => _LandingAmbientBubblesState();
}

class _LandingAmbientBubblesState extends State<_LandingAmbientBubbles>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  static const List<_LandingBubbleSpec> _specs = <_LandingBubbleSpec>[
    _LandingBubbleSpec(x: 0.08, y: 0.14, radius: 10, drift: 11, speed: 0.85),
    _LandingBubbleSpec(x: 0.16, y: 0.28, radius: 7, drift: 9, speed: 0.72),
    _LandingBubbleSpec(x: 0.84, y: 0.18, radius: 8, drift: 10, speed: 0.68),
    _LandingBubbleSpec(x: 0.90, y: 0.34, radius: 11, drift: 13, speed: 0.78),
    _LandingBubbleSpec(x: 0.10, y: 0.54, radius: 12, drift: 14, speed: 0.82),
    _LandingBubbleSpec(x: 0.88, y: 0.58, radius: 9, drift: 10, speed: 0.75),
    _LandingBubbleSpec(x: 0.28, y: 0.82, radius: 8, drift: 9, speed: 0.69),
    _LandingBubbleSpec(x: 0.72, y: 0.86, radius: 10, drift: 12, speed: 0.8),
    _LandingBubbleSpec(x: 0.50, y: 0.12, radius: 6, drift: 8, speed: 0.7),
    _LandingBubbleSpec(x: 0.60, y: 0.70, radius: 7, drift: 9, speed: 0.73),
    _LandingBubbleSpec(x: 0.36, y: 0.22, radius: 5, drift: 8, speed: 0.66),
    _LandingBubbleSpec(x: 0.42, y: 0.93, radius: 12, drift: 15, speed: 0.84),
  ];

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
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (BuildContext context, Widget? child) {
            return Stack(
              children: _specs.asMap().entries.map((entry) {
                final int index = entry.key;
                final _LandingBubbleSpec spec = entry.value;
                final double phase = (_controller.value + (index * 0.09)) % 1;
                final double dy = math.sin(phase * math.pi * 2) * spec.drift;
                final double opacity = 0.10 + (0.11 * spec.speed);

                return Positioned(
                  left: constraints.maxWidth * spec.x,
                  top: (constraints.maxHeight * spec.y) + dy,
                  child: Container(
                    width: spec.radius * 2,
                    height: spec.radius * 2,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: <Color>[
                          Colors.white.withValues(alpha: opacity),
                          const Color(
                            0xFF8EDBFF,
                          ).withValues(alpha: opacity * 0.52),
                          Colors.transparent,
                        ],
                      ),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: opacity * 0.55),
                        width: 0.9,
                      ),
                    ),
                  ),
                );
              }).toList(),
            );
          },
        );
      },
    );
  }
}

class _LandingBubbleSpec {
  const _LandingBubbleSpec({
    required this.x,
    required this.y,
    required this.radius,
    required this.drift,
    required this.speed,
  });

  final double x;
  final double y;
  final double radius;
  final double drift;
  final double speed;
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.onSelected});

  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: <Widget>[
        const _PulseBrandMark(),
        PopupMenuButton<String>(
          tooltip: 'Open menu',
          onSelected: onSelected,
          color: const Color(0xFFF3FBFF),
          position: PopupMenuPosition.under,
          itemBuilder: (BuildContext context) => const <PopupMenuEntry<String>>[
            PopupMenuItem<String>(value: 'about', child: Text('About Us')),
            PopupMenuItem<String>(value: 'contact', child: Text('Contact Us')),
            PopupMenuDivider(),
            PopupMenuItem<String>(value: 'signup', child: Text('Sign Up')),
            PopupMenuItem<String>(value: 'signin', child: Text('Sign In')),
          ],
          child: const Icon(Icons.menu_rounded, color: Colors.white, size: 30),
        ),
      ],
    );
  }
}

class _PulseBrandMark extends StatefulWidget {
  const _PulseBrandMark();

  @override
  State<_PulseBrandMark> createState() => _PulseBrandMarkState();
}

class _PulseBrandMarkState extends State<_PulseBrandMark>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
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
        final Color color = Color.lerp(
          const Color(0xFFA8EEFF),
          const Color(0xFF5EE6FF),
          t,
        )!;

        return Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(
              Icons.water_drop_rounded,
              color: color,
              size: 28,
              shadows: <Shadow>[
                Shadow(
                  color: const Color(
                    0xFF12BFE3,
                  ).withValues(alpha: 0.45 + (t * 0.35)),
                  blurRadius: 8 + (10 * t),
                ),
              ],
            ),
            const SizedBox(width: 6),
            Text(
              'Aqua',
              style: TextStyle(
                color: Color.lerp(const Color(0xFFD5F7FF), Colors.white, t),
                fontSize: 22,
                fontWeight: FontWeight.w700,
                fontFamily: 'Georgia',
                shadows: <Shadow>[
                  Shadow(
                    color: const Color(
                      0xFF12BFE3,
                    ).withValues(alpha: 0.22 + (t * 0.26)),
                    blurRadius: 10 + (8 * t),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _PulseHeroTitle extends StatefulWidget {
  const _PulseHeroTitle();

  @override
  State<_PulseHeroTitle> createState() => _PulseHeroTitleState();
}

class _PulseHeroTitleState extends State<_PulseHeroTitle>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
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
        final Color main = Color.lerp(
          const Color(0xFFE2F8FF),
          const Color(0xFFECFBFF),
          t,
        )!;

        return Text(
          'Aqua\nConnect',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: main,
            fontSize: 62,
            height: 1.0,
            fontWeight: FontWeight.w900,
            letterSpacing: 3.0,
            fontFamily: 'Georgia',
            shadows: <Shadow>[
              Shadow(
                color: const Color(
                  0xFF00E6FF,
                ).withValues(alpha: 0.72 + (0.18 * t)),
                blurRadius: 36 + (28 * t),
                offset: const Offset(0, 0),
              ),
              Shadow(
                color: const Color(
                  0xFF0A5B8A,
                ).withValues(alpha: 0.52 + (0.22 * t)),
                blurRadius: 20 + (18 * t),
                offset: const Offset(0, 0),
              ),
              Shadow(
                color: _primaryBlue.withValues(alpha: 0.35 + (0.22 * t)),
                blurRadius: 14 + (14 * t),
                offset: const Offset(0, 8),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _LandingActionButton extends StatefulWidget {
  const _LandingActionButton({required this.label, this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  State<_LandingActionButton> createState() => _LandingActionButtonState();
}

class _LandingActionButtonState extends State<_LandingActionButton> {
  bool _isHovered = false;
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final bool isActive = _isHovered || _isPressed;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() {
        _isHovered = false;
        _isPressed = false;
      }),
      child: GestureDetector(
        onTap: widget.onTap,
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) => setState(() => _isPressed = false),
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          duration: const Duration(milliseconds: 180),
          scale: _isPressed ? 0.95 : (isActive ? 1.03 : 1),
          child: SizedBox(
            width: double.infinity,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: isActive ? _cardBorderHover : _cardBorder,
                  width: 0.9,
                ),
                gradient: LinearGradient(
                  colors: isActive
                      ? <Color>[_buttonBlueStartHover, _buttonBlueHover]
                      : <Color>[_primaryBlue, _buttonBlue],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: _primaryBlue.withValues(
                      alpha: isActive ? 0.24 : 0.14,
                    ),
                    blurRadius: isActive ? 12 : 4,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  widget.label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    fontFamily: 'Georgia',
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RotatingServiceText extends StatefulWidget {
  const _RotatingServiceText();

  @override
  State<_RotatingServiceText> createState() => _RotatingServiceTextState();
}

class _RotatingServiceTextState extends State<_RotatingServiceText> {
  static const List<String> _items = <String>[
    'Scheduling',
    'Billing',
    'Complaint',
    'Announcement',
    'Reporting',
  ];

  int _index = 0;
  Timer? _advanceTimer;

  @override
  void initState() {
    super.initState();
    _scheduleAdvance(const Duration(milliseconds: 1200));
  }

  void _scheduleAdvance(Duration delay) {
    _advanceTimer?.cancel();
    _advanceTimer = Timer(delay, _advance);
  }

  void _advance() {
    if (!mounted) {
      return;
    }

    setState(() {
      _index = (_index + 1) % _items.length;
    });

    _scheduleAdvance(const Duration(milliseconds: 1450));
  }

  @override
  void dispose() {
    _advanceTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 520),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (Widget child, Animation<double> animation) {
          final Animation<Offset> slide = Tween<Offset>(
            begin: const Offset(0, 0.45),
            end: Offset.zero,
          ).animate(animation);
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(position: slide, child: child),
          );
        },
        child: Text(
          _items[_index],
          key: ValueKey<String>(_items[_index]),
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color(0xFFE8F9FF),
            fontSize: 24,
            fontWeight: FontWeight.w600,
            fontStyle: FontStyle.italic,
            letterSpacing: 0.8,
            fontFamily: 'Georgia',
            shadows: <Shadow>[
              Shadow(
                color: Color(0xFF72E9FF),
                blurRadius: 9,
                offset: Offset(0, 2),
              ),
              Shadow(
                color: Color(0xAA0A4A72),
                blurRadius: 6,
                offset: Offset(0, 4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
