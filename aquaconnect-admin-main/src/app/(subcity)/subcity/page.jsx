"use client";

import { useEffect, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function SubcityOverviewPage() {
  const [woredaAdmins, setWoredaAdmins] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const subCityId = getJwtPayload()?.subCityId || "";

  useEffect(() => {
    const loadOverview = async () => {
      if (!subCityId) {
        setWoredaAdmins([]);
        setWoredas([]);
        setUsers([]);
        setSchedules([]);
        return;
      }

      const [adminsResult, woredasResult, usersResult, schedulesResult] =
        await Promise.all([
          superAdminService.searchAdmins({ role: "WOREDA_ADMINS", subCityId }),
          superAdminService.getWoredas(subCityId),
          superAdminService.getUsersByLocation({ subCityId }),
          superAdminService.getSchedules({ subCityId }),
        ]);

      setWoredaAdmins(Array.isArray(adminsResult) ? adminsResult : []);
      setWoredas(woredasResult?.data || []);
      setUsers(Array.isArray(usersResult) ? usersResult : []);
      setSchedules(Array.isArray(schedulesResult) ? schedulesResult : []);
    };

    loadOverview();
  }, [subCityId]);

  const stats = [
    ["Woreda Admins", woredaAdmins.length, "under your subcity"],
    ["Woredas", woredas.length, "woredas managed"],
    ["Schedules", schedules.length, "active schedules"],
    ["Total Users", users.length, "registered customers"],
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
        {/* Recent Woreda Admins */}
        <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-sm tracking-tight">
              Recent Woreda Admins
            </h3>
            <a
              href="/subcity/woreda-admins"
              className="text-[10px] text-[#1D9E75] hover:text-[#5DCAA5] transition-colors"
            >
              View all
            </a>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(29,158,117,0.06)]">
                {["Name", "Woreda", "Status"].map((h) => (
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
              {woredaAdmins.slice(0, 4).map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[rgba(29,158,117,0.04)]"
                >
                  <td className="py-2 pr-4 text-[rgba(232,244,240,0.8)]">
                    {a.fullName}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75]">
                      {a.woreda?.name}
                    </span>
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${a.status === "ACTIVE" ? "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]" : "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]"}`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!woredaAdmins.length && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-4 text-[10px] text-[rgba(232,244,240,0.35)]"
                  >
                    No woreda admins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Schedules Summary */}
        <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-sm tracking-tight">
              Active Schedules
            </h3>
            <a
              href="/subcity/schedules"
              className="text-[10px] text-[#1D9E75] hover:text-[#5DCAA5] transition-colors"
            >
              View all
            </a>
          </div>
          <div className="space-y-2">
            {schedules.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 border-b border-[rgba(29,158,117,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] font-mono">
                    {(s.day || "").slice(0, 3)}
                  </span>
                  <span className="text-xs text-[rgba(232,244,240,0.6)]">
                    {s.woreda?.name}
                  </span>
                </div>
                <span className="text-[10px] text-[rgba(232,244,240,0.4)] font-mono">
                  {s.startTime} – {s.endTime}
                </span>
              </div>
            ))}
            {!schedules.length && (
              <p className="text-[10px] text-[rgba(232,244,240,0.35)] py-2">
                No schedules found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
