"use client";

import { useEffect, useState, useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/features/subcity-admins/components/Pagination";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 5;

export default function MetersPage() {
  const [meters, setMeters] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadMeters = async () => {
      const rows = await superAdminService.getMeters();
      setMeters(Array.isArray(rows) ? rows : []);
    };

    loadMeters();
  }, []);

  const filtered = useMemo(
    () =>
      meters.filter(
        (m) =>
          !search ||
          m.meterNumber.toLowerCase().includes(search.toLowerCase()) ||
          (m.customer?.fullName || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [meters, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["Total Meters", meters.length, "under your woreda"],
          [
            "Flagged Customers",
            meters.filter((m) => (m.customer?.paymentFlag || "NONE") !== "NONE")
              .length,
            "payment issues",
          ],
          [
            "Active",
            meters.filter((m) => m.status === "ACTIVE").length,
            "all assigned",
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
              Meters
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {filtered.length} meters found
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
            <EmptyState message="No meters found." />
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Meter Number",
                    "Customer",
                    "Phone",
                    "Payment Flag",
                    "Assigned Since",
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
                {paginated.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.1)] text-[#1D9E75] font-mono font-medium">
                        {m.meterNumber}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[rgba(29,158,117,0.12)] flex items-center justify-center text-[9px] font-syne font-bold text-[#1D9E75]">
                          {(m.customer?.fullName || "UN")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-[rgba(232,244,240,0.8)]">
                          {m.customer?.fullName || "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.5)]">
                      {m.customer?.phoneE164 || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${(m.customer?.paymentFlag || "NONE") === "NONE" ? "bg-[rgba(29,158,117,0.1)] text-[#1D9E75]" : (m.customer?.paymentFlag || "NONE") === "WARNING" ? "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]" : "bg-[rgba(226,75,74,0.12)] text-[#E24B4A]"}`}
                      >
                        {m.customer?.paymentFlag || "NONE"}
                      </span>
                    </td>
                    <td className="py-3 text-[rgba(232,244,240,0.4)]">
                      {new Date(m.createdAt).toLocaleDateString()}
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
