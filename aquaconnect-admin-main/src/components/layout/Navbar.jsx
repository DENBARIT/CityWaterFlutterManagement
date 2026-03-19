"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(2,15,26,0.92)] backdrop-blur-xl border-b border-[rgba(29,158,117,0.15)]"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-16 py-5">
        {/* Logo */}
        <Link
          href="/"
          className="font-syne font-extrabold text-xl text-[#1D9E75] tracking-tight"
        >
          Aqua<span className="text-[#e8f4f0]">Connect</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm text-[rgba(232,244,240,0.55)] hover:text-[#1D9E75] transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="bg-[#1D9E75] text-[#020f1a] text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#5DCAA5] transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span
            className={`block w-5 h-px bg-[#e8f4f0] transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-[#e8f4f0] transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-[#e8f4f0] transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-8 pb-6 gap-4 border-t border-[rgba(29,158,117,0.1)]">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-[rgba(232,244,240,0.55)] hover:text-[#1D9E75] transition-colors pt-4"
            >
              {label}
            </a>
          ))}

          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="bg-[#1D9E75] text-[#020f1a] text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#5DCAA5] transition-colors text-center mt-2"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
