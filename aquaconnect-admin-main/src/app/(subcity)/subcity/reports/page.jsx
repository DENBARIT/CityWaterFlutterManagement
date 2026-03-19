"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function SubcityReportsPage() {
  const [woredas, setWoredas] = useState([]);
  const [users, setUsers] = useState([]);
  const [woredaAdmins, setWoredaAdmins] = useState([]);
  const subCityId = getJwtPayload()?.subCityId || "";

  useEffect(() => {
    const loadReportData = async () => {
      if (!subCityId) {
        setWoredas([]);
        setUsers([]);
        setWoredaAdmins([]);
        return;
      }

      const [woredasResult, usersResult, adminsResult] = await Promise.all([
        superAdminService.getWoredas(subCityId),
        superAdminService.getUsersByLocation({ subCityId }),
        superAdminService.searchAdmins({ role: "WOREDA_ADMINS", subCityId }),
      ]);

      setWoredas(woredasResult?.data || []);
      setUsers(Array.isArray(usersResult) ? usersResult : []);
      setWoredaAdmins(Array.isArray(adminsResult) ? adminsResult : []);
    };

    loadReportData();
  }, [subCityId]);

  const rows = useMemo(() => {
    return woredas.map((woreda) => {
      const woredaUsers = users.filter((u) => u.woredaId === woreda.id);
      const totalCustomers = woredaUsers.length;
      const active = woredaUsers.filter((u) => u.status === "ACTIVE").length;
      const inactive = totalCustomers - active;
      const withMeter = woredaUsers.filter(
        (u) => Array.isArray(u.meters) && u.meters.length > 0,
      ).length;
      const coverageRate =
        totalCustomers > 0
          ? ((withMeter / totalCustomers) * 100).toFixed(1)
          : "0.0";
      const adminCount = woredaAdmins.filter(
        (a) => a.woredaId === woreda.id,
      ).length;

      return {
        woredaId: woreda.id,
        woredaName: woreda.name,
        totalCustomers,
        active,
        inactive,
        withMeter,
        coverageRate,
        adminCount,
      };
    });
  }, [woredas, users, woredaAdmins]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        totalCustomers: acc.totalCustomers + row.totalCustomers,
        active: acc.active + row.active,
        inactive: acc.inactive + row.inactive,
        withMeter: acc.withMeter + row.withMeter,
        adminCount: acc.adminCount + row.adminCount,
      }),
      {
        totalCustomers: 0,
        active: 0,
        inactive: 0,
        withMeter: 0,
        adminCount: 0,
      },
    );
  }, [rows]);

  const overallCoverage =
    totals.totalCustomers > 0
      ? ((totals.withMeter / totals.totalCustomers) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Total Customers", totals.totalCustomers, "across all woredas"],
          [
            "Active",
            totals.active,
            `${totals.totalCustomers ? ((totals.active / totals.totalCustomers) * 100).toFixed(1) : "0.0"}% active rate`,
          ],
          [
            "With Meter",
            totals.withMeter,
            `${overallCoverage}% meter coverage`,
          ],
          ["Woreda Admins", totals.adminCount, "assigned to woredas"],
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
        <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <h2 className="font-syne font-bold text-sm tracking-tight">
            Operational by Woreda
          </h2>
          <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
            Live customer and meter coverage overview per woreda
          </p>
        </div>
        <div className="px-6 py-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(29,158,117,0.06)]">
                {[
                  "Woreda",
                  "Customers",
                  "Active",
                  "Inactive",
                  "With Meter",
                  "Coverage",
                  "Admins",
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
              {rows.map((row) => (
                <tr
                  key={row.woredaId}
                  className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75]">
                      {row.woredaName}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[rgba(232,244,240,0.7)]">
                    {row.totalCustomers}
                  </td>
                  <td className="py-3 pr-4 text-[#1D9E75]">{row.active}</td>
                  <td className="py-3 pr-4 text-[#EF9F27]">{row.inactive}</td>
                  <td className="py-3 pr-4 text-[rgba(232,244,240,0.6)]">
                    {row.withMeter}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[rgba(29,158,117,0.1)] rounded-full overflow-hidden max-w-15">
                        <div
                          className="h-full bg-[#1D9E75] rounded-full"
                          style={{ width: `${row.coverageRate}%` }}
                        />
                      </div>
                      <span className="text-[rgba(232,244,240,0.6)]">
                        {row.coverageRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[rgba(232,244,240,0.7)]">
                    {row.adminCount}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 text-[10px] text-[rgba(232,244,240,0.35)]"
                  >
                    No woreda data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
