"use client";

import { useMemo } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { useComplaints } from "@/features/complaint/hooks/useComplaints";

export default function ComplaintOverviewPage() {
  const jwtPayload = getJwtPayload() || {};
  const role = String(jwtPayload?.role || "").toUpperCase();
  const isSubcityComplaintOfficer = role === "SUBCITY_COMPLAINT_OFFICER";

  const scopeArgs = isSubcityComplaintOfficer
    ? { scopeSubCityId: jwtPayload?.subCityId || "" }
    : { scopeWoredaId: jwtPayload?.woredaId || "" };

  const { allComplaints } = useComplaints(scopeArgs);
  const { complaints: myComplaints } = useComplaints({
    assignedOnly: true,
    ...scopeArgs,
  });

  const totalComplaints = allComplaints.length;
  const open = useMemo(
    () => allComplaints.filter((c) => c.status === "OPEN").length,
    [allComplaints],
  );
  const inProgress = useMemo(
    () => myComplaints.filter((c) => c.status === "IN_PROGRESS").length,
    [myComplaints],
  );
  const resolved = useMemo(
    () => myComplaints.filter((c) => c.status === "RESOLVED").length,
    [myComplaints],
  );

  const statusRows = [
    ["Open", open, totalComplaints, "#E24B4A"],
    [
      "In Progress",
      allComplaints.filter((c) => c.status === "IN_PROGRESS").length,
      totalComplaints,
      "#EF9F27",
    ],
    [
      "Resolved",
      allComplaints.filter((c) => c.status === "RESOLVED").length,
      totalComplaints,
      "#1D9E75",
    ],
    [
      "Closed",
      allComplaints.filter((c) => c.status === "CLOSED").length,
      totalComplaints,
      "#378ADD",
    ],
  ];

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          [
            "Total Complaints",
            totalComplaints,
            isSubcityComplaintOfficer ? "in your subcity" : "in your woreda",
          ],
          ["Assigned to Me", myComplaints.length, "my responsibility"],
          ["In Progress", inProgress, "currently handling"],
          ["Resolved", resolved, "completed by me"],
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-sm tracking-tight">
              My Assigned Complaints
            </h3>
            <a
              href="/complaint/complaints/assigned"
              className="text-[10px] text-[#1D9E75] hover:text-[#5DCAA5] transition-colors"
            >
              View all
            </a>
          </div>
          <div className="space-y-3">
            {myComplaints.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between py-2.5 border-b border-[rgba(29,158,117,0.04)] gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[rgba(232,244,240,0.85)] truncate">
                    {c.title}
                  </p>
                  <p className="text-[9px] text-[rgba(232,244,240,0.4)] mt-0.5">
                    {c.submittedBy?.fullName}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                    c.status === "IN_PROGRESS"
                      ? "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]"
                      : c.status === "RESOLVED"
                        ? "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]"
                        : "bg-[rgba(226,75,74,0.12)] text-[#E24B4A]"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
            {!myComplaints.length && (
              <p className="text-[10px] text-[rgba(232,244,240,0.35)] py-2">
                No assigned complaints yet.
              </p>
            )}
          </div>
        </div>

        <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-sm tracking-tight">
              Status Breakdown
            </h3>
          </div>
          <div className="space-y-4">
            {statusRows.map(([label, value, total, color]) => {
              const denominator = total || 1;
              const pct = ((value / denominator) * 100).toFixed(1);
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[10px] text-[rgba(232,244,240,0.5)] w-20">
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 bg-[rgba(29,158,117,0.08)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-[10px] text-[rgba(232,244,240,0.4)] w-12 text-right">
                    {value} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
