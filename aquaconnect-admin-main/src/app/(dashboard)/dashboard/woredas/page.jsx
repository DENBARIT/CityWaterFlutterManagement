"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";
import WoredaMapCard from "@/features/dashboard/components/WoredaMapCard";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function WoredasPage() {
  const [woredas, setWoredas] = useState([]);
  const [subcities, setSubcities] = useState([]);
  const [name, setName] = useState("");
  const [subCityId, setSubCityId] = useState("");
  const [editTargetId, setEditTargetId] = useState("");
  const [editName, setEditName] = useState("");
  const [editSubCityId, setEditSubCityId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedSubcityId, setExpandedSubcityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const subcityNameById = useMemo(() => {
    const map = new Map();
    subcities.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [subcities]);

  const woredasBySubcity = useMemo(() => {
    const grouped = new Map();
    subcities.forEach((s) => grouped.set(s.id, []));

    woredas.forEach((w) => {
      const key = w.subCityId || "";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(w);
    });

    for (const [, list] of grouped) {
      list.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
    }

    return grouped;
  }, [subcities, woredas]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [subcityRes, woredaRes] = await Promise.all([
        apiRequest("/locations/sub-cities"),
        apiRequest("/locations/woredas"),
      ]);
      setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
      setWoredas(Array.isArray(woredaRes?.data) ? woredaRes.data : []);
    } catch (err) {
      setError(err?.message || "Failed to load woredas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 1400);
    return () => clearTimeout(timer);
  }, [message, error]);

  const resetCreateForm = () => {
    setName("");
    setSubCityId("");
  };

  const beginEdit = (row) => {
    setEditTargetId(String(row.id || ""));
    setEditName(String(row.name || ""));
    setEditSubCityId(String(row.subCityId || ""));
    setEditOpen(true);
    setError("");
    setMessage("");
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditTargetId("");
    setEditName("");
    setEditSubCityId("");
  };

  const toggleSubcityCard = (id) => {
    setExpandedSubcityId((prev) => (prev === id ? "" : id));
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    const trimmed = String(name || "").trim();
    if (!trimmed || !subCityId) {
      setError("Woreda name and subcity are required");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = { name: trimmed, subCityId };
      await superAdminService.createWoredaAlias(payload);
      setMessage("Woreda created");
      resetCreateForm();
      await loadAll();
    } catch (err) {
      const rawMessage = String(err?.message || "").toLowerCase();
      const isDuplicateName =
        err?.status === 409 ||
        rawMessage.includes("already exists") ||
        rawMessage.includes("unique constraint");

      setError(
        isDuplicateName
          ? "Woreda name already exists in this subcity"
          : err?.message || "Unable to save woreda",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const trimmed = String(editName || "").trim();

    if (!editTargetId || !trimmed || !editSubCityId) {
      setError("Woreda name and subcity are required");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await superAdminService.updateWoredaAlias(editTargetId, {
        name: trimmed,
        subCityId: editSubCityId,
      });
      setMessage("Woreda updated");
      closeEditModal();
      await loadAll();
    } catch (err) {
      const rawMessage = String(err?.message || "").toLowerCase();
      const isDuplicateName =
        err?.status === 409 ||
        rawMessage.includes("already exists") ||
        rawMessage.includes("unique constraint");

      setError(
        isDuplicateName
          ? "Woreda name already exists in this subcity"
          : err?.message || "Unable to update woreda",
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget?.id) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await superAdminService.deleteWoredaAlias(deleteTarget.id);
      setMessage("Woreda deleted");
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to delete woreda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#e8f4f0]">
      {message && (
        <div className="fixed top-5 left-1/2 z-2200 -translate-x-1/2">
          <div className="rounded-xl border border-[rgba(29,158,117,0.45)] bg-[#0b2a22] px-4 py-2 text-xs text-[#7ce4be] shadow-lg whitespace-nowrap">
            {message}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-5 left-1/2 z-2200 -translate-x-1/2">
          <div className="rounded-xl border border-[rgba(226,75,74,0.45)] bg-[#2a1211] px-4 py-2 text-xs text-[#ff9c9b] shadow-lg whitespace-nowrap">
            {error}
          </div>
        </div>
      )}

      <WoredaMapCard woredas={woredas} subcities={subcities} />

      <div className="mb-4 rounded-xl border border-[rgba(29,158,117,0.14)] bg-[#05141f] p-4">
        <h2 className="text-sm font-syne font-bold mb-3">Woreda Management</h2>
        <form
          onSubmit={submitCreate}
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-[11px] text-[rgba(232,244,240,0.55)]">
              Woreda Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter woreda name"
              className="w-full rounded-xl border border-[rgba(29,158,117,0.15)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs outline-none focus:border-[rgba(29,158,117,0.4)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[rgba(232,244,240,0.55)]">
              Subcity
            </label>
            <select
              value={subCityId}
              onChange={(e) => setSubCityId(e.target.value)}
              className="w-full rounded-xl border border-[rgba(29,158,117,0.15)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs outline-none focus:border-[rgba(29,158,117,0.4)]"
            >
              <option value="">Select subcity</option>
              {subcities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#1D9E75] px-4 py-2 text-xs font-medium text-[#021015] disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {subcities.map((subcity) => {
          const rows = woredasBySubcity.get(subcity.id) || [];
          const isOpen = expandedSubcityId === subcity.id;

          return (
            <div
              key={subcity.id}
              className="overflow-hidden rounded-2xl border border-[rgba(29,158,117,0.12)] bg-[#05141f]"
            >
              <button
                type="button"
                onClick={() => toggleSubcityCard(subcity.id)}
                className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-[rgba(29,158,117,0.06)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[#e8f4f0]">
                    {subcity.name}
                  </p>
                  <p className="mt-1 text-[11px] text-[rgba(232,244,240,0.5)]">
                    {rows.length} registered woreda
                    {rows.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`text-lg text-[#7ce4be] transition-transform duration-300 ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▾
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-[rgba(29,158,117,0.1)] px-4 py-3">
                    {!rows.length ? (
                      <p className="py-2 text-xs text-[rgba(232,244,240,0.45)]">
                        No registered woredas under this subcity.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {rows.map((row) => (
                          <div
                            key={row.id}
                            className="flex items-center justify-between rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] px-3 py-2"
                          >
                            <p className="text-xs text-[#e8f4f0]">{row.name}</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => beginEdit(row)}
                                className="rounded-lg border border-[rgba(93,202,165,0.35)] px-3 py-1 text-[11px] text-[#7ce4be]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                className="rounded-lg border border-[rgba(226,75,74,0.35)] px-3 py-1 text-[11px] text-[#ff9c9b]"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!subcities.length && !loading && (
          <div className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] px-4 py-6 text-center text-xs text-[rgba(232,244,240,0.45)]">
            No subcities found
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={closeEditModal} title="Edit Woreda">
        <form onSubmit={submitEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] text-[rgba(232,244,240,0.55)]">
              Woreda Name
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter woreda name"
              className="w-full rounded-xl border border-[rgba(29,158,117,0.15)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs outline-none focus:border-[rgba(29,158,117,0.4)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-[rgba(232,244,240,0.55)]">
              Subcity
            </label>
            <select
              value={editSubCityId}
              onChange={(e) => setEditSubCityId(e.target.value)}
              className="w-full rounded-xl border border-[rgba(29,158,117,0.15)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs outline-none focus:border-[rgba(29,158,117,0.4)]"
            >
              <option value="">Select subcity</option>
              {subcities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="rounded-xl border border-[rgba(232,244,240,0.2)] px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#1D9E75] px-4 py-2 text-xs font-medium text-[#021015] disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={loading}
        title="Delete Woreda"
        message={`Are you sure you want to delete ${deleteTarget?.name || "this woreda"}?`}
      />
    </div>
  );
}
