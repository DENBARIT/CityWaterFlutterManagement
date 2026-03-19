"use client";

import { useEffect, useState, useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/features/subcity-admins/components/Pagination";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 5;
const STATUS_STYLES = {
  PAID: "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]",
  UNPAID: "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]",
  OVERDUE: "bg-[rgba(226,75,74,0.12)] text-[#E24B4A]",
  ESCALATED: "bg-[rgba(212,83,126,0.15)] text-[#D4537E]",
};

export default function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadReadings = async () => {
      const rows = await superAdminService.getReadings();
      setReadings(Array.isArray(rows) ? rows : []);
    };

    loadReadings();
  }, []);

  const filtered = useMemo(
    () =>
      readings.filter(
        (r) =>
          !search ||
          (r.meter?.meterNumber || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (r.createdBy?.fullName || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [readings, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["Total Readings", readings.length, "submitted via OCR"],
          [
            "Bills Generated",
            readings.filter((r) => r.bill).length,
            "auto-generated",
          ],
          [
            "This Month",
            readings.filter(
              (r) =>
                new Date(r.readingDate).getMonth() === new Date().getMonth() &&
                new Date(r.readingDate).getFullYear() ===
                  new Date().getFullYear(),
            ).length,
            "current month",
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

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              OCR Meter Readings
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {filtered.length} readings found
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-[rgba(29,158,117,0.06)]">
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-xs">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search meter or customer..."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl pl-8 pr-4 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </div>
        </div>

        <div className="px-6 py-4">
          {!paginated.length ? (
            <EmptyState message="No readings found." />
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Meter",
                    "Customer",
                    "Reading",
                    "Tariff",
                    "Bill Amount",
                    "Bill Status",
                    "Date",
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
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] font-mono">
                        {r.meter?.meterNumber || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.7)]">
                      {r.createdBy?.fullName || "Unknown"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[rgba(232,244,240,0.8)] font-medium">
                      {r.readingValue}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.5)]">
                      {r.tariff?.pricePerCubicMeter || 0} ETB/m³
                    </td>
                    <td className="py-3 pr-4 font-medium text-[rgba(232,244,240,0.8)]">
                      {r.bill?.amount ?? "—"} {r.bill ? "ETB" : ""}
                    </td>
                    <td className="py-3 pr-4">
                      {r.bill && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_STYLES[r.bill.status]}`}
                        >
                          {r.bill.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[rgba(232,244,240,0.4)]">
                      {new Date(r.readingDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
