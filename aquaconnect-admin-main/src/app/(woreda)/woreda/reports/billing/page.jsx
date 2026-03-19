"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function BillingReportPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  const woredaId = getJwtPayload()?.woredaId || "";

  useEffect(() => {
    const loadBills = async () => {
      setLoading(true);
      try {
        const rows = await superAdminService.getBills({ woredaId });
        setBills(Array.isArray(rows) ? rows : []);
      } finally {
        setLoading(false);
      }
    };

    void loadBills();
  }, [woredaId]);

  const metrics = useMemo(() => {
    const base = {
      totalBills: bills.length,
      breakdown: {
        paid: 0,
        unpaid: 0,
        overdue: 0,
      },
      totalAmount: 0,
      collectedAmount: 0,
      pendingAmount: 0,
    };

    for (const bill of bills) {
      const amount = Number(bill.amount || 0);
      if (Number.isFinite(amount)) {
        base.totalAmount += amount;
      }

      if (bill.status === "PAID") {
        base.breakdown.paid += 1;
        if (Number.isFinite(amount)) {
          base.collectedAmount += amount;
        }
      } else if (bill.status === "OVERDUE") {
        base.breakdown.overdue += 1;
        if (Number.isFinite(amount)) {
          base.pendingAmount += amount;
        }
      } else {
        base.breakdown.unpaid += 1;
        if (Number.isFinite(amount)) {
          base.pendingAmount += amount;
        }
      }
    }

    return base;
  }, [bills]);

  const { totalBills, breakdown, totalAmount, collectedAmount, pendingAmount } =
    metrics;
  const collectionRate =
    totalBills > 0 ? ((breakdown.paid / totalBills) * 100).toFixed(1) : "0.0";

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Total Bills", totalBills, "this period"],
          ["Paid", breakdown.paid, `${collectionRate}% rate`],
          ["Unpaid", breakdown.unpaid, "awaiting payment"],
          ["Overdue", breakdown.overdue, "need attention"],
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {[
          [
            "Total Amount",
            totalAmount,
            "ETB",
            "billed this period",
            "text-[#e8f4f0]",
          ],
          [
            "Collected",
            collectedAmount,
            "ETB",
            "payments received",
            "text-[#1D9E75]",
          ],
          [
            "Pending",
            pendingAmount,
            "ETB",
            "yet to be collected",
            "text-[#EF9F27]",
          ],
        ].map(([label, value, unit, sub, color]) => (
          <div
            key={label}
            className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-xl p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-2">
              {label}
            </p>
            <p
              className={`font-syne text-3xl font-bold tracking-tight ${color}`}
            >
              {value.toLocaleString()}{" "}
              <span className="text-base font-normal">{unit}</span>
            </p>
            <p className="text-[10px] text-[rgba(232,244,240,0.4)] mt-1">
              {sub}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-6">
        <h3 className="font-syne font-bold text-sm tracking-tight mb-5">
          Bill Status Breakdown
        </h3>
        {loading ? (
          <p className="text-xs text-[rgba(232,244,240,0.5)]">
            Loading billing report...
          </p>
        ) : (
          <div className="space-y-4">
            {[
              ["Paid", breakdown.paid, totalBills, "#1D9E75"],
              ["Unpaid", breakdown.unpaid, totalBills, "#EF9F27"],
              ["Overdue", breakdown.overdue, totalBills, "#E24B4A"],
            ].map(([label, value, total, color]) => {
              const pct =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-xs text-[rgba(232,244,240,0.5)] w-20">
                    {label}
                  </span>
                  <div className="flex-1 h-2 bg-[rgba(29,158,117,0.08)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
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
        )}
      </div>
    </div>
  );
}
