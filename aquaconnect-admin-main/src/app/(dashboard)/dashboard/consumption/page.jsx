"use client";

import { useEffect, useMemo, useState } from "react";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function DashboardConsumptionPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadBills = async () => {
      setLoading(true);
      try {
        const rows = await superAdminService.getBills();
        if (!active) return;
        setBills(Array.isArray(rows) ? rows : []);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadBills();
    return () => {
      active = false;
    };
  }, []);

  const totalConsumption = useMemo(
    () => bills.reduce((sum, bill) => sum + Number(bill?.consumption || 0), 0),
    [bills],
  );

  const groupedByWoreda = useMemo(() => {
    const grouped = new Map();

    for (const bill of bills) {
      const woredaId =
        bill?.woredaId || bill?.customer?.woreda?.id || "unknown";
      const woredaName =
        bill?.customer?.woreda?.name || bill?.woreda?.name || "Unknown Woreda";
      const current = grouped.get(woredaId) || {
        woredaName,
        totalConsumption: 0,
        billCount: 0,
      };

      current.totalConsumption += Number(bill?.consumption || 0);
      current.billCount += 1;
      grouped.set(woredaId, current);
    }

    return Array.from(grouped.entries()).map(([woredaId, value]) => ({
      woredaId,
      ...value,
    }));
  }, [bills]);

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          ["Total Consumption", totalConsumption, "m³ across all bills"],
          ["Bills", bills.length, "bills included"],
          [
            "Average Consumption",
            bills.length ? totalConsumption / bills.length : 0,
            "m³ per bill",
          ],
        ].map(([label, value, sub]) => (
          <div
            key={label}
            className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-xl p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-2">
              {label}
            </p>
            <p className="font-syne text-3xl font-bold tracking-tight">
              {Number(value).toLocaleString()}
            </p>
            <p className="text-[10px] text-[#1D9E75] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Consumption
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              Track consumption totals by woreda
            </p>
          </div>
        </div>

        <div className="px-6 py-4 overflow-x-auto">
          {loading ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              Loading consumption data...
            </p>
          ) : !groupedByWoreda.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              No consumption data found.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {["Woreda", "Bills", "Consumption"].map((header) => (
                    <th
                      key={header}
                      className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedByWoreda.map((row) => (
                  <tr
                    key={row.woredaId}
                    className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                  >
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                      {row.woredaName}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {row.billCount}
                    </td>
                    <td className="py-3 text-[rgba(232,244,240,0.55)]">
                      {row.totalConsumption.toLocaleString()} m³
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
