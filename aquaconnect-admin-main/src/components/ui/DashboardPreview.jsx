"use client";

import { useEffect, useMemo, useState } from "react";

const previewWaveStepSeconds = 0.42;

const previewTabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    panelTitle: "Overview",
    panelSubtitle: "Live utility health and system performance",
    metrics: [
      { label: "Total Users", value: 4821 },
      { label: "Active Meters", value: 3940 },
      { label: "Bills Issued", value: 1204 },
      { label: "Tariff/m³", value: 12.5, decimals: 2 },
    ],
    bars: [40, 65, 50, 80, 70, 55, 90, 75],
  },
  {
    id: "admins",
    label: "Admins",
    panelTitle: "Admin Management",
    panelSubtitle: "Role coverage across sub-cities and woredas",
    metrics: [
      { label: "Total Admins", value: 54 },
      { label: "Sub-city Admins", value: 18 },
      { label: "Woreda Admins", value: 32 },
      { label: "Active Sessions", value: 47 },
    ],
    bars: [35, 58, 72, 64, 78, 62, 74, 68],
  },
  {
    id: "users",
    label: "Users",
    panelTitle: "User Insights",
    panelSubtitle: "Customer growth and active service accounts",
    metrics: [
      { label: "Registered Users", value: 12940 },
      { label: "New This Month", value: 386 },
      { label: "Active Connections", value: 11872 },
      { label: "Satisfaction", value: 94.6, decimals: 1, suffix: "%" },
    ],
    bars: [46, 59, 67, 72, 76, 69, 81, 88],
  },
  {
    id: "billing",
    label: "Billing",
    panelTitle: "Billing Operations",
    panelSubtitle: "Collection pace and invoice processing volume",
    metrics: [
      { label: "Bills Generated", value: 8420 },
      { label: "Paid Bills", value: 7038 },
      { label: "Pending", value: 1382 },
      { label: "Collection Rate", value: 83.6, decimals: 1, suffix: "%" },
    ],
    bars: [30, 42, 55, 67, 78, 72, 64, 58],
  },
  {
    id: "tariff",
    label: "Tariff",
    panelTitle: "Tariff Planning",
    panelSubtitle: "Rate updates and billing impact projections",
    metrics: [
      { label: "Current Tariff/m³", value: 12.5, decimals: 2 },
      { label: "Proposed Tariff/m³", value: 13.25, decimals: 2 },
      { label: "Projected Revenue", value: 1245000 },
      { label: "Approval Progress", value: 72, suffix: "%" },
    ],
    bars: [38, 44, 52, 61, 69, 76, 82, 87],
  },
];

function AnimatedNumber({ value, decimals = 0, suffix = "", resetKey }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;
    const durationMs = 1050;

    const animate = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * easedProgress);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [value, resetKey]);

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span>
      {formatter.format(displayValue)}
      {suffix}
    </span>
  );
}

export default function DashboardPreview({ className = "", compact = false }) {
  const [activeTabId, setActiveTabId] = useState(previewTabs[0].id);

  const activeTab = useMemo(
    () => previewTabs.find((tab) => tab.id === activeTabId) ?? previewTabs[0],
    [activeTabId],
  );

  return (
    <section
      className={`${
        compact ? "" : "px-6 md:px-12 lg:px-16 pb-16"
      } ${className}`.trim()}
    >
      <div className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.12)] rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>

        <div className="bg-[#020f1a] border border-[rgba(29,158,117,0.08)] rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-6 min-h-60">
          <div className="sm:w-40 sm:border-r border-b sm:border-b-0 border-[rgba(29,158,117,0.08)] pb-4 sm:pb-0 sm:pr-6 shrink-0">
            <div className="font-syne font-extrabold text-sm text-[#1D9E75] mb-4">
              AquaConnect
            </div>

            <div className="flex sm:flex-col flex-wrap gap-1">
              {previewTabs.map((tab) => {
                const isActive = tab.id === activeTab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                      isActive
                        ? "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]"
                        : "text-[rgba(232,244,240,0.35)] hover:text-[rgba(232,244,240,0.7)] hover:bg-[rgba(29,158,117,0.06)]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <div className="font-syne font-bold text-sm text-[#5DCAA5] tracking-wide">
                {activeTab.panelTitle}
              </div>
              <div className="text-[11px] text-[rgba(232,244,240,0.35)] mt-1">
                {activeTab.panelSubtitle}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
              {activeTab.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="bg-[rgba(29,158,117,0.06)] border border-[rgba(29,158,117,0.1)] rounded-lg p-3"
                >
                  <div className="text-[10px] text-[rgba(232,244,240,0.35)] mb-1">
                    {metric.label}
                  </div>
                  <div className="font-syne font-bold text-base text-[#1D9E75]">
                    <AnimatedNumber
                      value={metric.value}
                      decimals={metric.decimals ?? 0}
                      suffix={metric.suffix ?? ""}
                      resetKey={activeTab.id}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.08)] rounded-lg p-3 h-20 sm:h-24 flex items-end gap-1.5">
              {activeTab.bars.map((heightPercent, index) => (
                <div
                  key={`${activeTab.id}-${index}`}
                  className="flex-1 rounded-t-sm bg-[rgba(29,158,117,0.25)] animate-preview-bar"
                  style={{
                    height: `${heightPercent}%`,
                    animationDelay: `${index * previewWaveStepSeconds}s`,
                    animationDuration: `${activeTab.bars.length * previewWaveStepSeconds}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
