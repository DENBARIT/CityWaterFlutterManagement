"use client";

import { useEffect, useMemo, useState } from "react";
import { useUsers } from "@/features/users/hooks/useUsers";
import UsersTable from "@/features/users/components/UsersTable";
import Pagination from "@/features/subcity-admins/components/Pagination";
import { apiRequest, getJwtPayload } from "@/services/apiClient";

const STATUSES = ["", "ACTIVE", "SUSPENDED"];

export default function WoredaUsersPage() {
  const [woredas, setWoredas] = useState([]);
  const [selectedWoreda, setSelectedWoreda] = useState("");
  const selectedSubcityId = getJwtPayload()?.subCityId || "";

  useEffect(() => {
    const loadWoredas = async () => {
      const result = await apiRequest("/locations/woredas", {
        query: { subCityId: selectedSubcityId },
      });
      setWoredas(result?.data || []);
      setSelectedWoreda("");
    };

    if (!selectedSubcityId) {
      return;
    }

    loadWoredas();
  }, [selectedSubcityId]);

  const {
    users,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    exportCSV,
    totalCount,
  } = useUsers({
    subcityId: selectedSubcityId,
    woredaId: selectedWoreda,
    source: "subcity",
  });

  const selectedWoredaName = useMemo(() => {
    const found = woredas.find((w) => w.id === selectedWoreda);
    return found?.name || "";
  }, [woredas, selectedWoreda]);

  return (
    <div className="text-[#e8f4f0]">
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-6 mb-6">
        <h2 className="font-syne font-bold text-sm tracking-tight mb-1">
          Filter by Woreda
        </h2>
        <p className="text-[10px] text-[rgba(232,244,240,0.3)] mb-5">
          Select a woreda to view its customers
        </p>
        <div className="flex gap-3 mb-3 flex-wrap"></div>
        <select
          value={selectedWoreda}
          onChange={(e) => {
            setSelectedWoreda(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-sm bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.12)] rounded-xl px-4 py-3 text-sm text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.5)] transition-all"
        >
          <option value="">All Woredas</option>
          {woredas.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {selectedWoreda && (
          <button
            onClick={() => {
              setSelectedWoreda("");
              setPage(1);
            }}
            className="mt-3 block text-[10px] text-[rgba(232,244,240,0.3)] hover:text-[#E24B4A] transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              {selectedWoreda
                ? `Users in ${selectedWoredaName}`
                : "All Woreda Users"}
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {totalCount} customers found
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-xs border border-[rgba(29,158,117,0.15)] text-[rgba(232,244,240,0.5)] hover:text-[#1D9E75] hover:border-[rgba(29,158,117,0.35)] transition-all"
          >
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 border-b border-[rgba(29,158,117,0.06)]">
          <div className="relative flex-1 max-w-xs">
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
          {(search || filterStatus) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("");
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
