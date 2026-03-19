part of '../main.dart';

// Animated SVG faucet/tap icon for the magic section
class _MagicTapIcon extends StatefulWidget {
  const _MagicTapIcon({required this.onTap});

  final VoidCallback onTap;

  @override
  State<_MagicTapIcon> createState() => _MagicTapIconState();
}

class _MagicTapIconState extends State<_MagicTapIcon>
    with SingleTickerProviderStateMixin {
  bool _isHovered = false;
  bool _isPressed = false;
  late final AnimationController _dropController;

  @override
  void initState() {
    super.initState();
    _dropController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1300),
    )..repeat();
  }

  @override
  void dispose() {
    _dropController.dispose();
    super.dispose();
  }

  Widget _buildDroplet({
    required double delay,
    required double left,
    required double size,
  }) {
    return AnimatedBuilder(
      animation: _dropController,
      builder: (BuildContext context, Widget? child) {
        final double progress = (_dropController.value + delay) % 1.0;
        final double y = Curves.easeIn.transform(progress) * 24;
        final double fadeIn = (progress / 0.16).clamp(0.0, 1.0);
        final double fadeOut = ((1.0 - progress) / 0.26).clamp(0.0, 1.0);
        final double opacity = fadeIn * fadeOut;

        return Positioned(
          top: 28 + y,
          left: left,
          child: Opacity(
            opacity: opacity,
            child: Container(
              width: size,
              height: size * 1.18,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(size),
                gradient: const LinearGradient(
                  colors: <Color>[Color(0xFFE8FCFF), Color(0xFF79EFFF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: const Color(0xFF54DFFF).withValues(alpha: 0.55),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isActive = _isHovered || _isPressed;
    final double opacity = isActive ? 0.82 : 0.68;
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
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
          width: 90,
          height: 90,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _primaryBlue.withValues(alpha: opacity),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: _primaryBlueHover.withValues(alpha: 0.22),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Center(
            child: SizedBox(
              width: 62,
              height: 62,
              child: Stack(
                clipBehavior: Clip.none,
                children: <Widget>[
                  Positioned(
                    top: 1,
                    left: 6,
                    right: 6,
                    child: SizedBox(
                      width: 50,
                      height: 34,
                      child: SvgPicture.asset(
                        'assets/icons/water_Tap.svg',
                        fit: BoxFit.contain,
                        colorFilter: const ColorFilter.mode(
                          Color(0xFFC8FAFF),
                          BlendMode.srcIn,
                        ),
                      ),
                    ),
                  ),
                  _buildDroplet(delay: 0.0, left: 29, size: 9),
                  _buildDroplet(delay: 0.42, left: 25, size: 7),
                  _buildDroplet(delay: 0.72, left: 33, size: 6),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MagicSection extends StatelessWidget {
  const _MagicSection({
    required this.onOpenVideo,
    required this.videoController,
    required this.isVideoReady,
  });

  final VoidCallback onOpenVideo;
  final VideoPlayerController? videoController;
  final bool isVideoReady;

  @override
  Widget build(BuildContext context) {
    return _SectionShell(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Text(
            'The Future of water utility is in your hand',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.w900,
              fontFamily: 'Georgia',
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Tap the faucet to play video',
            style: TextStyle(color: Colors.white, fontSize: 14),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
              final double videoWidth = constraints.maxWidth < 860
                  ? constraints.maxWidth
                  : 860;

              return Center(
                child: SizedBox(
                  width: videoWidth,
                  child: Stack(
                    alignment: Alignment.center,
                    children: <Widget>[
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _cardBorderHover,
                            width: 1.6,
                          ),
                          boxShadow: <BoxShadow>[
                            BoxShadow(
                              color: _primaryBlue.withValues(alpha: 0.20),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: AspectRatio(
                            aspectRatio:
                                (isVideoReady && videoController != null)
                                ? videoController!.value.aspectRatio
                                : 16 / 9,
                            child: (isVideoReady && videoController != null)
                                ? Stack(
                                    fit: StackFit.expand,
                                    children: <Widget>[
                                      VideoPlayer(videoController!),
                                      if (!videoController!.value.isPlaying)
                                        Container(
                                          color: Colors.black.withValues(
                                            alpha: 0.28,
                                          ),
                                        ),
                                    ],
                                  )
                                : const ColoredBox(
                                    color: Color(0xFF0A3452),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                              Colors.white,
                                            ),
                                      ),
                                    ),
                                  ),
                          ),
                        ),
                      ),
                      IgnorePointer(
                        ignoring:
                            isVideoReady && videoController!.value.isPlaying,
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 220),
                          opacity:
                              (isVideoReady &&
                                  videoController != null &&
                                  videoController!.value.isPlaying)
                              ? 0
                              : 1,
                          child: _MagicTapIcon(onTap: onOpenVideo),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
