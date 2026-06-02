import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:video_player/video_player.dart';
import 'package:city_water_flutter/screens/auth/login_screen.dart';
import 'package:city_water_flutter/screens/auth/register_screen.dart';


part 'sections/section_shell.dart';
part 'sections/magic_section.dart';
part 'sections/marquee_section.dart';
part 'sections/faq_section.dart';
part 'sections/landing_section.dart';
part 'sections/feature_section.dart';
// testimonial section removed
part 'sections/footer_section.dart';

const double _uniformSectionGap = 75;
const Color _appBackgroundBlue = Color(0xFF0B2C44);
const Color _headingColor = Color(0xFF0F52BA);
const Color _bodyColor = Color(0xFF424242);
const Color _primaryBlue = Color(0xFF1E88E5);
const Color _primaryBlueHover = Color(0xFF0D47A1);
const Color _buttonBlue = Color(0xFF00B4D8);
const Color _buttonBlueHover = Color(0xFF0096C7);
const Color _buttonBlueStartHover = Color(0xFF1565C0);
const Color _cardSurface = Color(0xEBFFFFFF);
const Color _cardBorder = Color(0x331E88E5);
const Color _cardBorderHover = Color(0xFF90CAF9);
const Color _testimonialSectionBg = _appBackgroundBlue;
const String _landingBackgroundAsset = 'lib/assets/images/auth_background.png';
const String _signInRoute = '/signin';
const String _signUpRoute = '/signup';

void main() {
  runApp(const AquaConnectApp());
}

class AquaConnectApp extends StatelessWidget {
  const AquaConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Aqua Connect',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _primaryBlue),
        scaffoldBackgroundColor: _appBackgroundBlue,
        useMaterial3: true,
      ),
      routes: <String, WidgetBuilder>{
        _signInRoute: (BuildContext context) => const LoginScreen(),
        _signUpRoute: (BuildContext context) => const CreateAccountScreen(),
      },
      home: const AquaConnectHome(),
    );
  }
}

class AquaConnectHome extends StatefulWidget {
  const AquaConnectHome({super.key});

  @override
  State<AquaConnectHome> createState() => _AquaConnectHomeState();
}

class _AquaConnectHomeState extends State<AquaConnectHome> {
  static const List<_FeatureCardData> _features = <_FeatureCardData>[
    _FeatureCardData(
      title: 'OCR Recognition',
      icon: Icons.document_scanner_outlined,
      iconColor: Color(0xFFCCF7FF),
      description:
          'Scan your meter reader with OCR to calculate your current water bill instantly.',
    ),
    _FeatureCardData(
      title: 'Billing',
      icon: Icons.account_balance_wallet_outlined,
      iconColor: Color(0xFFB9F3FF),
      description:
          'View your bills, check your balance, and manage charges clearly and quickly.',
    ),
    _FeatureCardData(
      title: 'Payments',
      icon: Icons.payments_outlined,
      iconColor: Color(0xFFCFF8D2),
      description:
          'Make quick and secure payments anytime through a simple and reliable flow.',
    ),
    _FeatureCardData(
      title: 'Usage Analytics',
      icon: Icons.analytics_outlined,
      iconColor: Color(0xFFB3E5FC),
      description:
          'See your water consumption history and analyze your usage trends over time.',
    ),
    _FeatureCardData(
      title: 'Water Usage',
      icon: Icons.water_drop_outlined,
      iconColor: Color(0xFFB8F5FF),
      description:
          'Monitor your water consumption and understand your usage over time.',
    ),
    _FeatureCardData(
      title: 'Complaint Management',
      icon: Icons.report_problem_outlined,
      iconColor: Color(0xFFFFE08A),
      description:
          'Submit complaints easily and track their progress until they are resolved.',
    ),
    _FeatureCardData(
      title: 'Announcements',
      icon: Icons.campaign_outlined,
      iconColor: Color(0xFFB6F8FF),
      description:
          'Receive important updates about water supply, maintenance, and service changes.',
    ),
    _FeatureCardData(
      title: 'Administrative Support',
      icon: Icons.support_agent_outlined,
      iconColor: Color(0xFFC7F2FF),
      description:
          'Get help and support from the administration for any service-related issues.',
    ),
    _FeatureCardData(
      title: 'Failure Reporting',
      icon: Icons.build_circle_outlined,
      iconColor: Color(0xFFFFC8A8),
      description:
          'Report leaks, pipe bursts, or other system failures for quick response and repair.',
    ),
  ];

