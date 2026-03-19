"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function WoredaOverviewPage() {
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [bills, setBills] = useState([]);

  const woredaId = getJwtPayload()?.woredaId || "";

  useEffect(() => {
    const loadOverviewData = async () => {
      const [complaintRows, customerRows, officerRows, billRows] =
        await Promise.all([
          superAdminService.getComplaints({ woredaId }),
          superAdminService.getUsersByLocation({ woredaId }),
          superAdminService.getFieldOfficers({ woredaId }),
          superAdminService.getBills({ woredaId }),
        ]);

      setComplaints(Array.isArray(complaintRows) ? complaintRows : []);
      setCustomers(Array.isArray(customerRows) ? customerRows : []);
      setOfficers(Array.isArray(officerRows) ? officerRows : []);
      setBills(Array.isArray(billRows) ? billRows : []);
    };

    loadOverviewData();
  }, [woredaId]);

  const complaintStats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => c.status === "OPEN").length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
    const closed = complaints.filter((c) => c.status === "CLOSED").length;
    const resolutionRate =
      total > 0
        ? `${(((resolved + closed) / total) * 100).toFixed(1)}%`
        : "0.0%";

    return {
      total,
      open,
      resolved,
      resolutionRate,
    };
  }, [complaints]);

  const billingStats = useMemo(() => {
    const totals = bills.reduce(
      (acc, bill) => {
        const amount = Number(bill.amount || 0);
        if (!Number.isFinite(amount)) {
          return acc;
        }

        if (bill.status === "PAID") {
          acc.collected += amount;
          acc.paid += 1;
        } else {
          acc.pending += amount;
        }

        return acc;
      },
      { collected: 0, pending: 0, paid: 0 },
    );

    return {
      totalBills: bills.length,
      collectedAmount: totals.collected,
      pendingAmount: totals.pending,
      paidCount: totals.paid,
    };
  }, [bills]);

  const stats = [
    ["Field Officers", officers.length, "billing + complaint"],
    ["Customers", customers.length, "under your woreda"],
    ["Bills Issued", billingStats.totalBills, `${billingStats.paidCount} paid`],
    [
      "Complaints",
      complaintStats.total,
      complaintStats.resolutionRate + " resolved",
    ],
  ];

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(([label, value, sub]) => (
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
              Field Officers
            </h3>
            <a
              href="/woreda/officers"
              className="text-[10px] text-[#1D9E75] hover:text-[#5DCAA5] transition-colors"
            >
              View all
            </a>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(29,158,117,0.06)]">
                {["Name", "Type", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-2 pr-4 text-[10px] uppercase tracking-wider"
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
                  className="border-b border-[rgba(29,158,117,0.04)]"
                >
                  <td className="py-2 pr-4 text-[rgba(232,244,240,0.8)]">
                    {o.fullName}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${o.fieldOfficerType === "BILLING_OFFICER" ? "bg-[rgba(55,138,221,0.12)] text-[#378ADD]" : "bg-[rgba(212,83,126,0.12)] text-[#D4537E]"}`}
                    >
                      {o.fieldOfficerType === "BILLING_OFFICER"
                        ? "Billing"
                        : "Complaint"}
                    </span>
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${o.status === "ACTIVE" ? "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]" : "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-sm tracking-tight">
                Billing Summary
              </h3>
              <a
                href="/woreda/reports/billing"
                className="text-[10px] text-[#1D9E75] hover:text-[#5DCAA5] transition-colors"
              >
                Full report
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                [
                  "Collected",
                  `${billingStats.collectedAmount.toLocaleString()} ETB`,
                  "text-[#1D9E75]",
                ],
                [
                  "Pending",
                  `${billingStats.pendingAmount.toLocaleString()} ETB`,
                  "text-[#EF9F27]",
                ],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.08)] rounded-xl p-3"
                >
                  <p className="text-[9px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-1">
                    {label}
                  </p>
                  <p
                    className={`font-syne text-lg font-bold tracking-tight ${color}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-sm tracking-tight">
                Complaint Summary
              </h3>
              <a
                href="/woreda/reports/complaints"
                className="text-[10px] text-[#1D9E75] hover:text-[#5DCAA5] transition-colors"
              >
                Full report
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Open", complaintStats.open, "text-[#E24B4A]"],
                ["Resolved", complaintStats.resolved, "text-[#1D9E75]"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.08)] rounded-xl p-3"
                >
                  <p className="text-[9px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-1">
                    {label}
                  </p>
                  <p
                    className={`font-syne text-lg font-bold tracking-tight ${color}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
