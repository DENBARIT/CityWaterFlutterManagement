part of '../main.dart';

class _SectionShell extends StatelessWidget {
  const _SectionShell({required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Padding(padding: padding ?? EdgeInsets.zero, child: child);
  }
}
