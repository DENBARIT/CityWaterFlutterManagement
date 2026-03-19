"use client";

import { useBills } from "../hooks/useBills";
import BillsTable from "./BillsTable";
import PayModal from "./PayModal";
import WaiveModal from "./WaiveModal";
import Pagination from "@/features/subcity-admins/components/Pagination";

export default function BillsPage({ statusFilter = "", title, sub }) {
  const {
    bills,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    loading,
    payTarget,
    setPayTarget,
    waiveTarget,
    setWaiveTarget,
    markAsPaid,
    waivePenalty,
    exportCSV,
    totalCount,
    allBills,
  } = useBills({ statusFilter });

  const stats =
    statusFilter === ""
      ? [
          ["Total", allBills.length, "all bills"],
          [
            "Paid",
            allBills.filter((b) => b.status === "PAID").length,
            "collected",
          ],
          [
            "Unpaid",
            allBills.filter((b) => b.status === "UNPAID").length,
            "awaiting",
          ],
          [
            "Overdue",
            allBills.filter((b) => b.status === "OVERDUE").length,
            "past due",
          ],
        ]
      : statusFilter === "UNPAID"
        ? [
            [
              "Unpaid Bills",
              allBills.filter((b) => b.status === "UNPAID").length,
              "awaiting payment",
            ],
            [
              "Total Due",
              allBills
                .filter((b) => b.status === "UNPAID")
                .reduce((s, b) => s + b.amount, 0)
                .toFixed(2) + " ETB",
              "to collect",
            ],
            [
              "Customers",
              new Set(
                allBills
                  .filter((b) => b.status === "UNPAID")
                  .map((b) => b.customer.id),
              ).size,
              "affected",
            ],
          ]
        : statusFilter === "OVERDUE"
          ? [
              [
                "Overdue Bills",
                allBills.filter((b) => b.status === "OVERDUE").length,
                "past due date",
              ],
              [
                "With Penalty",
                allBills.filter(
                  (b) => b.status === "OVERDUE" && b.penaltyApplied,
                ).length,
                "penalty applied",
              ],
              [
                "Total Due",
                allBills
                  .filter((b) => b.status === "OVERDUE")
                  .reduce((s, b) => s + b.amount, 0)
                  .toFixed(2) + " ETB",
                "including penalties",
              ],
            ]
          : [
              [
                "Escalated Bills",
                allBills.filter(
                  (b) =>
                    b.customer?.paymentFlag === "LEGAL_ACTION" &&
                    b.status !== "PAID",
                ).length,
                "legal action",
              ],
              [
                "Total Penalties",
                allBills
                  .filter(
                    (b) =>
                      b.customer?.paymentFlag === "LEGAL_ACTION" &&
                      b.status !== "PAID",
                  )
                  .reduce((s, b) => s + b.penaltyAmount, 0)
                  .toFixed(2) + " ETB",
                "accumulated",
              ],
              [
                "Customers",
                new Set(
                  allBills
                    .filter(
                      (b) =>
                        b.customer?.paymentFlag === "LEGAL_ACTION" &&
                        b.status !== "PAID",
                    )
                    .map((b) => b.customer?.id)
                    .filter(Boolean),
                ).size,
                "escalated",
              ],
            ];

  return (
    <div className="text-[#e8f4f0]">
      <div className={`grid grid-cols-${stats.length} gap-4 mb-6`}>
        {stats.map(([label, value, s]) => (
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
            <p className="text-[10px] text-[#1D9E75] mt-1">{s}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              {title}
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {totalCount} bills found
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-xs border border-[rgba(29,158,117,0.15)] text-[rgba(232,244,240,0.5)] hover:text-[#1D9E75] hover:border-[rgba(29,158,117,0.35)] transition-all"
          >
            Export CSV
          </button>
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
              placeholder="Search customer or month..."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl pl-8 pr-4 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </div>
        </div>

        <div className="px-6 py-4">
          <BillsTable
            bills={bills}
            onPay={setPayTarget}
            onWaive={setWaiveTarget}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <PayModal
        bill={payTarget}
        onClose={() => setPayTarget(null)}
        onConfirm={markAsPaid}
        loading={loading}
      />
      <WaiveModal
        bill={waiveTarget}
        onClose={() => setWaiveTarget(null)}
        onConfirm={waivePenalty}
        loading={loading}
      />
    </div>
  );
}
