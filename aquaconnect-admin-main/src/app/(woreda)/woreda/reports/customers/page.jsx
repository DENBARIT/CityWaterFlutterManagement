"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

function toPaymentFlag(userId, bills) {
  const mine = bills.filter((b) => b.customer?.id === userId);
  const overdue = mine.filter((b) => b.status === "OVERDUE").length;
  const unpaid = mine.filter((b) => b.status === "UNPAID").length;

  if (overdue > 0) return "LEGAL_ACTION";
  if (unpaid >= 2) return "CRITICAL";
  if (unpaid === 1) return "WARNING";
  return "NONE";
}

export default function CustomerReportPage() {
  const [users, setUsers] = useState([]);
  const [bills, setBills] = useState([]);

  const woredaId = getJwtPayload()?.woredaId || "";

  useEffect(() => {
    const loadData = async () => {
      const [usersRows, billsRows] = await Promise.all([
        superAdminService.getUsersByLocation({ woredaId }),
        superAdminService.getBills({ woredaId }),
      ]);

      setUsers(Array.isArray(usersRows) ? usersRows : []);
      setBills(Array.isArray(billsRows) ? billsRows : []);
    };

    loadData();
  }, [woredaId]);

  const normalizedUsers = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        meter: Array.isArray(u.meters) ? u.meters[0] || null : null,
        paymentFlag: toPaymentFlag(u.id, bills),
      })),
    [users, bills],
  );

  const totalCustomers = normalizedUsers.length;

  const breakdown = useMemo(
    () => ({
      active: normalizedUsers.filter((u) => u.status === "ACTIVE").length,
      suspended: normalizedUsers.filter((u) => u.status === "SUSPENDED").length,
      escalated: normalizedUsers.filter((u) => u.paymentFlag === "LEGAL_ACTION")
        .length,
      flags: {
        clear: normalizedUsers.filter((u) => u.paymentFlag === "NONE").length,
        warning: normalizedUsers.filter((u) => u.paymentFlag === "WARNING")
          .length,
        critical: normalizedUsers.filter((u) => u.paymentFlag === "CRITICAL")
          .length,
        legal: normalizedUsers.filter((u) => u.paymentFlag === "LEGAL_ACTION")
          .length,
      },
      withMeter: normalizedUsers.filter((u) => !!u.meter).length,
      withoutMeter: normalizedUsers.filter((u) => !u.meter).length,
    }),
    [normalizedUsers],
  );

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Total", totalCustomers, "registered"],
          ["Active", breakdown.active, "in good standing"],
          ["Suspended", breakdown.suspended, "account suspended"],
          ["Escalated", breakdown.escalated, "legal action"],
        ].map(([label, value, sub]) => (
          <div
            key={label}
            className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-xl p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-2">
              {label}
            </p>
            <p className="font-syne text-3xl font-bold tracking-tight">
              {value}
            </p>
            <p className="text-[10px] text-[#1D9E75] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-6 mb-4">
        <h3 className="font-syne font-bold text-sm tracking-tight mb-5">
          Payment Flag Distribution
        </h3>
        <div className="space-y-4">
          {[
            ["Clear", breakdown.flags.clear, "#1D9E75"],
            ["Warning", breakdown.flags.warning, "#EF9F27"],
            ["Critical", breakdown.flags.critical, "#E24B4A"],
            ["Legal Action", breakdown.flags.legal, "#D4537E"],
          ].map(([label, value, color]) => {
            const pct = ((value / (totalCustomers || 1)) * 100).toFixed(1);
            return (
              <div key={label} className="flex items-center gap-4">
                <span className="text-xs text-[rgba(232,244,240,0.5)] w-24">
                  {label}
                </span>
                <div className="flex-1 h-2 bg-[rgba(29,158,117,0.08)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <span className="text-xs text-[rgba(232,244,240,0.5)] w-16 text-right">
                  {value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-6">
        <h3 className="font-syne font-bold text-sm tracking-tight mb-5">
          Meter Assignment Status
        </h3>
        <div className="space-y-4">
          {[
            ["With Meter", breakdown.withMeter, "#1D9E75"],
            ["No Meter", breakdown.withoutMeter, "#EF9F27"],
          ].map(([label, value, color]) => {
            const pct = ((value / (totalCustomers || 1)) * 100).toFixed(1);
            return (
              <div key={label} className="flex items-center gap-4">
                <span className="text-xs text-[rgba(232,244,240,0.5)] w-24">
                  {label}
                </span>
                <div className="flex-1 h-2 bg-[rgba(29,158,117,0.08)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <span className="text-xs text-[rgba(232,244,240,0.5)] w-16 text-right">
                  {value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
