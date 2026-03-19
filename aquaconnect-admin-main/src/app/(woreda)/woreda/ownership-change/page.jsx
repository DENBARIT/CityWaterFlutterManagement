"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { ownershipChangeService } from "@/features/woreda/services/ownershipChange.service";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.04)] p-3">
      <p className="mb-1 text-[9px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
        {label}
      </p>
      <p className="text-sm text-[#e8f4f0]">{value || "-"}</p>
    </div>
  );
}

export default function WoredaOwnershipChangePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const woredaId = getJwtPayload()?.woredaId || "";

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await ownershipChangeService.getOwnershipHistory();
      const items = Array.isArray(result?.data?.items)
        ? result.data.items
        : Array.isArray(result?.items)
          ? result.items
          : [];
      setRows(items);
    } catch (err) {
      setError(err?.message || "Failed to load ownership changes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [woredaId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const current = rows.filter((row) => row.isCurrent).length;
    const closed = total - current;
    return { total, current, closed };
  }, [rows]);

  return (
    <div className="space-y-6 text-[#e8f4f0]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ["Total Ownership Changes", stats.total],
          ["Current Owners", stats.current],
          ["Closed History", stats.closed],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5"
          >
            <p className="mb-2 text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              {label}
            </p>
            <p className="font-syne text-3xl font-bold tracking-tight text-[#5DCAA5]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-syne text-lg font-bold tracking-tight">
              Ownership Change
            </h2>
            <p className="text-xs text-[rgba(232,244,240,0.4)]">
              Transfers submitted from the mobile app appear here for your
              woreda.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border border-[rgba(29,158,117,0.12)] bg-[rgba(29,158,117,0.08)] px-4 py-2 text-xs font-semibold text-[#5DCAA5] transition-colors hover:bg-[rgba(29,158,117,0.14)] disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-[rgba(226,75,74,0.2)] bg-[rgba(226,75,74,0.08)] p-4 text-sm text-[#ffb4b4]">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.04)] p-6 text-sm text-[rgba(232,244,240,0.6)]">
            Loading ownership changes...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.04)] p-6 text-sm text-[rgba(232,244,240,0.6)]">
            No ownership changes found for this woreda yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`rounded-2xl border p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] ${row.isCurrent ? "border-[rgba(29,158,117,0.24)] bg-[rgba(29,158,117,0.08)]" : "border-[rgba(55,138,221,0.12)] bg-[rgba(55,138,221,0.06)]"}`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-syne text-lg font-bold tracking-tight text-[#e8f4f0]">
                      Meter {row.meterNumber || "-"}
                    </h3>
                    <p className="text-xs text-[rgba(232,244,240,0.45)]">
                      {row.isCurrent
                        ? "Current ownership record"
                        : "Previous ownership record"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${row.isCurrent ? "bg-[rgba(29,158,117,0.14)] text-[#5DCAA5]" : "bg-[rgba(55,138,221,0.14)] text-[#7DB8FF]"}`}
                  >
                    {row.isCurrent ? "Current" : "Transferred"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="Owner Name" value={row.ownerFullName} />
                  <Field label="Owner Email" value={row.ownerEmail} />
                  <Field label="Owner Phone" value={row.ownerPhone} />
                  <Field label="National ID" value={row.ownerNationalId} />
                  <Field label="Start Date" value={formatDate(row.startDate)} />
                  <Field label="End Date" value={formatDate(row.endDate)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
