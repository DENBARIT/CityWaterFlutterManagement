"use client";

import { useMemo, useState } from "react";
import { useDashboardOverview } from "@/features/dashboard/hooks/useDashboardOverview";

function getMonthKey(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey) {
  if (!monthKey) return "-";

  const [year, month] = String(monthKey).split("-");
  if (!year || !month) return String(monthKey);

  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short" });
}

function buildMonthlySeries(rows) {
  const grouped = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const key = row?.monthYear || getMonthKey(row?.createdAt);
    if (!key) continue;

    const current = grouped.get(key) || {
      key,
      label: formatMonthLabel(key),
      revenue: 0,
      consumption: 0,
      count: 0,
    };

    current.revenue += Number(row?.amount || 0);
    current.consumption += Number(row?.consumption || 0);
    current.count += 1;
    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .sort((a, b) => String(a.key).localeCompare(String(b.key)))
    .slice(-6);
}

function buildMonthCount(rows) {
  const grouped = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const key = getMonthKey(row?.createdAt);
    if (!key) continue;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  return grouped;
}

function formatPercentChange(current, previous) {
  if (!previous && !current) return "0.0%";
  if (!previous) return "+100.0%";

  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function MetricCard({ label, value, delta, tone }) {
  return (
    <div className="rounded-2xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(232,244,240,0.35)]">
        {label}
      </p>
      <p className="mt-2 font-syne text-2xl font-extrabold tracking-tight text-[#f4fbf8]">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold" style={{ color: tone }}>
        {delta}
      </p>
    </div>
  );
}

function Sparkline({ values, stroke, fill }) {
  const safeValues = Array.isArray(values) ? values : [];

  if (!safeValues.length) {
    return (
      <div className="h-24 rounded-xl border border-dashed border-[rgba(29,158,117,0.12)] bg-[rgba(29,158,117,0.03)] flex items-center justify-center text-xs text-[rgba(232,244,240,0.35)]">
        No data yet
      </div>
    );
  }

  const width = 320;
  const height = 96;
  const padding = 10;
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const span = max - min || 1;
  const step =
    safeValues.length > 1 ? (width - padding * 2) / (safeValues.length - 1) : 0;

  const points = safeValues
    .map((value, index) => {
      const x = padding + index * step;
      const normalized = (value - min) / span;
      const y = height - padding - normalized * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = safeValues.length
    ? [
        `M ${padding} ${height - padding}`,
        ...safeValues.map((value, index) => {
          const x = padding + index * step;
          const normalized = (value - min) / span;
          const y = height - padding - normalized * (height - padding * 2);
          return `L ${x} ${y}`;
        }),
        `L ${padding + step * (safeValues.length - 1)} ${height - padding}`,
        "Z",
      ].join(" ")
    : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 sm:h-28">
      <defs>
        <linearGradient id="stats-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.28" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#stats-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PieLegendItem({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-[rgba(232,244,240,0.7)]">{label}</span>
      </div>
      <span className="font-semibold text-[#e8f4f0]">{value}</span>
    </div>
  );
}

function PieChart({ segments, totalLabel, centerLabel }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (!total) {
    return (
      <div className="h-full rounded-2xl border border-dashed border-[rgba(29,158,117,0.12)] bg-[rgba(29,158,117,0.03)] flex items-center justify-center text-sm text-[rgba(232,244,240,0.35)]">
        No data yet
      </div>
    );
  }

  let start = 0;
  const slices = segments.map((segment) => {
    const percent = (segment.value / total) * 100;
    const end = start + percent;
    const slice = `${segment.color} ${start}% ${end}%`;
    start = end;
    return slice;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div
          className="relative h-48 w-48 rounded-full border border-[rgba(29,158,117,0.08)] shadow-[0_16px_50px_rgba(0,0,0,0.22)]"
          style={{ background: `conic-gradient(${slices.join(",")})` }}
        >
          <div className="absolute inset-8 rounded-full bg-[#05141f] border border-[rgba(29,158,117,0.08)] flex flex-col items-center justify-center text-center p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[rgba(232,244,240,0.3)]">
              {totalLabel}
            </p>
            <p className="mt-2 font-syne text-4xl font-extrabold text-[#1D9E75]">
              {total}
            </p>
            <p className="mt-1 text-[11px] text-[rgba(232,244,240,0.45)]">
              {centerLabel}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((segment) => (
          <PieLegendItem
            key={segment.label}
            label={segment.label}
            value={segment.value}
            color={segment.color}
          />
        ))}
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const {
    bills,
    meters,
    admins,
    subcityAdmins,
    complaintOfficers,
    billingOfficers,
    complaints,
  } = useDashboardOverview();

  const [activeFocus, setActiveFocus] = useState("revenue");

  const monthlySeries = useMemo(() => buildMonthlySeries(bills), [bills]);
  const meterMonthCounts = useMemo(() => buildMonthCount(meters), [meters]);
  const complaintMonthCounts = useMemo(
    () => buildMonthCount(complaints),
    [complaints],
  );

  const currentMonthKey = getMonthKey();
  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthKey = getMonthKey(previousMonthDate);

  const currentSeries = monthlySeries.find(
    (item) => item.key === currentMonthKey,
  ) ||
    monthlySeries[monthlySeries.length - 1] || {
      revenue: 0,
      consumption: 0,
      count: 0,
    };
  const previousSeries = monthlySeries.find(
    (item) => item.key === previousMonthKey,
  ) ||
    monthlySeries[monthlySeries.length - 2] || {
      revenue: 0,
      consumption: 0,
      count: 0,
    };

  const currentMeterCount = meterMonthCounts.get(currentMonthKey) || 0;
  const previousMeterCount = meterMonthCounts.get(previousMonthKey) || 0;
  const currentComplaintCount = complaintMonthCounts.get(currentMonthKey) || 0;
  const previousComplaintCount =
    complaintMonthCounts.get(previousMonthKey) || 0;

  const revenueGrowth = formatPercentChange(
    currentSeries.revenue,
    previousSeries.revenue,
  );
  const consumptionGrowth = formatPercentChange(
    currentSeries.consumption,
    previousSeries.consumption,
  );
  const meterGrowth = formatPercentChange(
    currentMeterCount,
    previousMeterCount,
  );
  const complaintGrowth = formatPercentChange(
    currentComplaintCount,
    previousComplaintCount,
  );

  const statusBreakdown = useMemo(() => {
    const normalize = (value) => String(value || "").toUpperCase();
    const open = complaints.filter(
      (item) => normalize(item.status) === "OPEN",
    ).length;
    const progress = complaints.filter((item) =>
      ["IN_PROGRESS", "IN PROGRESS", "ASSIGNED"].includes(
        normalize(item.status),
      ),
    ).length;
    const resolved = complaints.filter(
      (item) => normalize(item.status) === "RESOLVED",
    ).length;
    const closed = complaints.filter(
      (item) => normalize(item.status) === "CLOSED",
    ).length;

    return [
      { label: "Open", value: open, color: "#E24B4A" },
      { label: "In progress", value: progress, color: "#EF9F27" },
      { label: "Resolved", value: resolved, color: "#1D9E75" },
      { label: "Closed", value: closed, color: "#378ADD" },
    ];
  }, [complaints]);

  const adminRoleRows = useMemo(() => {
    const normalizeRole = (value) => String(value || "").toUpperCase();
    const woredaAdminCount = admins.filter((admin) =>
      ["WOREDA_ADMIN", "WOREDA_ADMINS"].includes(normalizeRole(admin.role)),
    ).length;

    return [
      {
        label: "Subcity admins",
        value: subcityAdmins.length,
        color: "#1D9E75",
      },
      { label: "Woreda admins", value: woredaAdminCount, color: "#5DCAA5" },
      {
        label: "Billing officers",
        value: billingOfficers.length,
        color: "#378ADD",
      },
      {
        label: "Complaint officers",
        value: complaintOfficers.length,
        color: "#D4537E",
      },
    ];
  }, [admins, subcityAdmins, billingOfficers, complaintOfficers]);

  const focusOptions = [
    {
      id: "revenue",
      label: "Revenue",
      value: `${Number(currentSeries.revenue || 0).toLocaleString()} ETB`,
      tone: "#1D9E75",
      detail: `${revenueGrowth} from last month`,
    },
    {
      id: "consumption",
      label: "Consumption",
      value: `${Number(currentSeries.consumption || 0).toLocaleString()} m³`,
      tone: "#5DCAA5",
      detail: `${consumptionGrowth} from last month`,
    },
    {
      id: "complaints",
      label: "Complaints",
      value: currentComplaintCount.toLocaleString(),
      tone: "#D4537E",
      detail: `${complaintGrowth} from last month`,
    },
  ];

  const activeFocusItem =
    focusOptions.find((item) => item.id === activeFocus) || focusOptions[0];

  const revenueValues = monthlySeries.map((item) => item.revenue);
  const consumptionValues = monthlySeries.map((item) => item.consumption);
  const totalStaff =
    subcityAdmins.length + complaintOfficers.length + billingOfficers.length;

  return (
    <div className="space-y-6 text-[#e8f4f0]">
      <section className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[#5DCAA5]">
              Statistics
            </p>
            <h2 className="mt-2 font-syne text-2xl sm:text-3xl font-extrabold tracking-tight">
              Graphs, pie charts, and deep operational detail
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[rgba(232,244,240,0.55)]">
              This section is built for analysis: monthly billing, complaint
              mix, staff distribution, meter growth, and trend breakdowns.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:w-136">
            {focusOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveFocus(item.id)}
                className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                  activeFocus === item.id
                    ? "border-[rgba(29,158,117,0.28)] bg-[rgba(29,158,117,0.08)] shadow-[0_10px_28px_rgba(29,158,117,0.14)]"
                    : "border-[rgba(255,255,255,0.05)] bg-white/5 hover:bg-white/7 hover:border-[rgba(29,158,117,0.15)]"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(232,244,240,0.35)]">
                  {item.label}
                </p>
                <p className="mt-2 font-syne text-2xl font-bold tracking-tight text-[#f4fbf8]">
                  {item.value}
                </p>
                <p
                  className="mt-2 text-xs font-semibold"
                  style={{ color: item.tone }}
                >
                  {item.detail}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-syne text-sm font-bold tracking-tight">
                Revenue and consumption trend
              </h3>
              <p className="mt-1 text-[10px] text-[rgba(232,244,240,0.35)]">
                Recent months are shown with a live sparkline comparison.
              </p>
            </div>
            <div className="text-right text-[10px] text-[rgba(232,244,240,0.35)]">
              <p>{revenueGrowth} revenue growth</p>
              <p>{consumptionGrowth} consumption growth</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Sparkline values={revenueValues} stroke="#1D9E75" fill="#1D9E75" />
            <Sparkline
              values={consumptionValues}
              stroke="#5DCAA5"
              fill="#5DCAA5"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[rgba(232,244,240,0.45)]">
            {monthlySeries.map((item) => (
              <div
                key={item.key}
                className="rounded-lg bg-[rgba(29,158,117,0.04)] px-3 py-2"
              >
                <p className="font-semibold text-[#e8f4f0]">{item.label}</p>
                <p className="mt-1">
                  {Number(item.revenue || 0).toLocaleString()} ETB
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5 sm:p-6">
          <h3 className="font-syne text-sm font-bold tracking-tight">
            Selected focus detail
          </h3>
          <div className="mt-4 rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(232,244,240,0.35)]">
              {activeFocusItem.label}
            </p>
            <p className="mt-2 font-syne text-4xl font-extrabold tracking-tight text-[#f4fbf8]">
              {activeFocusItem.value}
            </p>
            <p className="mt-2 text-sm text-[rgba(232,244,240,0.55)]">
              {activeFocusItem.detail}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard
              label="Meters generated"
              value={currentMeterCount.toLocaleString()}
              delta={`${meterGrowth} this month`}
              tone="#378ADD"
            />
            <MetricCard
              label="Open complaints"
              value={currentComplaintCount.toLocaleString()}
              delta={`${complaintGrowth} this month`}
              tone="#D4537E"
            />
            <MetricCard
              label="Active staff"
              value={totalStaff.toLocaleString()}
              delta={`${subcityAdmins.length} subcity admins`}
              tone="#9D9BFF"
            />
            <MetricCard
              label="Active months"
              value={monthlySeries.length.toLocaleString()}
              delta="billing windows"
              tone="#EF9F27"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5 sm:p-6">
          <h3 className="font-syne text-sm font-bold tracking-tight">
            Complaint status mix
          </h3>
          <p className="mt-1 text-[10px] text-[rgba(232,244,240,0.35)]">
            The pie chart highlights the live complaint distribution.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
            <PieChart
              segments={statusBreakdown}
              totalLabel="Complaints"
              centerLabel="status breakdown"
            />
            <div className="space-y-2">
              {statusBreakdown.map((segment) => (
                <PieLegendItem
                  key={segment.label}
                  label={segment.label}
                  value={segment.value}
                  color={segment.color}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5 sm:p-6">
          <h3 className="font-syne text-sm font-bold tracking-tight">
            Staff distribution
          </h3>
          <p className="mt-1 text-[10px] text-[rgba(232,244,240,0.35)]">
            Admin coverage and officer mix across the dashboard.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
            <PieChart
              segments={adminRoleRows}
              totalLabel="Roles"
              centerLabel="coverage count"
            />
            <div className="space-y-2">
              {adminRoleRows.map((segment) => (
                <PieLegendItem
                  key={segment.label}
                  label={segment.label}
                  value={segment.value}
                  color={segment.color}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
