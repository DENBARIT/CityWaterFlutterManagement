"use client";

import { useEffect, useMemo, useState } from "react";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export function useBilling() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBills = async () => {
      setLoading(true);
      try {
        const rows = await superAdminService.getBills();
        setBills(Array.isArray(rows) ? rows : []);
      } finally {
        setLoading(false);
      }
    };

    void loadBills();
  }, []);

  const reports = useMemo(() => {
    const byWoreda = new Map();

    for (const bill of bills) {
      const woredaId = bill?.customer?.woreda?.id || "unknown";
      const woreda = bill?.customer?.woreda?.name || "Unknown Woreda";
      const amount = Number(bill.amount || 0);
      const consumption = Number(bill.consumption || 0);

      if (!byWoreda.has(woredaId)) {
        byWoreda.set(woredaId, {
          woredaId,
          woreda,
          totalBills: 0,
          paidBills: 0,
          unpaidBills: 0,
          totalAmount: 0,
          totalConsumption: 0,
        });
      }

      const group = byWoreda.get(woredaId);
      group.totalBills += 1;
      group.totalAmount += Number.isFinite(amount) ? amount : 0;
      group.totalConsumption += Number.isFinite(consumption) ? consumption : 0;

      if (bill.status === "PAID") {
        group.paidBills += 1;
      } else {
        group.unpaidBills += 1;
      }
    }

    return Array.from(byWoreda.values());
  }, [bills]);

  const filtered = useMemo(() => {
    return reports.filter(
      (r) => !search || r.woreda.toLowerCase().includes(search.toLowerCase()),
    );
  }, [reports, search]);

  const totals = useMemo(
    () => ({
      totalBills: reports.reduce((s, r) => s + r.totalBills, 0),
      totalAmount: reports.reduce((s, r) => s + r.totalAmount, 0),
      totalPaid: reports.reduce((s, r) => s + r.paidBills, 0),
      totalUnpaid: reports.reduce((s, r) => s + r.unpaidBills, 0),
      totalConsumption: reports.reduce((s, r) => s + r.totalConsumption, 0),
    }),
    [reports],
  );

  const exportCSV = () => {
    const headers = [
      "Woreda",
      "Total Bills",
      "Paid",
      "Unpaid",
      "Total Amount (ETB)",
      "Total Consumption (m³)",
      "Collection Rate",
    ];
    const rows = filtered.map((r) => [
      r.woreda,
      r.totalBills,
      r.paidBills,
      r.unpaidBills,
      r.totalAmount.toFixed(2),
      r.totalConsumption.toFixed(2),
      `${(r.totalBills > 0 ? (r.paidBills / r.totalBills) * 100 : 0).toFixed(1)}%`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "billing-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return { reports: filtered, totals, search, setSearch, exportCSV, loading };
}

export function useTariff(customerType = "RESIDENTIAL") {
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTariffs = async () => {
      setLoading(true);
      try {
        const rows = await superAdminService.getTariffs();
        setTariffs(Array.isArray(rows) ? rows : []);
      } finally {
        setLoading(false);
      }
    };

    void loadTariffs();
  }, []);

  const effectiveTariff = useMemo(() => {
    const now = new Date();
    return (
      [...tariffs]
        .filter(
          (t) =>
            new Date(t.effectiveFrom) <= now &&
            String(t.customerType || "RESIDENTIAL").toUpperCase() ===
              String(customerType || "RESIDENTIAL").toUpperCase(),
        )
        .sort(
          (a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom),
        )[0] ?? null
    );
  }, [customerType, tariffs]);

  const saveTariff = async (data) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        customerType: data.customerType,
        effectiveFrom: data.effectiveFrom,
        latePenaltyPerDayPercent: Number(data.latePenaltyPerDayPercent || 0),
        blocks: (Array.isArray(data.blocks) ? data.blocks : []).map(
          (block) => ({
            fromM3: Number(block.fromM3),
            toM3:
              block.toM3 === "" ||
              block.toM3 === null ||
              block.toM3 === undefined
                ? null
                : Number(block.toM3),
            pricePerM3: Number(block.pricePerM3),
          }),
        ),
      };

      if (data.id) {
        await superAdminService.updateTariff(data.id, payload);
      } else {
        await superAdminService.createTariff(payload);
      }

      const rows = await superAdminService.getTariffs();
      setTariffs(Array.isArray(rows) ? rows : []);
    } finally {
      setLoading(false);
    }
  };

  return { tariffs, effectiveTariff, loading, saveTariff };
}
