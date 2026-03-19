import 'package:flutter/material.dart';

class AuthBackground extends StatelessWidget {
  const AuthBackground({
    super.key,
    this.fit = BoxFit.fill,
    this.baseColor = const Color(0xFFF3F4F6),
  });

  final BoxFit fit;
  final Color baseColor;

  static const String _localAsset = 'lib/assets/images/auth_background.png';
  static const String _packageAsset =
      'packages/city_water_flutter/lib/assets/images/auth_background.png';

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(color: baseColor),
        Image.asset(
          _localAsset,
          fit: fit,
          errorBuilder: (context, error, stackTrace) {
            return Image.asset(
              _packageAsset,
              fit: fit,
              errorBuilder: (context, pkgError, pkgStackTrace) {
                debugPrint(
                  'Failed to load auth background from both paths: '
                  '$_localAsset and $_packageAsset',
                );
                return ColoredBox(color: baseColor);
              },
            );
          },
        ),
      ],
    );
  }
}
