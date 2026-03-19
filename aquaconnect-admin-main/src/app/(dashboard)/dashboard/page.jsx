"use client";

import StatsGrid from "@/features/dashboard/components/StatsGrid";
import TariffCard from "@/features/dashboard/components/TariffCard";
import RecentAdminsTable from "@/features/dashboard/components/RecentAdminsTable";
import { useDashboardOverview } from "@/features/dashboard/hooks/useDashboardOverview";

function OverviewBadge({ label, value, tone = "#1D9E75" }) {
  return (
    <div className="rounded-2xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(232,244,240,0.35)]">
        {label}
      </p>
      <p className="mt-2 font-syne text-2xl font-extrabold tracking-tight text-[#f4fbf8]">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold" style={{ color: tone }}>
        Live snapshot
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const {
    stats,
    effectiveTariff,
    recentAdminsByPeriod,
    loading,
    meters,
    complaints,
    admins,
    subcityAdmins,
    complaintOfficers,
    billingOfficers,
  } = useDashboardOverview();

  const activeMeters = meters.filter((meter) => meter.status === "ACTIVE");
  const openComplaints = complaints.filter((item) => {
    const status = String(item.status || "").toUpperCase();
    return ["OPEN", "IN_PROGRESS", "IN PROGRESS", "ASSIGNED"].includes(status);
  });
  const activeSubcityAdmins = subcityAdmins.filter(
    (admin) => admin.status === "ACTIVE",
  );
  const activeAdmins =
    admins.length + complaintOfficers.length + billingOfficers.length;

  return (
    <div className="space-y-6 text-[#e8f4f0]">
      <section className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[#5DCAA5]">
              Superadmin overview
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-96">
            <OverviewBadge
              label="Meters active"
              value={activeMeters.length.toLocaleString()}
              tone="#378ADD"
            />
            <OverviewBadge
              label="Open complaints"
              value={openComplaints.length.toLocaleString()}
              tone="#D4537E"
            />
            <OverviewBadge
              label="Active admins"
              value={activeAdmins.toLocaleString()}
              tone="#9D9BFF"
            />
          </div>
        </div>
      </section>

      <StatsGrid stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TariffCard tariff={effectiveTariff} loading={loading} />
        <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5">
          <h3 className="font-syne font-bold text-sm tracking-tight">
            Staff coverage
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <OverviewBadge
              label="Subcity admins"
              value={subcityAdmins.length.toLocaleString()}
            />
            <OverviewBadge
              label="Complaint officers"
              value={complaintOfficers.length.toLocaleString()}
              tone="#D4537E"
            />
            <OverviewBadge
              label="Billing officers"
              value={billingOfficers.length.toLocaleString()}
              tone="#378ADD"
            />
            <OverviewBadge
              label="Active subcity"
              value={activeSubcityAdmins.length.toLocaleString()}
              tone="#5DCAA5"
            />
          </div>
        </div>
      </div>

      <RecentAdminsTable
        adminsByPeriod={recentAdminsByPeriod}
        loading={loading}
      />
    </div>
  );
}