  // testimonials removed

  VideoPlayerController? _magicVideoController;
  bool _magicVideoReady = false;

  @override
  void initState() {
    super.initState();
    _initializeMagicVideo();
  }

  Future<void> _initializeMagicVideo() async {
    final VideoPlayerController controller = VideoPlayerController.asset(
      'assets/videos/dam.mp4',
    );

    try {
      await controller.initialize();
      await controller.setLooping(false);
      await controller.pause();

      if (!mounted) {
        await controller.dispose();
        return;
      }

      setState(() {
        _magicVideoController = controller;
        _magicVideoReady = true;
      });
    } catch (_) {
      await controller.dispose();
      if (!mounted) {
        return;
      }
      setState(() {
        _magicVideoReady = false;
      });
    }
  }

  Future<void> _handleMagicTap() async {
    final VideoPlayerController? controller = _magicVideoController;
    if (controller == null || !controller.value.isInitialized) {
      return;
    }

    if (controller.value.isPlaying) {
      await controller.pause();
      return;
    }

    final bool isNearEnd =
        controller.value.duration - controller.value.position <=
        const Duration(milliseconds: 120);
    if (isNearEnd) {
      await controller.seekTo(Duration.zero);
    }
    await controller.play();
  }

  void _showInfoModal(_InfoModalType type) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.62),
      builder: (BuildContext context) {
        return _InfoModal(type: type);
      },
    );
  }

  void _handleMenuSelection(String value) {
    switch (value) {
      case 'about':
        _showInfoModal(_InfoModalType.about);
        return;
      case 'contact':
        _showInfoModal(_InfoModalType.contact);
        return;
      case 'signin':
        Navigator.of(context).pushNamed(_signInRoute);
        return;
      case 'signup':
        Navigator.of(context).pushNamed(_signUpRoute);
        return;
    }
  }

  @override
  void dispose() {
    _magicVideoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Size viewport = MediaQuery.sizeOf(context);
    final bool isCompact = viewport.width < 760;
    final bool isLandscape = viewport.width > viewport.height;
    final bool isShortLandscape = isLandscape && viewport.height < 560;
    final double sectionGap = isShortLandscape ? 32 : _uniformSectionGap;
    const double appBarHeight = 0;

    return Scaffold(
      backgroundColor: _appBackgroundBlue,
      body: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          const _BubblingBackground(),
          LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
              return SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    _StaggerReveal(
                      delayMs: 0,
                      child: _LandingSection(
                        isCompact: isCompact,
                        appBarHeight: appBarHeight,
                        showTopBar: false,
                        onMenuSelected: _handleMenuSelection,
                      ),
                    ),
                    _StaggerReveal(
                      delayMs: 80,
                      child: _FeatureSection(features: _features),
                    ),
                    SizedBox(height: sectionGap),
                    const _StaggerReveal(
                      delayMs: 120,
                      child: _ValuedCustomersMarquee(),
                    ),
                    SizedBox(height: sectionGap),
                    _StaggerReveal(
                      delayMs: 180,
                      child: _MagicSection(
                        onOpenVideo: () => _handleMagicTap(),
                        videoController: _magicVideoController,
                        isVideoReady: _magicVideoReady,
                      ),
                    ),
                    SizedBox(height: sectionGap),
                    const _StaggerReveal(delayMs: 350, child: _FaqSection()),
                    SizedBox(height: sectionGap),
                    const _StaggerReveal(
                      delayMs: 410,
                      child: _SupportingDigitizationText(),
                    ),
                    SizedBox(height: sectionGap),
                    const _StaggerReveal(delayMs: 470, child: _FooterSection()),
                  ],
                ),
              );
            },
          ),
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: isCompact ? 20 : 34,
                  vertical: 18,
                ),
                child: _TopBar(onSelected: _handleMenuSelection),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BubblingBackground extends StatefulWidget {
  const _BubblingBackground();

  @override
  State<_BubblingBackground> createState() => _BubblingBackgroundState();
}

