"use client";

import Modal from "@/components/ui/Modal";

const labelize = (value = "") =>
  String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function ComplaintDetailsModal({ complaint, onClose }) {
  if (!complaint) return null;

  return (
    <Modal open={!!complaint} onClose={onClose} title="Complaint Details">
      <div className="space-y-4">
        <div className="bg-[rgba(29,158,117,0.05)] border border-[rgba(29,158,117,0.12)] rounded-xl p-4">
          <p className="text-xs text-[rgba(232,244,240,0.5)] mb-1">Title</p>
          <p className="text-sm font-medium leading-snug text-[#e8f4f0]">
            {complaint.title}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-3">
            <p className="text-[rgba(232,244,240,0.4)] mb-1">Type</p>
            <p className="text-[#e8f4f0] font-medium">
              {labelize(complaint.category || "OTHER")}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-3">
            <p className="text-[rgba(232,244,240,0.4)] mb-1">Status</p>
            <p className="text-[#e8f4f0] font-medium">
              {labelize(complaint.status)}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-3">
            <p className="text-[rgba(232,244,240,0.4)] mb-1">Submitted By</p>
            <p className="text-[#e8f4f0] font-medium">
              {complaint.submittedBy?.fullName || "Unknown"}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-3">
            <p className="text-[rgba(232,244,240,0.4)] mb-1">Phone</p>
            <p className="text-[#e8f4f0] font-medium">
              {complaint.submittedBy?.phoneE164 || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(29,158,117,0.12)] bg-[rgba(7,27,41,0.55)] p-4">
          <p className="text-xs text-[rgba(232,244,240,0.5)] mb-2">
            Description
          </p>
          <p className="text-sm text-[rgba(232,244,240,0.85)] leading-relaxed whitespace-pre-wrap">
            {complaint.description || "No description provided."}
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[rgba(29,158,117,0.16)] text-[#b7f0dc] text-xs font-semibold hover:bg-[rgba(29,158,117,0.24)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
