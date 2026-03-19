"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardPreview from "@/components/ui/DashboardPreview";
import Link from "next/link";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const LANE_NAMES = ["Addis Ketema", "Bole", "Gulele"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function AnimatedValue({ value, suffix = "", compact = false }) {
  const [displayValue, setDisplayValue] = useState(0);
  const displayValueRef = useRef(0);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();
    const startValue = displayValueRef.current;

    const step = (now) => {
      const progress = clamp((now - start) / 800, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (value - startValue) * eased;
      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  const text = compact
    ? `${Math.round(displayValue / 1000)}K${suffix}`
    : `${displayValue.toFixed(1)}${suffix}`;

  return <span>{text}</span>;
}

export default function LandingPage() {
  const [pulseTick, setPulseTick] = useState(0);
  const [statusOnline, setStatusOnline] = useState(true);
  const [laneValues, setLaneValues] = useState([42, 78, 58]);
  const [meterCount, setMeterCount] = useState(0);
  const [subcityCount, setSubcityCount] = useState(0);
  const [billCount, setBillCount] = useState(0);
  const [complaintCount, setComplaintCount] = useState(0);
  const [consumption, setConsumption] = useState(0);

  useEffect(() => {
    // Fetch stats from backend
    async function fetchStats() {
      try {
        const stats = await superAdminService.getPublicStats();
        setMeterCount(stats.metersCount || 0);
        setSubcityCount(stats.subCitiesCount || 0);
        setBillCount(stats.billsCount || 0);
        setComplaintCount(stats.complaintsCount || 0);
        setConsumption(stats.totalConsumption || 0);
      } catch (e) {
        // fallback to 0
      }
    }
    fetchStats();
  }, []);

  const metricCards = useMemo(
    () => [
      {
        label: "Meters managed",
        value: meterCount,
        compact: true,
        suffix: "+",
      },
      {
        label: "Sub-cities covered",
        value: subcityCount,
        compact: false,
        suffix: "",
      },
      {
        label: "Bills",
        value: billCount,
        compact: false,
        suffix: "",
      },
      {
        label: "Complaints",
        value: complaintCount,
        compact: false,
        suffix: "",
      },
      {
        label: "Consumption",
        value: consumption,
        compact: false,
        suffix: " m³",
      },
    ],
    [meterCount, subcityCount, billCount, complaintCount, consumption],
  );

  const infoCards = useMemo(
    () => [
      [
        "Alerts",
        `${1 + (pulseTick % 3)} critical`,
        `Leak detection in Woreda ${5 + (pulseTick % 4)}`,
      ],
      [
        "Billing Sync",
        `${97.8 + (pulseTick % 5) * 0.3}%`,
        `${statusOnline ? "Next cycle" : "Re-sync"} in ${2 + (pulseTick % 3)}h ${14 + (pulseTick % 5)}m`,
      ],
    ],
    [pulseTick, statusOnline],
  );

  return (
    <main className="bg-[#020f1a] text-[#e8f4f0] min-h-screen overflow-x-hidden">
      <Navbar />

      <section className="min-h-screen flex items-center px-6 md:px-12 lg:px-16 pt-24 pb-14 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_50%,rgba(29,158,117,0.08),transparent)]" />
        <div className="relative w-full grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 xl:gap-14 items-center">
          <div className="max-w-lg xl:max-w-xl mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.25)] rounded-full px-4 py-1.5 text-xs text-[#5DCAA5] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
              Water Utility Management Platform
            </div>
            <h1 className="font-syne text-4xl sm:text-5xl lg:text-5xl xl:text-[4.35rem] font-extrabold leading-[1.04] tracking-tighter mb-6">
              Manage your city&apos;s{" "}
              <em className="not-italic text-[#1D9E75]">water system</em>{" "}
              smarter
            </h1>
            <p className="text-[rgba(232,244,240,0.55)] text-base sm:text-[1.02rem] lg:text-[1rem] leading-relaxed max-w-md xl:max-w-lg mb-8 font-light">
              AquaConnect gives administrators full visibility and control over
              water distribution, billing, and field operations across every
              sub-city and woreda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Link
                href="/login"
                className="bg-[#1D9E75] text-[#020f1a] px-8 py-3 rounded-lg font-medium hover:bg-[#5DCAA5] transition-colors w-full sm:w-auto text-center"
              >
                Access Dashboard
              </Link>
              <a
                href="#live-admin-dashboard-start"
                className="text-[rgba(232,244,240,0.6)] px-6 py-3 rounded-lg border border-[rgba(232,244,240,0.1)] hover:border-[rgba(29,158,117,0.4)] hover:text-[#e8f4f0] transition-all w-full sm:w-auto text-center"
              >
                See how it works
              </a>
            </div>

            <div className="flex flex-wrap gap-6 sm:gap-8 mt-12 pt-7 border-t border-[rgba(29,158,117,0.12)]">
              {metricCards.map((card) => (
                <div key={card.label}>
                  <div className="font-syne text-2xl sm:text-[1.7rem] font-bold text-[#1D9E75] tracking-tight">
                    <AnimatedValue
                      value={card.value}
                      suffix={card.suffix}
                      compact={card.compact}
                    />
                  </div>
                  <div className="text-xs text-[rgba(232,244,240,0.4)] mt-1">
                    {card.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative rounded-3xl border border-[rgba(29,158,117,0.16)] bg-[linear-gradient(145deg,rgba(8,24,36,0.96),rgba(4,18,28,0.92))] p-6 xl:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.2),rgba(29,158,117,0))]" />
              <div className="absolute -bottom-20 -left-14 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(93,202,165,0.15),rgba(93,202,165,0))]" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(93,202,165,0.78)] mb-2">
                      Live Operations Pulse
                    </div>
                    <h3 className="font-syne text-xl font-bold text-[#e8f4f0] leading-tight">
                      Real-time flow orchestration
                    </h3>
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition-colors ${
                      statusOnline
                        ? "border-[rgba(29,158,117,0.3)] bg-[rgba(29,158,117,0.08)] text-[#5DCAA5]"
                        : "border-[rgba(226,75,74,0.32)] bg-[rgba(226,75,74,0.08)] text-[#ff9c9b]"
                    }`}
                  >
                    <span className="text-sm leading-none">↻</span>
                    {statusOnline ? "online" : "offline"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    [
                      "Reservoir",
                      `${72 + (pulseTick % 18)}%`,
                      statusOnline ? "Stable" : "Hold",
                    ],
                    [
                      "Flow Rate",
                      `${148 + (pulseTick % 22)} L/s`,
                      `${statusOnline ? "+" : "-"}${(2.1 + (pulseTick % 4) * 0.4).toFixed(1)}%`,
                    ],
                    [
                      "Pressure",
                      `${(3.1 + (pulseTick % 6) * 0.08).toFixed(1)} bar`,
                      statusOnline ? "Nominal" : "Low",
                    ],
                  ].map(([label, value, state]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[rgba(29,158,117,0.14)] bg-[rgba(29,158,117,0.05)] p-3"
                    >
                      <div className="text-[10px] text-[rgba(232,244,240,0.42)]">
                        {label}
                      </div>
                      <div className="font-syne text-lg font-bold text-[#1D9E75] mt-1 leading-none">
                        {value}
                      </div>
                      <div className="text-[10px] text-[rgba(93,202,165,0.9)] mt-1">
                        {state}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[rgba(29,158,117,0.14)] bg-[rgba(2,15,26,0.72)] p-4 mb-4">
                  <div className="flex items-center justify-between text-xs text-[rgba(232,244,240,0.56)] mb-3">
                    <span>Distribution lanes</span>
                    <span className="text-[#5DCAA5]">
                      auto-updating live state
                    </span>
                  </div>
                  <div className="space-y-3">
                    {LANE_NAMES.map((name, index) => {
                      const level = laneValues[index];
                      const isAddisKetema = index === 0;
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-[rgba(232,244,240,0.62)]">
                              {name}
                            </span>
                            <span className="text-[#5DCAA5]">
                              {Math.round(level)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[rgba(29,158,117,0.12)] overflow-hidden ring-1 ring-[rgba(29,158,117,0.08)]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ease-out ${
                                isAddisKetema
                                  ? "bg-[linear-gradient(90deg,#18c46b,#5DCAA5)] shadow-[0_0_18px_rgba(29,158,117,0.45)]"
                                  : "bg-[linear-gradient(90deg,#1D9E75,#5DCAA5)] opacity-90"
                              }`}
                              style={{
                                width: `${level}%`,
                                boxShadow: isAddisKetema
                                  ? `0 0 ${10 + (pulseTick % 4) * 3}px rgba(24,196,107,0.55)`
                                  : undefined,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {infoCards.map(([title, value, text]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-[rgba(29,158,117,0.14)] bg-[rgba(29,158,117,0.05)] p-3"
                    >
                      <div className="text-[10px] text-[rgba(232,244,240,0.42)] mb-1">
                        {title}
                      </div>
                      <div className="font-syne text-base font-bold text-[#e8f4f0] leading-none mb-1.5">
                        {value}
                      </div>
                      <div className="text-[10px] text-[rgba(232,244,240,0.45)] leading-relaxed">
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="live-admin-dashboard-start" className="scroll-mt-28">
        <DashboardPreview />
      </section>

      <section id="features" className="px-6 md:px-12 lg:px-16 py-16 sm:py-24">
        <div className="text-xs text-[#1D9E75] uppercase tracking-widest mb-3">
          What we offer
        </div>
        <h2 className="font-syne text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Everything you need to run a utility
        </h2>
        <p className="text-[rgba(232,244,240,0.45)] mb-12 font-light max-w-lg">
          From admin management to real-time billing, AquaConnect covers the
          full operational lifecycle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-[rgba(29,158,117,0.08)] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
          {[
            [
              "🏙️",
              "Multi-level Admin Control",
              "Manage system admins and subcity admins with role-based access and full audit visibility.",
            ],
            [
              "💧",
              "Meter Management",
              "Track every meter across all woredas. Assign, update, and monitor consumption in real time.",
            ],
            [
              "📄",
              "Automated Billing",
              "Generate and manage bills automatically based on meter readings and the active tariff rate.",
            ],
            [
              "📍",
              "Location-based Filtering",
              "Filter users and reports by sub-city and woreda for precise administrative oversight.",
            ],
            [
              "💰",
              "Tariff Scheduling",
              "Set new tariffs with effective dates so price changes are applied automatically on time.",
            ],
            [
              "🔐",
              "Secure Authentication",
              "OTP-based email verification, JWT access tokens, and refresh token rotation keep accounts safe.",
            ],
          ].map(([icon, title, desc]) => (
            <div
              key={title}
              className="group relative bg-[#020f1a] p-8 sm:p-10 border-b border-r border-[rgba(29,158,117,0.08)] transition-all duration-500 ease-out transform-gpu hover:-translate-y-2 hover:scale-[1.02] hover:bg-[rgba(29,158,117,0.04)] hover:border-[rgba(29,158,117,0.55)] hover:shadow-[0_0_0_1px_rgba(29,158,117,0.45),0_18px_38px_rgba(2,15,26,0.65),0_0_28px_rgba(29,158,117,0.22)] hover:z-10"
            >
              <div className="w-11 h-11 bg-[rgba(29,158,117,0.12)] rounded-xl flex items-center justify-center text-xl mb-6 transition-transform duration-500 ease-out group-hover:rotate-14 group-hover:scale-110">
                {icon}
              </div>
              <h3 className="font-syne font-bold text-base mb-3">{title}</h3>
              <p className="text-sm text-[rgba(232,244,240,0.45)] leading-relaxed font-light">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-16 py-12 sm:py-20">
        <div className="bg-[rgba(29,158,117,0.05)] border border-[rgba(29,158,117,0.15)] rounded-3xl p-10 sm:p-20 text-center">
          <h2 className="font-syne text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Ready to take control?
          </h2>
          <p className="text-[rgba(232,244,240,0.45)] mb-10 font-light max-w-md mx-auto">
            Sign in to your AquaConnect admin dashboard and start managing your
            city&apos;s water system today.
          </p>
          <Link
            href="/login"
            className="bg-[#1D9E75] text-[#020f1a] px-10 py-3.5 rounded-lg font-medium hover:bg-[#5DCAA5] transition-colors inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-12 lg:px-16 py-6 border-t border-[rgba(29,158,117,0.08)] flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="font-syne font-extrabold text-[#1D9E75]">
          AquaConnect
        </span>
        <span className="text-xs text-[rgba(232,244,240,0.25)]">
          © 2026 AquaConnect. All rights reserved.
        </span>
      </footer>
    </main>
  );
}