class _BubblingBackgroundState extends State<_BubblingBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final List<_BubbleSpec> bubbles = <_BubbleSpec>[
      _BubbleSpec(
        left: 0.06,
        bottom: -0.10,
        size: 44,
        duration: 0.74,
        delay: 0.00,
      ),
      _BubbleSpec(
        left: 0.13,
        bottom: -0.14,
        size: 30,
        duration: 0.67,
        delay: 0.08,
      ),
      _BubbleSpec(
        left: 0.22,
        bottom: -0.08,
        size: 56,
        duration: 0.80,
        delay: 0.16,
      ),
      _BubbleSpec(
        left: 0.31,
        bottom: -0.11,
        size: 36,
        duration: 0.72,
        delay: 0.24,
      ),
      _BubbleSpec(
        left: 0.40,
        bottom: -0.09,
        size: 62,
        duration: 0.86,
        delay: 0.33,
      ),
      _BubbleSpec(
        left: 0.49,
        bottom: -0.13,
        size: 28,
        duration: 0.63,
        delay: 0.41,
      ),
      _BubbleSpec(
        left: 0.58,
        bottom: -0.10,
        size: 48,
        duration: 0.79,
        delay: 0.49,
      ),
      _BubbleSpec(
        left: 0.67,
        bottom: -0.15,
        size: 34,
        duration: 0.69,
        delay: 0.58,
      ),
      _BubbleSpec(
        left: 0.76,
        bottom: -0.07,
        size: 58,
        duration: 0.88,
        delay: 0.67,
      ),
      _BubbleSpec(
        left: 0.85,
        bottom: -0.12,
        size: 40,
        duration: 0.75,
        delay: 0.76,
      ),
      _BubbleSpec(
        left: 0.93,
        bottom: -0.10,
        size: 26,
        duration: 0.61,
        delay: 0.84,
      ),
    ];

    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (BuildContext context, Widget? child) {
          return Stack(
            fit: StackFit.expand,
            children: <Widget>[
              for (final _BubbleSpec bubble in bubbles)
                _AnimatedBubble(controller: _controller, bubble: bubble),
            ],
          );
        },
      ),
    );
  }
}

class _BubbleSpec {
  const _BubbleSpec({
    required this.left,
    required this.bottom,
    required this.size,
    required this.duration,
    required this.delay,
  });

  final double left;
  final double bottom;
  final double size;
  final double duration;
  final double delay;
}

class _AnimatedBubble extends StatelessWidget {
  const _AnimatedBubble({required this.controller, required this.bubble});

  final AnimationController controller;
  final _BubbleSpec bubble;

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.sizeOf(context);
    final double t = ((controller.value + bubble.delay) % 1.0);
    final double travel = size.height + (bubble.size * 2.2);
    final double y = size.height - ((t * bubble.duration) * travel);
    final double wobble = ((t * 2.0) - 1.0) * (bubble.size * 0.12);
    final double opacity = 0.05 + (0.06 * (1.0 - t));

    return Positioned(
      left: size.width * bubble.left + wobble,
      top: y + (bubble.bottom * size.height),
      child: Container(
        width: bubble.size,
        height: bubble.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: <Color>[
              Colors.white.withValues(alpha: opacity),
              const Color(0xFF9BE7FF).withValues(alpha: opacity * 0.28),
              Colors.transparent,
            ],
            stops: const <double>[0.0, 0.7, 1.0],
          ),
          border: Border.all(
            color: Colors.white.withValues(alpha: opacity * 0.35),
            width: 1,
          ),
        ),
      ),
    );
  }
}

