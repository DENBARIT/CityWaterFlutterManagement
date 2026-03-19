"use client";

import { useBilling } from "@/features/billing/hooks/useBilling";
import EmptyState from "@/components/ui/EmptyState";

export default function BillingReportsPage() {
  const { reports, totals, search, setSearch, exportCSV, loading } =
    useBilling();

  return (
    <div className="text-[#e8f4f0]">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          ["Total Bills", totals.totalBills, "all woredas"],
          ["Paid", totals.totalPaid, "collected"],
          ["Unpaid", totals.totalUnpaid, "outstanding"],
          [
            "Total Amount",
            `${totals.totalAmount.toLocaleString()} ETB`,
            "billed",
          ],
          [
            "Consumption",
            `${totals.totalConsumption.toLocaleString()} m³`,
            "total usage",
          ],
        ].map(([label, value, sub]) => (
          <div
            key={label}
            className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-xl p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-2">
              {label}
            </p>
            <p className="font-syne text-2xl font-bold tracking-tight">
              {value}
            </p>
            <p className="text-[10px] text-[#1D9E75] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Billing Reports by Woreda
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {reports.length} woredas
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-xs border border-[rgba(29,158,117,0.15)] text-[rgba(232,244,240,0.5)] hover:text-[#1D9E75] hover:border-[rgba(29,158,117,0.35)] transition-all"
          >
            Export CSV
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[rgba(29,158,117,0.06)]">
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-xs">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by woreda..."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl pl-8 pr-4 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-6 py-4 overflow-x-auto">
          {loading ? (
            <EmptyState message="Loading billing reports..." />
          ) : !reports.length ? (
            <EmptyState message="No billing reports found." />
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Woreda",
                    "Total Bills",
                    "Paid",
                    "Unpaid",
                    "Collection Rate",
                    "Total Amount",
                    "Consumption",
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
                {reports.map((r) => {
                  const rate = (
                    r.totalBills > 0 ? (r.paidBills / r.totalBills) * 100 : 0
                  ).toFixed(1);
                  const rateColor =
                    parseFloat(rate) >= 80
                      ? "text-[#1D9E75]"
                      : parseFloat(rate) >= 60
                        ? "text-[#EF9F27]"
                        : "text-[#E24B4A]";

                  return (
                    <tr
                      key={r.woredaId}
                      className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium text-[rgba(232,244,240,0.85)]">
                        {r.woreda}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.6)]">
                        {r.totalBills}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[rgba(29,158,117,0.1)] text-[#1D9E75]">
                          {r.paidBills}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[rgba(226,75,74,0.1)] text-[#E24B4A]">
                          {r.unpaidBills}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[rgba(29,158,117,0.08)] rounded-full h-1.5 max-w-20">
                            <div
                              className="h-1.5 rounded-full bg-[#1D9E75] transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-medium ${rateColor}`}
                          >
                            {rate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.6)]">
                        {r.totalAmount.toLocaleString()} ETB
                      </td>
                      <td className="py-3 text-[rgba(232,244,240,0.6)]">
                        {r.totalConsumption.toLocaleString()} m³
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals Row */}
              <tfoot>
                <tr className="border-t border-[rgba(29,158,117,0.12)]">
                  <td className="py-3 pr-4 font-syne font-bold text-[#1D9E75] text-[10px] uppercase tracking-wider">
                    Total
                  </td>
                  <td className="py-3 pr-4 font-bold text-[rgba(232,244,240,0.85)]">
                    {totals.totalBills}
                  </td>
                  <td className="py-3 pr-4 font-bold text-[#1D9E75]">
                    {totals.totalPaid}
                  </td>
                  <td className="py-3 pr-4 font-bold text-[#E24B4A]">
                    {totals.totalUnpaid}
                  </td>
                  <td className="py-3 pr-4 font-bold text-[#1D9E75]">
                    {(totals.totalBills > 0
                      ? (totals.totalPaid / totals.totalBills) * 100
                      : 0
                    ).toFixed(1)}
                    %
                  </td>
                  <td className="py-3 pr-4 font-bold text-[rgba(232,244,240,0.85)]">
                    {totals.totalAmount.toLocaleString()} ETB
                  </td>
                  <td className="py-3 font-bold text-[rgba(232,244,240,0.85)]">
                    {totals.totalConsumption.toLocaleString()} m³
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
