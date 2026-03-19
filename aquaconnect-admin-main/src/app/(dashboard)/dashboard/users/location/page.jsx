"use client";

import { useEffect, useMemo, useState } from "react";
import { useUsers } from "@/features/users/hooks/useUsers";
import UsersTable from "@/features/users/components/UsersTable";
import Pagination from "@/features/subcity-admins/components/Pagination";
import { apiRequest } from "@/services/apiClient";

const STATUSES = ["", "ACTIVE", "INACTIVE", "SUSPENDED"];

export default function UsersByLocationPage() {
  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [selectedSubcity, setSelectedSubcity] = useState("");
  const [selectedWoreda, setSelectedWoreda] = useState("");

  useEffect(() => {
    const loadSubcities = async () => {
      const result = await apiRequest("/locations/sub-cities");
      setSubcities(result?.data || []);
    };

    loadSubcities();
  }, []);

  useEffect(() => {
    const loadWoredas = async () => {
      const result = await apiRequest("/locations/woredas", {
        query: { subCityId: selectedSubcity },
      });
      setWoredas(result?.data || []);
    };

    loadWoredas();
  }, [selectedSubcity]);

  const selectedSubcityName = useMemo(() => {
    const found = subcities.find((s) => s.id === selectedSubcity);
    return found?.name || "";
  }, [subcities, selectedSubcity]);

  const selectedWoredaName = useMemo(() => {
    const found = woredas.find((w) => w.id === selectedWoreda);
    return found?.name || "";
  }, [woredas, selectedWoreda]);

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
    updatingUserId,
    updateUserStatus,
  } = useUsers({ subcityId: selectedSubcity, woredaId: selectedWoreda });

  const handleSubcityChange = (val) => {
    setSelectedSubcity(val);
    setSelectedWoreda("");
    setPage(1);
  };

  return (
    <div className="text-[#e8f4f0]">
      {/* Location Picker */}
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-6 mb-6">
        <h2 className="font-syne font-bold text-sm tracking-tight mb-1">
          Filter by Location
        </h2>
        <p className="text-[10px] text-[rgba(232,244,240,0.3)] mb-5">
          Select a subcity and optionally a woreda to filter users
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.4)] mb-2">
              Subcity
            </label>
            <select
              value={selectedSubcity}
              onChange={(e) => handleSubcityChange(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.12)] rounded-xl px-4 py-3 text-sm text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.5)] transition-all"
            >
              <option value="">All Subcities</option>
              {subcities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.4)] mb-2">
              Woreda
            </label>
            <select
              value={selectedWoreda}
              onChange={(e) => {
                setSelectedWoreda(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.12)] rounded-xl px-4 py-3 text-sm text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">All Woredas</option>
              {woredas.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(selectedSubcity || selectedWoreda) && (
          <button
            onClick={() => {
              setSelectedSubcity("");
              setSelectedWoreda("");
              setPage(1);
            }}
            className="mt-4 text-[10px] text-[rgba(232,244,240,0.3)] hover:text-[#E24B4A] transition-colors"
          >
            Clear location filter
          </button>
        )}
      </div>

      {/* Results Card */}
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              {selectedWoreda
                ? `Users in ${selectedWoredaName}`
                : selectedSubcity
                  ? `Users in ${selectedSubcityName}`
                  : "All Users"}
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

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[rgba(29,158,117,0.06)]">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-xs">
              🔍
            </span>
            <input
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
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
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

        {/* Table */}
        <div className="px-6 py-4">
          <UsersTable
            users={users}
            updatingUserId={updatingUserId}
            onToggleStatus={updateUserStatus}
          />
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