class _StaggerReveal extends StatefulWidget {
  const _StaggerReveal({required this.child, required this.delayMs});

  final Widget child;
  final int delayMs;

  @override
  State<_StaggerReveal> createState() => _StaggerRevealState();
}

class _StaggerRevealState extends State<_StaggerReveal> {
  bool _visible = false;
  Timer? _revealTimer;

  @override
  void initState() {
    super.initState();
    _revealTimer = Timer(Duration(milliseconds: widget.delayMs), () {
      if (!mounted) {
        return;
      }
      setState(() {
        _visible = true;
      });
    });
  }

  @override
  void dispose() {
    _revealTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSlide(
      duration: const Duration(milliseconds: 480),
      curve: Curves.easeOutCubic,
      offset: _visible ? Offset.zero : const Offset(0, 0.08),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOut,
        opacity: _visible ? 1 : 0,
        child: widget.child,
      ),
    );
  }
}

class _InfoModal extends StatelessWidget {
  const _InfoModal({required this.type});

  final _InfoModalType type;

  @override
  Widget build(BuildContext context) {
    final bool isAbout = type == _InfoModalType.about;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Material(
          color: Colors.transparent,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                child: Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: <Color>[
                        Color(0xFFFFFFFF),
                        Color(0xF2FFFFFF),
                        Color(0xE6FFFFFF),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: _cardBorderHover, width: 1.2),
                    boxShadow: <BoxShadow>[
                      BoxShadow(
                        color: _primaryBlue.withValues(alpha: 0.16),
                        blurRadius: 28,
                        offset: const Offset(0, 14),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Icon(
                            isAbout
                                ? Icons.info_outline_rounded
                                : Icons.phone_in_talk_rounded,
                            color: _primaryBlue,
                            size: 26,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              isAbout
                                  ? 'About Aqua Connect'
                                  : 'Contact Aqua Connect',
                              style: const TextStyle(
                                color: _headingColor,
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(
                              Icons.close_rounded,
                              color: _primaryBlue,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      if (isAbout) ...<Widget>[
                        const Text(
                          'This is a city water administration system governed by the Addis Ababa City Administration. It introduces an automation platform for OCR scanning, billing, announcements, and faster service delivery.',
                          style: TextStyle(
                            color: _bodyColor,
                            fontSize: 15,
                            height: 1.55,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'It improves efficiency by reducing manual work, supporting digitization, and giving residents a more reliable way to manage water service interactions.',
                          style: TextStyle(
                            color: _bodyColor,
                            fontSize: 15,
                            height: 1.55,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Short Number: 906',
                          style: TextStyle(
                            color: _bodyColor,
                            fontSize: 15,
                            height: 1.55,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ] else ...<Widget>[
                        const Text(
                          'For further issues, contact your respective sub-city water offices.',
                          style: TextStyle(
                            color: _bodyColor,
                            fontSize: 15,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Email: aquaconnect@gmail.com',
                          style: TextStyle(
                            color: _bodyColor,
                            fontSize: 15,
                            height: 1.5,
                          ),
                        ),
                        const Text(
                          'Phone: +251 900648457 / 0912440673 / 0908767354',
                          style: TextStyle(
                            color: _bodyColor,
                            fontSize: 15,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ],
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

class WaveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final Path path = Path();

    path.lineTo(0, size.height * 0.55);
    path.quadraticBezierTo(
      size.width * 0.22,
      size.height,
      size.width * 0.5,
      size.height * 0.56,
    );
    path.quadraticBezierTo(
      size.width * 0.78,
      size.height * 0.12,
      size.width,
      size.height * 0.55,
    );
    path.lineTo(size.width, 0);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

enum _InfoModalType { about, contact }
