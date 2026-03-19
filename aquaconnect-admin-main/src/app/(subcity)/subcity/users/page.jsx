"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { useUsers } from "@/features/users/hooks/useUsers";
import UsersTable from "@/features/users/components/UsersTable";
import Pagination from "@/features/subcity-admins/components/Pagination";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const STATUSES = ["", "ACTIVE", "INACTIVE", "SUSPENDED"];
const FLAGS = ["", "NONE", "WARNING", "CRITICAL", "LEGAL_ACTION"];

export default function SubcityUsersPage() {
  const selectedSubcityId = getJwtPayload()?.subCityId || "";
  const [woredas, setWoredas] = useState([]);
  const [selectedWoreda, setSelectedWoreda] = useState("");
  const [totalConsumption, setTotalConsumption] = useState(0);

  useEffect(() => {
    const loadWoredas = async () => {
      if (!selectedSubcityId) {
        setWoredas([]);
        setSelectedWoreda("");
        return;
      }

      const result = await apiRequest("/locations/woredas", {
        query: { subCityId: selectedSubcityId },
      });

      setWoredas(Array.isArray(result?.data) ? result.data : []);
      setSelectedWoreda("");
    };

    void loadWoredas();
  }, [selectedSubcityId]);

  useEffect(() => {
    const loadConsumption = async () => {
      if (!selectedSubcityId) {
        setTotalConsumption(0);
        return;
      }

      const result = await superAdminService.getBills({
        subCityId: selectedSubcityId,
      });

      const bills = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const total = bills.reduce(
        (sum, bill) => sum + Number(bill?.consumption || 0),
        0,
      );
      setTotalConsumption(total);
    };

    void loadConsumption();
  }, [selectedSubcityId]);

  const {
    users,
    totalPages,
    page,
    setPage,
    allUsers,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterFlag,
    setFilterFlag,
    exportCSV,
    totalCount,
  } = useUsers({
    subcityId: selectedSubcityId,
    woredaId: selectedWoreda,
    source: "subcity",
  });

  const selectedWoredaName = useMemo(() => {
    const found = woredas.find((woreda) => woreda.id === selectedWoreda);
    return found?.name || "";
  }, [woredas, selectedWoreda]);

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          [
            "Total Users",
            allUsers.length,
            selectedWoreda ? `in ${selectedWoredaName}` : "in selected subcity",
          ],
          [
            "Active",
            allUsers.filter((u) => u.status === "ACTIVE").length,
            "currently active",
          ],
          [
            "Flagged",
            allUsers.filter((u) => u.paymentFlag !== "NONE").length,
            "payment issues",
          ],
          [
            "Total Consumption",
            totalConsumption.toFixed(2),
            "m3 in selected subcity",
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
              Subcity Users
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {selectedWoreda
                ? `${totalCount} customers found in ${selectedWoredaName}`
                : `${totalCount} customers found`}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-xs border border-[rgba(29,158,117,0.15)] text-[rgba(232,244,240,0.5)] hover:text-[#1D9E75] hover:border-[rgba(29,158,117,0.35)] transition-all"
          >
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 border-b border-[rgba(29,158,117,0.06)] flex-wrap">
          <select
            value={selectedWoreda}
            onChange={(e) => {
              setSelectedWoreda(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all"
          >
            <option value="">All Woredas</option>
            {woredas.map((woreda) => (
              <option key={woreda.id} value={woreda.id}>
                {woreda.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-50 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-xs">
              🔍
            </span>
            <input
              suppressHydrationWarning
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email or meter..."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl pl-8 pr-4 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || "All Statuses"}
              </option>
            ))}
          </select>
          <select
            value={filterFlag}
            onChange={(e) => {
              setFilterFlag(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all"
          >
            {FLAGS.map((f) => (
              <option key={f} value={f}>
                {f || "All Payment Flags"}
              </option>
            ))}
          </select>
          {(selectedWoreda || search || filterStatus || filterFlag) && (
            <button
              onClick={() => {
                setSelectedWoreda("");
                setSearch("");
                setFilterStatus("");
                setFilterFlag("");
                setPage(1);
              }}
              className="text-[10px] text-[rgba(232,244,240,0.3)] hover:text-[#E24B4A] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          <UsersTable users={users} />
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
