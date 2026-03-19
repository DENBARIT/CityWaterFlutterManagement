"use client";

import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";

const STATUS_STYLES = {
  OPEN: "bg-[rgba(226,75,74,0.12)] text-[#E24B4A]",
  IN_PROGRESS: "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]",
  RESOLVED: "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]",
  CLOSED: "bg-[rgba(136,135,128,0.12)] text-[#888780]",
};

const ROW_STYLES = {
  OPEN: "bg-[rgba(226,75,74,0.06)] shadow-[inset_0_0_0_1px_rgba(226,75,74,0.15)]",
  IN_PROGRESS:
    "bg-[rgba(239,159,39,0.03)] shadow-[inset_0_0_0_1px_rgba(239,159,39,0.1)]",
  RESOLVED:
    "bg-[rgba(29,158,117,0.03)] shadow-[inset_0_0_0_1px_rgba(29,158,117,0.1)]",
  CLOSED:
    "bg-[rgba(136,135,128,0.03)] shadow-[inset_0_0_0_1px_rgba(136,135,128,0.1)]",
};

const labelize = (value = "") =>
  String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function ComplaintsTable({
  complaints,
  onUpdate,
  onView,
  showUpdateBtn = true,
  showViewBtn = true,
  showWoredaColumn = false,
  showEscalationContext = false,
}) {
  const [expandedRows, setExpandedRows] = useState({});

  if (!complaints.length) return <EmptyState message="No complaints found." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[rgba(29,158,117,0.06)]">
            {[
              "Title",
              "Type",
              "Submitted By",
              ...(showWoredaColumn ? ["Woreda"] : []),
              ...(showEscalationContext ? ["Escalated By"] : []),
              "Assigned To",
              "Status",
              "Created",
              "Updated",
              ...(showUpdateBtn || showViewBtn ? ["Actions"] : []),
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
          {complaints.map((c) => {
            const fullDescription = String(c.description || "");
            const expanded = expandedRows[c.id] === true;
            const isLongDescription = fullDescription.length > 140;
            const compactDescription = isLongDescription
              ? `${fullDescription.slice(0, 140).trimEnd()}...`
              : fullDescription;

            return (
              <tr
                key={c.id}
                className={`border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors ${ROW_STYLES[c.status] || ""}`}
              >
                <td className="py-3 pr-4 max-w-50">
                  <p className="font-medium text-[rgba(232,244,240,0.85)] truncate">
                    {c.title}
                  </p>
                  <p className="text-[9px] text-[rgba(232,244,240,0.35)] mt-0.5 whitespace-pre-wrap wrap-break-word">
                    {expanded ? fullDescription : compactDescription}
                  </p>
                  {isLongDescription && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRows((prev) => ({
                          ...prev,
                          [c.id]: !expanded,
                        }))
                      }
                      className="mt-1 text-[10px] font-semibold text-[#7ce4be] hover:text-[#9ef1cf]"
                    >
                      {expanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.7)]">
                  {labelize(c.category || "OTHER")}
                </td>
                <td className="py-3 pr-4">
                  <p className="text-[rgba(232,244,240,0.7)]">
                    {c.submittedBy.fullName}
                  </p>
                  <p className="text-[9px] text-[rgba(232,244,240,0.35)]">
                    {c.submittedBy.phoneE164}
                  </p>
                </td>
                {showWoredaColumn && (
                  <td className="py-3 pr-4 text-[rgba(232,244,240,0.7)]">
                    {c.woreda?.name || "-"}
                  </td>
                )}
                {showEscalationContext && (
                  <td className="py-3 pr-4">
                    <p className="text-[rgba(232,244,240,0.7)]">
                      {c.escalatedBy?.fullName || "-"}
                    </p>
                    <p className="text-[9px] text-[rgba(232,244,240,0.35)] truncate max-w-36">
                      {c.escalationReason || "Escalated from woreda"}
                    </p>
                  </td>
                )}
                <td className="py-3 pr-4">
                  {c.assignedTo ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75]">
                      {c.assignedTo.fullName}
                    </span>
                  ) : (
                    <span className="text-[rgba(232,244,240,0.25)] text-[10px]">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] ${STATUS_STYLES[c.status]}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.4)]">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.4)]">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </td>
                {(showUpdateBtn || showViewBtn) && (
                  <td className="py-3">
                    {showViewBtn && (
                      <button
                        onClick={() => onView?.(c)}
                        className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(55,138,221,0.14)] text-[#7fc3ff] hover:bg-[rgba(55,138,221,0.24)] transition-colors mr-2"
                      >
                        Open
                      </button>
                    )}
                    {showUpdateBtn &&
                      c.status !== "RESOLVED" &&
                      c.status !== "CLOSED" && (
                        <button
                          onClick={() => onUpdate(c)}
                          type="button"
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.18)] transition-colors"
                        >
                          Update
                        </button>
                      )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
