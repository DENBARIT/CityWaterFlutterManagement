"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 5;

export function useBills({ statusFilter = "" } = {}) {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [payTarget, setPayTarget] = useState(null);
  const [waiveTarget, setWaiveTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await superAdminService.getBills();
      const normalized = (Array.isArray(rows) ? rows : []).map((b) => ({
        ...b,
        penaltyApplied: Number(b.penaltyAmount || 0) > 0,
      }));
      setBills(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBills();
  }, [loadBills]);

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      const matchSearch =
        !search ||
        b.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        b.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
        String(b.monthYear || "").includes(search);

      let matchStatus = true;
      if (statusFilter === "ESCALATED") {
        matchStatus =
          b.customer?.paymentFlag === "LEGAL_ACTION" && b.status !== "PAID";
      } else if (statusFilter) {
        matchStatus = b.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [bills, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const markAsPaid = async (id, amount) => {
    setLoading(true);
    try {
      await superAdminService.markBillPaid(id, amount);
      await loadBills();
      setPayTarget(null);
    } finally {
      setLoading(false);
    }
  };

  const waivePenalty = async (id) => {
    setLoading(true);
    try {
      await superAdminService.waiveBillPenalty(id);
      await loadBills();
      setWaiveTarget(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Customer",
      "Email",
      "Month",
      "Consumption",
      "Amount",
      "Penalty",
      "Status",
      "Due Date",
    ];
    const rows = filtered.map((b) => [
      b.customer.fullName,
      b.customer.email,
      b.monthYear,
      b.consumption,
      b.amount,
      b.penaltyAmount,
      b.status,
      new Date(b.dueDate).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bills-${statusFilter || "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    bills: paginated,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    loading,
    payTarget,
    setPayTarget,
    waiveTarget,
    setWaiveTarget,
    markAsPaid,
    waivePenalty,
    exportCSV,
    totalCount: filtered.length,
    allBills: bills,
  };
}
