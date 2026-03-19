"use client";

import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { getOfficerTypeLabel } from "@/features/woreda/constants/officerTypes";

const TYPE_STYLES = {
  BILLING_OFFICER: "bg-[rgba(55,138,221,0.12)] text-[#378ADD]",
  COMPLAINT_OFFICER: "bg-[rgba(212,83,126,0.12)] text-[#D4537E]",
  INSTALLER_METER_ASSIGNMENT: "bg-[rgba(16,185,129,0.14)] text-[#10B981]",
  TECHNICIAN: "bg-[rgba(14,165,233,0.14)] text-[#0EA5E9]",
  PIPELINE_REPAIR: "bg-[rgba(249,115,22,0.14)] text-[#F97316]",
  DRIVER: "bg-[rgba(245,158,11,0.14)] text-[#F59E0B]",
  EXCAVATION_CREW: "bg-[rgba(168,85,247,0.14)] text-[#A855F7]",
  LEAK_DETECTION_TEAM: "bg-[rgba(236,72,153,0.14)] text-[#EC4899]",
};

export default function OfficerTable({
  officers,
  onEdit,
  onDelete,
  onSuspend,
}) {
  if (!officers.length)
    return <EmptyState message="No field officers found." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[rgba(29,158,117,0.06)]">
            {[
              "Name",
              "Email",
              "Phone",
              "Type",
              "Status",
              "Created",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {officers.map((o) => (
            <tr
              key={o.id}
              className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[rgba(29,158,117,0.15)] flex items-center justify-center text-[10px] font-syne font-bold text-[#1D9E75] shrink-0">
                    {o.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <span className="font-medium text-[rgba(232,244,240,0.85)]">
                    {o.fullName}
                  </span>
                </div>
              </td>
              <td className="py-3 pr-4 text-[rgba(232,244,240,0.5)]">
                {o.email}
              </td>
              <td className="py-3 pr-4 text-[rgba(232,244,240,0.5)]">
                {o.phoneE164}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${TYPE_STYLES[o.fieldOfficerType] || "bg-[rgba(148,163,184,0.14)] text-[#94A3B8]"}`}
                >
                  {getOfficerTypeLabel(o.fieldOfficerType)}
                </span>
              </td>
              <td className="py-3 pr-4">
                <Badge status={o.status} />
              </td>
              <td className="py-3 pr-4 text-[rgba(232,244,240,0.4)]">
                {new Date(o.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(o)}
                    className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.18)] transition-colors"
                  >
                    Edit
                  </button>
                  {onSuspend ? (
                    <button
                      onClick={() => onSuspend(o)}
                      className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(224,171,69,0.12)] text-[#f0c66f] hover:bg-[rgba(224,171,69,0.24)] transition-colors"
                    >
                      {o.status === "SUSPENDED" ? "Activate" : "Suspend"}
                    </button>
                  ) : null}
                  <button
                    onClick={() => onDelete(o)}
                    className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(226,75,74,0.08)] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.18)] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
