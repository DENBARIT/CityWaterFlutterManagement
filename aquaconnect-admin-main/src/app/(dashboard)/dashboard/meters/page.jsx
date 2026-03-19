"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/features/subcity-admins/components/Pagination";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 5;

export default function DashboardMetersPage() {
  const [meters, setMeters] = useState([]);
  const [subCities, setSubCities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSubCityId, setSelectedSubCityId] = useState("");
  const [selectedWoredaId, setSelectedWoredaId] = useState("");
  const [meterCount, setMeterCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdMeters, setCreatedMeters] = useState([]);

  const loadMeters = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await superAdminService.getMeters();
      setMeters(Array.isArray(rows) ? rows : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubCities = useCallback(async () => {
    const rows = await superAdminService.getSubCities();
    setSubCities(
      Array.isArray(rows?.data) ? rows.data : Array.isArray(rows) ? rows : [],
    );
  }, []);

  const loadWoredas = useCallback(async (subCityId) => {
    if (!subCityId) {
      setWoredas([]);
      return;
    }

    const rows = await superAdminService.getWoredas(subCityId);
    setWoredas(
      Array.isArray(rows?.data) ? rows.data : Array.isArray(rows) ? rows : [],
    );
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([loadMeters(), loadSubCities()]);
      } catch (err) {
        setError(err?.message || "Failed to load meters.");
      }
    };

    void bootstrap();
  }, [loadMeters, loadSubCities]);

  useEffect(() => {
    if (!selectedSubCityId) {
      setWoredas([]);
      setSelectedWoredaId("");
      return;
    }

    void loadWoredas(selectedSubCityId);
    setSelectedWoredaId("");
  }, [loadWoredas, selectedSubCityId]);

  useEffect(() => {
    if (!message && !error) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [message, error]);

  const filtered = useMemo(
    () =>
      meters.filter(
        (meter) =>
          !search ||
          meter.meterNumber.toLowerCase().includes(search.toLowerCase()) ||
          (meter.customer?.fullName || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (meter.woreda?.name || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [meters, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = useMemo(
    () => meters.filter((meter) => meter.status === "ACTIVE").length,
    [meters],
  );
  const reservedCount = useMemo(
    () => meters.filter((meter) => meter.assignmentState === "RESERVED").length,
    [meters],
  );
  const signedAutomaticallyCount = useMemo(
    () =>
      meters.filter((meter) => meter.assignmentState === "SIGNED_AUTOMATICALLY")
        .length,
    [meters],
  );

  const selectedSubCityName =
    subCities.find((subCity) => subCity.id === selectedSubCityId)?.name || "";
  const selectedWoredaName =
    woredas.find((woreda) => woreda.id === selectedWoredaId)?.name || "";

  const handleCreateMeters = async (event) => {
    event.preventDefault();

    if (!selectedSubCityId || !selectedWoredaId) {
      setError("Select a subcity and woreda first.");
      return;
    }

    const countValue = Number(meterCount);
    if (!Number.isInteger(countValue) || countValue < 1) {
      setError("Meter count must be at least 1.");
      return;
    }

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await superAdminService.createMeters({
        subCityId: selectedSubCityId,
        woredaId: selectedWoredaId,
        count: countValue,
      });

      const generated = Array.isArray(response?.meters) ? response.meters : [];
      setCreatedMeters(generated);
      setMessage(response?.message || `Created ${generated.length} meters.`);
      await loadMeters();
    } catch (err) {
      setError(err?.message || "Failed to create meters.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="text-[#e8f4f0]">
      {message && (
        <div className="mb-4 rounded-xl border border-[rgba(29,158,117,0.35)] bg-[rgba(29,158,117,0.08)] px-4 py-3 text-xs text-[#7ce4be]">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-3 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Total Meters", meters.length, "system meters"],
          ["Reserved", reservedCount, "ready for registration"],
          [
            "Signed Automatically",
            signedAutomaticallyCount,
            "linked to customers",
          ],
          ["Active", activeCount, "all generated meters"],
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

      <form
        onSubmit={handleCreateMeters}
        className="mb-6 rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Create Meters
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              Generate unique 5-digit meter numbers for a selected woreda.
            </p>
          </div>
          <div className="text-[10px] text-[rgba(232,244,240,0.35)]">
            {selectedSubCityName || "Select a subcity"}
            {selectedWoredaName ? ` / ${selectedWoredaName}` : ""}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Subcity
            </span>
            <select
              value={selectedSubCityId}
              onChange={(e) => setSelectedSubCityId(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            >
              <option value="">Select subcity</option>
              {subCities.map((subCity) => (
                <option key={subCity.id} value={subCity.id}>
                  {subCity.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Woreda
            </span>
            <select
              value={selectedWoredaId}
              onChange={(e) => setSelectedWoredaId(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
              disabled={!selectedSubCityId}
            >
              <option value="">Select woreda</option>
              {woredas.map((woreda) => (
                <option key={woreda.id} value={woreda.id}>
                  {woreda.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Meter Count
            </span>
            <input
              type="number"
              min="1"
              max="1000"
              value={meterCount}
              onChange={(e) => setMeterCount(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-[#1D9E75] px-4 py-2.5 text-xs font-semibold text-[#05141f] hover:bg-[#5DCAA5] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "Generating..." : "Generate Meter Numbers"}
            </button>
          </div>
        </div>
      </form>

      {!!createdMeters.length && (
        <div className="mb-6 rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h3 className="font-syne font-bold text-sm tracking-tight">
                Recently Generated
              </h3>
              <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
                {createdMeters.length} numbers created for{" "}
                {selectedWoredaName || "the selected woreda"}.
              </p>
            </div>
            <span className="text-[10px] text-[#1D9E75]">
              Signed automatically after customer registration
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {createdMeters.map((meter) => (
              <span
                key={meter.id}
                className="rounded-lg border border-[rgba(29,158,117,0.18)] bg-[rgba(29,158,117,0.08)] px-3 py-1.5 font-mono text-[10px] text-[#7ce4be]"
              >
                {meter.meterNumber}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Meter Registry
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {loading
                ? "Loading meters..."
                : `${filtered.length} meters found`}
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
              placeholder="Search meter, customer, or woreda..."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl pl-8 pr-4 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </div>
        </div>

        <div className="px-6 py-4 overflow-x-auto">
          {!paginated.length ? (
            <EmptyState message="No meters found." />
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Meter Number",
                    "Woreda",
                    "Customer",
                    "Phone",
                    "Assignment",
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
                {paginated.map((meter) => (
                  <tr
                    key={meter.id}
                    className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.1)] text-[#1D9E75] font-mono font-medium">
                        {meter.meterNumber}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {meter.woreda?.name || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[rgba(29,158,117,0.12)] flex items-center justify-center text-[9px] font-syne font-bold text-[#1D9E75]">
                          {(meter.customer?.fullName || "UN")
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[rgba(232,244,240,0.8)]">
                            {meter.customer?.fullName || "Unassigned"}
                          </span>
                          <span className="text-[9px] text-[#7ce4be]">
                            {meter.assignmentState === "SIGNED_AUTOMATICALLY"
                              ? "Signed automatically"
                              : meter.assignmentState === "RESERVED"
                                ? "Reserved for registration"
                                : "Not assigned"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.5)]">
                      {meter.customer?.phoneE164 || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${meter.assignmentState === "SIGNED_AUTOMATICALLY" ? "bg-[rgba(29,158,117,0.1)] text-[#1D9E75]" : meter.assignmentState === "RESERVED" ? "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]" : "bg-[rgba(232,244,240,0.08)] text-[rgba(232,244,240,0.55)]"}`}
                      >
                        {meter.assignmentState === "SIGNED_AUTOMATICALLY"
                          ? "Signed automatically"
                          : meter.assignmentState === "RESERVED"
                            ? "Reserved"
                            : "Unassigned"}
                      </span>
                    </td>
                    <td className="py-3 text-[rgba(232,244,240,0.4)]">
                      {meter.createdAt
                        ? new Date(meter.createdAt).toLocaleDateString()
                        : "—"}
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
