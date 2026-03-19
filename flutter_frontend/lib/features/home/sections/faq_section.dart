part of '../main.dart';

// FAQ Section with Accordion
class _FaqSection extends StatefulWidget {
  const _FaqSection();

  @override
  State<_FaqSection> createState() => _FaqSectionState();
}

class _FaqSectionState extends State<_FaqSection> {
  static final List<_FaqItem> _faqItems = <_FaqItem>[
    _FaqItem(
      question: 'What is OCR Recognition?',
      answer:
          'It is a self-input method where users can use their smartphone to scan their meter reader.',
    ),
    _FaqItem(
      question: 'How does OCR work?',
      answer:
          'After the user uploads an approved image, the system extracts the meter ID and meter reading. The entered meter ID must match the registered meter ID of the user, and the meter reading is used to calculate the current month’s usage and generate a bill.',
    ),
    _FaqItem(
      question: 'How fast are complaints resolved?',
      answer:
          'Complaints are resolved within 1 day to 1 week, depending on the complexity of the issue.',
    ),
    _FaqItem(
      question: 'Is the payment secure?',
      answer:
          'The payment gateway is secure and follows standard practices such as idempotency and other security protocols.',
    ),
    _FaqItem(
      question: 'How can I fix an issue if I get stuck on the app?',
      answer:
          'Users can contact support through the app’s help section or customer service for assistance.',
    ),
    _FaqItem(
      question: 'What problems are solved by this system?',
      answer:
          'Problems solved:\n\n• Manual billing errors\n• Water wastage\n• Poor complaint handling',
    ),
    _FaqItem(
      question: 'What are the benefits?',
      answer:
          'Benefits:\n\n• Smart Billing\n• OCR Meter Scanning\n• Complaint Tracking\n• Announcements\n• Usage Analytics',
    ),
    _FaqItem(
      question: 'Is my data secure?',
      answer:
          'Your data privacy is protected according to international data protection standards.',
    ),
  ];

  int _expandedIndex = 0;
  bool _showFaqItems = false;

  void _toggleIndex(int index) {
    setState(() {
      _expandedIndex = index;
    });
  }

  void _toggleFaqItemsVisibility() {
    setState(() {
      _showFaqItems = !_showFaqItems;
    });
  }

  @override
  Widget build(BuildContext context) {
    final Size viewport = MediaQuery.sizeOf(context);
    final bool isLandscape = viewport.width > viewport.height;
    final bool isShortLandscape = isLandscape && viewport.height < 560;

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: isShortLandscape ? 16 : 20),
      child: Container(
        padding: EdgeInsets.fromLTRB(
          isShortLandscape ? 12 : 16,
          isShortLandscape ? 12 : 16,
          isShortLandscape ? 12 : 16,
          isShortLandscape ? 8 : 12,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _cardBorder, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                const Expanded(
                  child: Text(
                    'FAQ',
                    style: TextStyle(
                      fontFamily: 'Georgia',
                      fontWeight: FontWeight.w800,
                      fontSize: 28,
                      color: _headingColor,
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.only(right: isShortLandscape ? 10 : 14),
                  child: _FaqHeaderButton(
                    icon: _showFaqItems
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    onPressed: _toggleFaqItemsVisibility,
                    tooltip: _showFaqItems ? 'Close FAQs' : 'Open FAQs',
                  ),
                ),
              ],
            ),
            SizedBox(height: isShortLandscape ? 10 : 14),
            ...(_showFaqItems
                    ? _faqItems.asMap().entries
                    : <MapEntry<int, _FaqItem>>[
                        MapEntry<int, _FaqItem>(0, _faqItems.first),
                      ])
                .map(
                  (MapEntry<int, _FaqItem> entry) => Padding(
                    padding: EdgeInsets.only(
                      bottom: isShortLandscape ? 10 : 14,
                    ),
                    child: _FaqAccordion(
                      item: entry.value,
                      expanded: _expandedIndex == entry.key,
                      onToggle: () => _toggleIndex(entry.key),
                      compactLayout: isShortLandscape,
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _FaqItem {
  const _FaqItem({required this.question, required this.answer});
  final String question;
  final String answer;
}

class _FaqAccordion extends StatefulWidget {
  const _FaqAccordion({
    required this.item,
    required this.expanded,
    required this.onToggle,
    required this.compactLayout,
  });

  final _FaqItem item;
  final bool expanded;
  final VoidCallback onToggle;
  final bool compactLayout;

  @override
  State<_FaqAccordion> createState() => _FaqAccordionState();
}

class _FaqAccordionState extends State<_FaqAccordion> {
  @override
  Widget build(BuildContext context) {
    final Color accent = _primaryBlue;
    final BorderRadius borderRadius = BorderRadius.circular(
      widget.compactLayout ? 14 : 18,
    );

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: borderRadius,
        border: Border.all(color: _cardBorder, width: 1),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: borderRadius,
          onTap: widget.onToggle,
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: widget.compactLayout ? 14 : 16,
              vertical: widget.compactLayout ? 10 : 14,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        widget.item.question,
                        textAlign: TextAlign.left,
                        style: const TextStyle(
                          fontFamily: 'Georgia',
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                          color: _headingColor,
                        ),
                      ),
                    ),
                    SizedBox(width: widget.compactLayout ? 6 : 8),
                    AnimatedRotation(
                      turns: widget.expanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 220),
                      child: Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: accent,
                        size: 30,
                      ),
                    ),
                  ],
                ),
                AnimatedCrossFade(
                  firstChild: const SizedBox.shrink(),
                  secondChild: Padding(
                    padding: EdgeInsets.only(
                      top: widget.compactLayout ? 8 : 10,
                    ),
                    child: Text(
                      widget.item.answer,
                      textAlign: TextAlign.left,
                      style: const TextStyle(
                        fontFamily: 'Georgia',
                        fontWeight: FontWeight.w500,
                        fontSize: 16,
                        color: _bodyColor,
                        height: 1.5,
                      ),
                    ),
                  ),
                  crossFadeState: widget.expanded
                      ? CrossFadeState.showSecond
                      : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 220),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FaqHeaderButton extends StatelessWidget {
  const _FaqHeaderButton({
    required this.icon,
    required this.onPressed,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkResponse(
          onTap: onPressed,
          radius: 20,
          splashColor: const Color(0xFF8FEAFF).withValues(alpha: 0.16),
          highlightColor: const Color(0xFF8FEAFF).withValues(alpha: 0.08),
          child: Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFF4FAFF),
              border: Border.all(color: _cardBorder, width: 1),
            ),
            child: Icon(icon, color: _primaryBlue, size: 22),
          ),
        ),
      ),
    );
  }
}
