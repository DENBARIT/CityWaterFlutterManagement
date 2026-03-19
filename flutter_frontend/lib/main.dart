import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:city_water_flutter/features/home/main.dart' as aqua_home;
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/post_sign_in_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  static const String _darkModeKey = 'is_dark_mode';

  bool _isDarkMode = false;

  static final WidgetStateColor _fieldIconColor = WidgetStateColor.resolveWith((
    states,
  ) {
    if (states.contains(WidgetState.focused)) {
      return const Color(0xFF3B82F6);
    }
    return const Color(0xFF6B7280);
  });

  @override
  void initState() {
    super.initState();
    _loadAppState();
  }

  Future<void> _loadAppState() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) {
      return;
    }

    setState(() {
      _isDarkMode = prefs.getBool(_darkModeKey) ?? false;
    });
  }

  Future<void> _setDarkMode(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_darkModeKey, value);
    if (!mounted) {
      return;
    }

    setState(() {
      _isDarkMode = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    final syneFontFamily = GoogleFonts.syne().fontFamily;

    final theme = ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E90FF)),
      useMaterial3: true,
      fontFamily: syneFontFamily,
      textTheme: GoogleFonts.syneTextTheme(),
      primaryTextTheme: GoogleFonts.syneTextTheme(),
      scaffoldBackgroundColor: const Color(0xFFEAF4FF),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0B3B67),
        foregroundColor: Colors.white,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      drawerTheme: const DrawerThemeData(backgroundColor: Colors.white),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: Color(0xFF1E90FF),
        unselectedItemColor: Color(0xFF64748B),
      ),
      inputDecorationTheme: InputDecorationTheme(
        prefixIconColor: _fieldIconColor,
        suffixIconColor: _fieldIconColor,
      ),
    );

    final darkTheme = ThemeData(
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF1E90FF),
        brightness: Brightness.dark,
      ),
      useMaterial3: true,
      fontFamily: syneFontFamily,
      textTheme: GoogleFonts.syneTextTheme(ThemeData.dark().textTheme),
      primaryTextTheme: GoogleFonts.syneTextTheme(ThemeData.dark().textTheme),
      scaffoldBackgroundColor: const Color(0xFF08121D),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0B3B67),
        foregroundColor: Colors.white,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      drawerTheme: const DrawerThemeData(backgroundColor: Color(0xFF0F172A)),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: Color(0xFF60A5FA),
        unselectedItemColor: Color(0xFF94A3B8),
      ),
    );

    return MaterialApp(
      title: 'City Water',
      debugShowCheckedModeBanner: false,
      theme: theme,
      darkTheme: darkTheme,
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      builder: (context, child) {
        final resolvedChild = child ?? const SizedBox.shrink();
        return DefaultTextStyle.merge(
          style: TextStyle(fontFamily: syneFontFamily),
          child: resolvedChild,
        );
      },
      routes: {
        '/home': (_) => const aqua_home.AquaConnectHome(),
        '/login': (_) => const LoginScreen(),
        '/signin': (_) => const LoginScreen(),
        '/signup': (_) => const CreateAccountScreen(),
        '/dashboard': (_) => PostSignInPage(onThemeChanged: _setDarkMode),
      },
      home: const aqua_home.AquaConnectHome(),
    );
  }
}
