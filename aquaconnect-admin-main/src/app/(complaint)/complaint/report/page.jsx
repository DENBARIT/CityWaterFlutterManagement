"use client";

import { useMemo } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { useComplaints } from "@/features/complaint/hooks/useComplaints";

export default function ComplaintReportPage() {
  const payload = getJwtPayload() || {};
  const role = String(payload?.role || "").toUpperCase();

  const isSubcityComplaintOfficer = role === "SUBCITY_COMPLAINT_OFFICER";

  const scopeArgs = isSubcityComplaintOfficer
    ? { scopeSubCityId: payload?.subCityId || "" }
    : { scopeWoredaId: payload?.woredaId || "" };

  const { allComplaints } = useComplaints(scopeArgs);

  const totals = useMemo(() => {
    const totalComplaints = allComplaints.length;
    const open = allComplaints.filter((c) => c.status === "OPEN").length;
    const inProgress = allComplaints.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const resolved = allComplaints.filter(
      (c) => c.status === "RESOLVED",
    ).length;
    const closed = allComplaints.filter((c) => c.status === "CLOSED").length;
    const resolvedCombined = resolved + closed;
    const resolutionRate =
      totalComplaints > 0
        ? `${((resolvedCombined / totalComplaints) * 100).toFixed(1)}%`
        : "0.0%";

    return {
      totalComplaints,
      open,
      inProgress,
      resolved,
      closed,
      resolvedCombined,
      resolutionRate,
    };
  }, [allComplaints]);

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Total", totals.totalComplaints, "all time"],
          ["Open", totals.open, "need assignment"],
          ["In Progress", totals.inProgress, "being handled"],
          [
            "Resolved",
            totals.resolvedCombined,
            `${totals.resolutionRate} rate`,
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
              {value}
            </p>
            <p className="text-[10px] text-[#1D9E75] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-6">
        <h3 className="font-syne font-bold text-sm tracking-tight mb-5">
          Complaint Status Breakdown
        </h3>
        <div className="space-y-4">
          {[
            ["Open", totals.open, totals.totalComplaints, "#E24B4A"],
            [
              "In Progress",
              totals.inProgress,
              totals.totalComplaints,
              "#EF9F27",
            ],
            ["Resolved", totals.resolved, totals.totalComplaints, "#1D9E75"],
            ["Closed", totals.closed, totals.totalComplaints, "#378ADD"],
          ].map(([label, value, total, color]) => {
            const denominator = total || 1;
            const pct = ((value / denominator) * 100).toFixed(1);
            return (
              <div key={label} className="flex items-center gap-4">
                <span className="text-xs text-[rgba(232,244,240,0.5)] w-24">
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
      </div>
    </div>
  );
}
