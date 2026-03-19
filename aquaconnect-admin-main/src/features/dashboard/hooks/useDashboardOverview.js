"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

function formatMonthLabel(value) {
  if (!value) return "-";

  // Expected format from backend: YYYY-MM
  const [year, month] = String(value).split("-");
  if (!year || !month) return String(value);

  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short" });
}

const ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "SUBCITY_ADMIN",
  "WOREDA_ADMINS",
  "WOREDA_ADMIN",
]);

function isAdminRole(role) {
  return ADMIN_ROLES.has(String(role || "").toUpperCase());
}

function getDayStartOffset(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function groupRecentAdmins(rows) {
  const startOfToday = getDayStartOffset(0);
  const startOfYesterday = getDayStartOffset(1);
  const startOfWeekWindow = getDayStartOffset(7);

  const grouped = {
    today: [],
    yesterday: [],
    withinWeek: [],
  };

  const sortedRows = [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    const aTime = new Date(a?.lastLoginAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.lastLoginAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  for (const admin of sortedRows) {
    const sourceDate = admin?.lastLoginAt || admin?.createdAt;
    if (!sourceDate) continue;

    const loginDate = new Date(sourceDate);
    if (Number.isNaN(loginDate.getTime())) continue;

    if (loginDate >= startOfToday) {
      grouped.today.push(admin);
      continue;
    }

    if (loginDate >= startOfYesterday) {
      grouped.yesterday.push(admin);
      continue;
    }

    if (loginDate >= startOfWeekWindow) {
      grouped.withinWeek.push(admin);
    }
  }

  return grouped;
}

function toRecentAdminRows(rows, maxRows = 6) {
  return [...(Array.isArray(rows) ? rows : [])]
    .filter((admin) => isAdminRole(admin?.role))
    .sort((a, b) => {
      const aTime = new Date(a?.lastLoginAt || a?.createdAt || 0).getTime();
      const bTime = new Date(b?.lastLoginAt || b?.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, maxRows)
    .map((admin) => ({
      ...admin,
      lastLoginAt: admin?.lastLoginAt || admin?.createdAt || null,
    }));
}

function mergeUniqueAdmins(...adminLists) {
  const byId = new Map();

  for (const list of adminLists) {
    for (const admin of Array.isArray(list) ? list : []) {
      const key = admin?.id || admin?.email;
      if (!key || byId.has(key)) continue;
      byId.set(key, admin);
    }
  }

  return Array.from(byId.values());
}

export function useDashboardOverview() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [meters, setMeters] = useState([]);
  const [bills, setBills] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [complaintOfficers, setComplaintOfficers] = useState([]);
  const [billingOfficers, setBillingOfficers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [recentAdminsByPeriod, setRecentAdminsByPeriod] = useState({
    today: [],
    yesterday: [],
    withinWeek: [],
  });
  const [tariffs, setTariffs] = useState([]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [
        usersResult,
        metersResult,
        billsResult,
        superAdminsResult,
        subcityAdminsResult,
        woredaAdminsResult,
        woredaAdminAltResult,
        tariffsResult,
        complaintOfficersResult,
        billingOfficersResult,
        complaintsResult,
        schedulesResult,
      ] = await Promise.allSettled([
        superAdminService.getAllUsers(),
        superAdminService.getMeters(),
        superAdminService.getBills(),
        superAdminService.searchAdmins({ role: "SUPER_ADMIN" }),
        superAdminService.searchAdmins({ role: "SUBCITY_ADMIN" }),
        superAdminService.searchAdmins({ role: "WOREDA_ADMINS" }),
        superAdminService
          .searchAdmins({ role: "WOREDA_ADMIN" })
          .catch(() => []),
        superAdminService.getTariffs(),
        superAdminService.getComplaintOfficers(),
        superAdminService.getBillingOfficers(),
        superAdminService.getComplaints(),
        superAdminService.getSchedules(),
      ]);

      const usersRows =
        usersResult.status === "fulfilled" ? usersResult.value : [];
      const metersRows =
        metersResult.status === "fulfilled" ? metersResult.value : [];
      const billsRows =
        billsResult.status === "fulfilled" ? billsResult.value : [];
      const superAdminsRows =
        superAdminsResult.status === "fulfilled" ? superAdminsResult.value : [];
      const subcityAdminsRows =
        subcityAdminsResult.status === "fulfilled"
          ? subcityAdminsResult.value
          : [];
      const woredaAdminsRows =
        woredaAdminsResult.status === "fulfilled"
          ? woredaAdminsResult.value
          : [];
      const woredaAdminRowsAlt =
        woredaAdminAltResult.status === "fulfilled"
          ? woredaAdminAltResult.value
          : [];
      const tariffsRows =
        tariffsResult.status === "fulfilled" ? tariffsResult.value : [];
      const complaintOfficersRows =
        complaintOfficersResult.status === "fulfilled"
          ? complaintOfficersResult.value
          : [];
      const billingOfficersRows =
        billingOfficersResult.status === "fulfilled"
          ? billingOfficersResult.value
          : [];
      const complaintsRows =
        complaintsResult.status === "fulfilled" ? complaintsResult.value : [];
      const schedulesRows =
        schedulesResult.status === "fulfilled" ? schedulesResult.value : [];

      let allAdminsRows = mergeUniqueAdmins(
        superAdminsRows,
        subcityAdminsRows,
        woredaAdminsRows,
        woredaAdminRowsAlt,
      );

      if (!allAdminsRows.length) {
        try {
          const fallbackAdminsRows = await superAdminService.getAllAdmins();
          allAdminsRows = mergeUniqueAdmins(fallbackAdminsRows);
        } catch {
          allAdminsRows = [];
        }
      }

      const normalizedAdmins = allAdminsRows.filter((admin) =>
        isAdminRole(admin?.role),
      );

      let recentAdminsRows = null;
      try {
        recentAdminsRows = await superAdminService.getRecentAdmins(30);
      } catch {
        recentAdminsRows = null;
      }

      const groupedFromEndpoint = Array.isArray(recentAdminsRows)
        ? groupRecentAdmins(recentAdminsRows)
        : {
            today: (recentAdminsRows?.today || []).filter((admin) =>
              isAdminRole(admin?.role),
            ),
            yesterday: (recentAdminsRows?.yesterday || []).filter((admin) =>
              isAdminRole(admin?.role),
            ),
            withinWeek: (recentAdminsRows?.withinWeek || []).filter((admin) =>
              isAdminRole(admin?.role),
            ),
          };

      const groupedCount =
        groupedFromEndpoint.today.length +
        groupedFromEndpoint.yesterday.length +
        groupedFromEndpoint.withinWeek.length;

      const groupedFallback = groupRecentAdmins(normalizedAdmins);

      const fallbackTotal =
        groupedFallback.today.length +
        groupedFallback.yesterday.length +
        groupedFallback.withinWeek.length;

      const alwaysVisibleFallback =
        fallbackTotal > 0
          ? groupedFallback
          : {
              today: [],
              yesterday: [],
              withinWeek: toRecentAdminRows(normalizedAdmins, 6),
            };

      setUsers(Array.isArray(usersRows) ? usersRows : []);
      setMeters(Array.isArray(metersRows) ? metersRows : []);
      setBills(Array.isArray(billsRows) ? billsRows : []);
      setAdmins(normalizedAdmins);
      setComplaintOfficers(
        Array.isArray(complaintOfficersRows) ? complaintOfficersRows : [],
      );
      setBillingOfficers(
        Array.isArray(billingOfficersRows) ? billingOfficersRows : [],
      );
      setComplaints(Array.isArray(complaintsRows) ? complaintsRows : []);
      setSchedules(Array.isArray(schedulesRows) ? schedulesRows : []);
      setRecentAdminsByPeriod({
        today:
          groupedCount > 0
            ? groupedFromEndpoint.today
            : alwaysVisibleFallback.today,
        yesterday:
          groupedCount > 0
            ? groupedFromEndpoint.yesterday
            : alwaysVisibleFallback.yesterday,
        withinWeek:
          groupedCount > 0
            ? groupedFromEndpoint.withinWeek
            : alwaysVisibleFallback.withinWeek,
      });
      setTariffs(Array.isArray(tariffsRows) ? tariffsRows : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const activeMeters = useMemo(
    () => meters.filter((m) => m.status === "ACTIVE").length,
    [meters],
  );

  const subcityAdmins = useMemo(
    () => admins.filter((a) => a.role === "SUBCITY_ADMIN"),
    [admins],
  );

  const activeSubcityAdmins = useMemo(
    () => subcityAdmins.filter((a) => a.status === "ACTIVE").length,
    [subcityAdmins],
  );

  const recentAdmins = useMemo(
    () => [
      ...recentAdminsByPeriod.today,
      ...recentAdminsByPeriod.yesterday,
      ...recentAdminsByPeriod.withinWeek,
    ],
    [recentAdminsByPeriod],
  );

  const effectiveTariff = useMemo(() => {
    const now = new Date();
    return (
      [...tariffs]
        .filter(
          (t) =>
            new Date(t.effectiveFrom) <= now &&
            String(t.customerType || "RESIDENTIAL").toUpperCase() ===
              "RESIDENTIAL",
        )
        .sort(
          (a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom),
        )[0] || null
    );
  }, [tariffs]);

  const monthlyBilling = useMemo(() => {
    const grouped = new Map();

    for (const bill of bills) {
      const key = bill.monthYear || "unknown";
      const current = grouped.get(key) || { totalAmount: 0, count: 0 };
      current.totalAmount += Number(bill.amount || 0);
      current.count += 1;
      grouped.set(key, current);
    }

    const sorted = Array.from(grouped.entries())
      .filter(([key]) => key !== "unknown")
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .slice(-8)
      .map(([key, value]) => ({
        label: formatMonthLabel(key),
        totalAmount: value.totalAmount,
        count: value.count,
      }));

    const maxAmount = sorted.reduce(
      (max, item) => (item.totalAmount > max ? item.totalAmount : max),
      0,
    );

    return sorted.map((item) => ({
      ...item,
      heightPercent: maxAmount > 0 ? (item.totalAmount / maxAmount) * 100 : 0,
    }));
  }, [bills]);

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: users.length.toLocaleString(),
        change: `${users.filter((u) => u.status === "ACTIVE").length.toLocaleString()} active`,
      },
      {
        label: "Active Meters",
        value: activeMeters.toLocaleString(),
        change: `${meters.length.toLocaleString()} total meters`,
      },
      {
        label: "Bills Issued",
        value: bills.length.toLocaleString(),
        change: `${bills.filter((b) => b.status === "PAID").length.toLocaleString()} paid`,
      },
      {
        label: "Subcity Admins",
        value: subcityAdmins.length.toLocaleString(),
        change: `${activeSubcityAdmins.toLocaleString()} active`,
      },
      {
        label: "Complaint Officers",
        value: complaintOfficers.length.toLocaleString(),
        change: `${complaintOfficers.filter((o) => o.status === "ACTIVE").length.toLocaleString()} active`,
      },
      {
        label: "Billing Officers",
        value: billingOfficers.length.toLocaleString(),
        change: `${billingOfficers.filter((o) => o.status === "ACTIVE").length.toLocaleString()} active`,
      },
      {
        label: "Complaints",
        value: complaints.length.toLocaleString(),
        change: `${complaints.filter((c) => c.status === "OPEN").length.toLocaleString()} open`,
      },
      {
        label: "Schedules",
        value: schedules.length.toLocaleString(),
        change: `${schedules.filter((schedule) => schedule.status === "ACTIVE").length.toLocaleString()} active`,
      },
    ],
    [
      users,
      activeMeters,
      meters,
      bills,
      subcityAdmins,
      activeSubcityAdmins,
      complaintOfficers,
      billingOfficers,
      complaints,
      schedules,
    ],
  );

  return {
    loading,
    stats,
    monthlyBilling,
    effectiveTariff,
    recentAdmins,
    recentAdminsByPeriod,
    users,
    meters,
    bills,
    admins,
    subcityAdmins,
    complaintOfficers,
    billingOfficers,
    complaints,
    schedules,
    activeMeters,
    activeSubcityAdmins,
    refreshOverview: loadOverview,
  };
}
