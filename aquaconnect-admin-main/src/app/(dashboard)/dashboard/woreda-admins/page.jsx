"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function DashboardWoredaAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subcityNameById = useMemo(() => {
    const map = new Map();
    subcities.forEach((subcity) => map.set(subcity.id, subcity.name));
    return map;
  }, [subcities]);

  const woredaNameById = useMemo(() => {
    const map = new Map();
    woredas.forEach((woreda) => map.set(woreda.id, woreda.name));
    return map;
  }, [woredas]);

  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [subcityRes, woredaRes, adminRows] = await Promise.all([
          apiRequest("/locations/sub-cities"),
          apiRequest("/locations/woredas"),
          superAdminService.searchAdmins({ role: "WOREDA_ADMINS" }),
        ]);

        if (!active) return;

        setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
        setWoredas(Array.isArray(woredaRes?.data) ? woredaRes.data : []);
        setAdmins(Array.isArray(adminRows) ? adminRows : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load woreda admins");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadAll();
    return () => {
      active = false;
    };
  }, []);

  const groupedBySubcity = useMemo(() => {
    const grouped = new Map();

    for (const admin of admins) {
      const subcityId = String(admin?.subCityId || admin?.subCity?.id || "");
      const key = subcityId || "unknown";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(admin);
    }

    return grouped;
  }, [admins]);

  return (
    <div className="text-[#e8f4f0]">
      {error && (
        <div className="mb-3 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-2 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Total Admins", admins.length, "registered by subcity admins"],
          ["Subcities", subcities.length, "covered locations"],
          ["Woredas", woredas.length, "assigned woredas"],
          [
            "Active",
            admins.filter((a) => a.status === "ACTIVE").length,
            "currently active",
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

      <div className="space-y-4">
        {[...groupedBySubcity.entries()].map(([subcityId, rows]) => (
          <div
            key={subcityId}
            className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)] flex items-center justify-between">
              <div>
                <h2 className="font-syne font-bold text-sm tracking-tight">
                  {subcityNameById.get(subcityId) || "Unknown Subcity"}
                </h2>
                <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
                  {rows.length} woreda admin{rows.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(29,158,117,0.06)]">
                    {[
                      "Name",
                      "Email",
                      "Phone",
                      "Woreda",
                      "Status",
                      "Created",
                    ].map((header) => (
                      <th
                        key={header}
                        className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                    >
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                        {admin.fullName || "-"}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        {admin.email || "-"}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        {admin.phoneE164 || "-"}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        {woredaNameById.get(admin.woredaId) ||
                          admin.woreda?.name ||
                          "-"}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        {admin.status || "-"}
                      </td>
                      <td className="py-3 text-[rgba(232,244,240,0.4)]">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {!loading && !admins.length && (
          <div className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] px-4 py-6 text-center text-xs text-[rgba(232,244,240,0.45)]">
            No woreda admins found.
          </div>
        )}
      </div>
    </div>
  );
}
