"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function BillingOfficersPage() {
  const [billingOfficers, setBillingOfficers] = useState([]);
  const [subcities, setSubcities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneE164: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const subcityNameById = useMemo(() => {
    const map = new Map();
    subcities.forEach((subcity) => map.set(subcity.id, subcity.name));
    return map;
  }, [subcities]);

  const activeCount = useMemo(
    () =>
      billingOfficers.filter((officer) => officer.status === "ACTIVE").length,
    [billingOfficers],
  );

  const suspendedCount = useMemo(
    () =>
      billingOfficers.filter((officer) => officer.status === "SUSPENDED")
        .length,
    [billingOfficers],
  );

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [subcityRes, billingRows] = await Promise.all([
        apiRequest("/locations/sub-cities"),
        superAdminService.getSubcityBillingOfficers(),
      ]);

      setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
      setBillingOfficers(Array.isArray(billingRows) ? billingRows : []);
    } catch (err) {
      setError(err?.message || "Failed to load billing officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!messageText && !error) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessageText("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [messageText, error]);

  const startEdit = (officer) => {
    setEditTarget(officer);
    setEditForm({
      fullName: officer.fullName || "",
      email: officer.email || "",
      phoneE164: officer.phoneE164 || "",
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editTarget?.id) {
      return;
    }

    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      setError("Full name and email are required.");
      return;
    }

    setActionLoading(true);
    try {
      await superAdminService.updateSubcityBillingOfficer(editTarget.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phoneE164: editForm.phoneE164.trim(),
      });
      setEditTarget(null);
      setMessageText("Billing officer updated successfully.");
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to update billing officer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendToggle = async (officer) => {
    if (!officer?.id) {
      return;
    }
    const nextStatus = officer.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

    setActionLoading(true);
    try {
      await superAdminService.suspendSubcityBillingOfficer(
        officer.id,
        nextStatus,
      );
      setMessageText(
        `${officer.fullName || "Officer"} is now ${nextStatus.toLowerCase()}.`,
      );
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to update officer status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    setActionLoading(true);
    try {
      await superAdminService.deleteSubcityBillingOfficer(deleteTarget.id);
      setDeleteTarget(null);
      setMessageText("Billing officer deleted successfully.");
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to delete billing officer.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="text-[#e8f4f0]">
      {messageText && (
        <div className="mb-3 rounded-xl border border-[rgba(29,158,117,0.35)] bg-[rgba(29,158,117,0.08)] px-4 py-2 text-xs text-[#7ce4be]">
          {messageText}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-2 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Billing Officers", billingOfficers.length, "registered staff"],
          ["Subcities", subcities.length, "covered locations"],
          ["Active", activeCount, "currently active"],
          ["Suspended", suspendedCount, "currently suspended"],
          ["Loading", loading ? 1 : 0, loading ? "fetching data" : "idle"],
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
            Billing Officers
          </h2>
          <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
            View billing officers registered by subcity admins
          </p>
        </div>

        <div className="px-6 py-4 overflow-x-auto">
          {loading ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              Loading billing officers...
            </p>
          ) : !billingOfficers.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              No billing officers found.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Name",
                    "Email",
                    "Phone",
                    "Subcity",
                    "Actions",
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
                {billingOfficers.map((officer) => (
                  <tr
                    key={officer.id}
                    className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                  >
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                      {officer.fullName || "-"}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {officer.email || "-"}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {officer.phoneE164 || "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75]">
                        {subcityNameById.get(officer.subCityId) ||
                          officer.subCity?.name ||
                          "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {officer.status || "-"}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.4)]">
                      {officer.createdAt
                        ? new Date(officer.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(officer)}
                          className="rounded-lg px-2.5 py-1 text-[10px] font-semibold bg-[rgba(29,158,117,0.08)] text-[#7ce4be] hover:bg-[rgba(29,158,117,0.2)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSuspendToggle(officer)}
                          className="rounded-lg px-2.5 py-1 text-[10px] font-semibold bg-[rgba(224,171,69,0.12)] text-[#f0c66f] hover:bg-[rgba(224,171,69,0.24)]"
                        >
                          {officer.status === "SUSPENDED"
                            ? "Activate"
                            : "Suspend"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(officer)}
                          className="rounded-lg px-2.5 py-1 text-[10px] font-semibold bg-[rgba(226,75,74,0.12)] text-[#ff9c9b] hover:bg-[rgba(226,75,74,0.24)]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit Billing Officer"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Full Name
            </span>
            <input
              value={editForm.fullName}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Email
            </span>
            <input
              value={editForm.email}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Phone
            </span>
            <input
              value={editForm.phoneE164}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, phoneE164: e.target.value }))
              }
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)]"
            />
          </label>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="px-4 py-2 rounded-xl text-xs border border-[rgba(232,244,240,0.1)] text-[rgba(232,244,240,0.6)] hover:text-[#e8f4f0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-xs bg-[#1D9E75] text-[#05141f] font-semibold hover:bg-[#5DCAA5] disabled:opacity-60"
            >
              {actionLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Billing Officer"
        message={`Are you sure you want to delete ${deleteTarget?.fullName || "this billing officer"}? This action cannot be undone.`}
      />
    </div>
  );
}
