"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import SubcityOfficerForm from "@/features/subcity-admins/subcity/components/SubcityOfficerForm";
import { apiRequest, getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function SubcityBillingOfficersPage() {
  const [officers, setOfficers] = useState([]);
  const [subcities, setSubcities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [actionToast, setActionToast] = useState(null);
  const subCityId = getJwtPayload()?.subCityId || "";

  const subcityNameById = new Map(
    subcities.map((subcity) => [subcity.id, subcity.name]),
  );

  const normalizeOfficers = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return [];
  };

  const showToast = (type, text) => {
    setActionToast({ type, text });
  };

  const extractOfficer = (payload) => {
    if (payload?.data && typeof payload.data === "object") {
      return payload.data;
    }

    if (payload && typeof payload === "object" && payload.id) {
      return payload;
    }

    return null;
  };

  const csvEscape = (value) => {
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const handleInactiveOrDeletedSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }

    showToast(
      "error",
      "Your session is inactive or deleted. Please sign in again.",
    );
  };

  const handleValidationToast = (errors) => {
    const [firstField] = Object.keys(errors || {});
    if (!firstField) {
      return;
    }

    const fieldMessage = errors?.[firstField]?.message;
    showToast("error", fieldMessage || "Please complete the form correctly.");
  };

  useEffect(() => {
    if (!actionToast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setActionToast(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [actionToast]);

  useEffect(() => {
    const load = async () => {
      if (!subCityId) {
        setOfficers([]);
        return;
      }

      setLoading(true);
      try {
        const [rows, subcityRes] = await Promise.all([
          superAdminService.getSubcityBillingOfficers(),
          apiRequest("/locations/sub-cities"),
        ]);
        setOfficers(normalizeOfficers(rows));
        setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [subCityId]);

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    window.addEventListener("subcity:billing-officers-open-create", openCreate);
    return () => {
      window.removeEventListener(
        "subcity:billing-officers-open-create",
        openCreate,
      );
    };
  }, []);

  const handleCreate = async (data) => {
    setCreateLoading(true);
    try {
      if (!subCityId) {
        showToast(
          "error",
          "Your subcity profile could not be found. Please sign in again.",
        );
        return;
      }

      const createdPayload = await superAdminService.createBillingOfficer({
        fullName: data.fullName,
        email: data.email,
        phoneE164: data.phoneNumber,
        nationalId: data.nationalId,
        password: data.password,
      });

      const createdOfficer = extractOfficer(createdPayload);

      if (createdOfficer) {
        setOfficers((current) => {
          const withoutCreated = current.filter(
            (row) => row.id !== createdOfficer.id,
          );
          return [createdOfficer, ...withoutCreated];
        });
      }

      setCreateOpen(false);
      showToast("success", "Billing officer created successfully.");

      try {
        const rows = await superAdminService.getSubcityBillingOfficers();
        setOfficers(normalizeOfficers(rows));
      } catch (_refreshError) {
        // Keep optimistic row in table if refresh fails.
      }
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();

      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
        return;
      }

      if (
        message.includes("unauthorized") ||
        message.includes("invalid token") ||
        message.includes("forbidden")
      ) {
        showToast(
          "error",
          "You are not authorized to add billing officers. Please sign in again with a subcity admin account.",
        );
        return;
      }

      if (message.includes("already") || message.includes("exists")) {
        showToast("error", "Billing officer already exists.");
        return;
      }

      showToast("error", err?.message || "Unable to create billing officer.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (data) => {
    if (!editTarget) {
      return;
    }

    try {
      await superAdminService.updateSubcityBillingOfficer(editTarget.id, {
        fullName: data.fullName,
        email: data.email,
        phoneE164: data.phoneNumber,
        nationalId: data.nationalId,
        ...(data.password ? { password: data.password } : {}),
      });

      const rows = await superAdminService.getSubcityBillingOfficers();
      setOfficers(normalizeOfficers(rows));
      const subcityRes = await apiRequest("/locations/sub-cities");
      setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
      setEditTarget(null);
      showToast("success", "Billing officer updated successfully.");
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();

      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
        return;
      }

      showToast("error", err?.message || "Unable to update billing officer.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await superAdminService.deleteSubcityBillingOfficer(deleteTarget.id);
      const rows = await superAdminService.getSubcityBillingOfficers();
      setOfficers(normalizeOfficers(rows));
      const subcityRes = await apiRequest("/locations/sub-cities");
      setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
      setDeleteTarget(null);
      showToast("success", "Billing officer deleted successfully.");
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();

      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
        return;
      }

      showToast("error", err?.message || "Unable to delete billing officer.");
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) {
      return;
    }

    const nextStatus =
      statusTarget.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await superAdminService.suspendSubcityBillingOfficer(
        statusTarget.id,
        nextStatus,
      );
      const rows = await superAdminService.getSubcityBillingOfficers();
      setOfficers(normalizeOfficers(rows));
      const subcityRes = await apiRequest("/locations/sub-cities");
      setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
      setStatusTarget(null);
      showToast(
        "success",
        `Billing officer ${nextStatus.toLowerCase()} successfully.`,
      );
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();

      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
        return;
      }

      showToast(
        "error",
        err?.message || "Unable to update billing officer status.",
      );
    }
  };

  const handleExportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Status", "Registered Date"];
    const rows = officers.map((row) => [
      row.fullName || "",
      row.email || "",
      row.phoneE164 || "",
      row.status || "",
      row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "",
    ]);

    const csv = [headers, ...rows]
      .map((record) => record.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "subcity-billing-officers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-[#e8f4f0] bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
      {actionToast && (
        <div className="fixed top-5 left-1/2 z-3000 -translate-x-1/2">
          <div
            className={`rounded-xl border px-4 py-2 text-xs shadow-lg whitespace-nowrap ${
              actionToast.type === "success"
                ? "border-[rgba(29,158,117,0.45)] bg-[#0b2a22] text-[#7ce4be]"
                : "border-[rgba(226,75,74,0.45)] bg-[#2a1211] text-[#ff9c9b]"
            }`}
          >
            {actionToast.text}
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Billing Officers
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {loading ? "Loading..." : `${officers.length} officers found`}
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl text-xs border border-[rgba(29,158,117,0.15)] text-[rgba(232,244,240,0.5)] hover:text-[#1D9E75] hover:border-[rgba(29,158,117,0.35)] transition-all"
          >
            Export CSV
          </button>
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
                "Subcity",
                "Woreda",
                "Status",
                "Registered Date",
                "Actions",
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
            {officers.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[rgba(29,158,117,0.04)]"
              >
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                  <div className="font-medium text-[#e8f4f0]">
                    {row.fullName || "-"}
                  </div>
                  <div className="mt-1 text-[10px] text-[rgba(232,244,240,0.35)]">
                    {row.nationalId || "No national ID"}
                  </div>
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                  {row.email}
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                  {row.phoneE164 || "-"}
                </td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75]">
                    {subcityNameById.get(row.subCityId) ||
                      row.subCity?.name ||
                      "—"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <Badge status={row.status || "ACTIVE"} />
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.45)]">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setEditTarget(row)}
                      className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.18)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setStatusTarget(row)}
                      className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(239,159,39,0.12)] text-[#EF9F27] hover:bg-[rgba(239,159,39,0.22)] transition-colors"
                    >
                      {row.status === "SUSPENDED" ? "Activate" : "Suspend"}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(row)}
                      className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(226,75,74,0.08)] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.18)] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !officers.length && (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 text-[10px] text-[rgba(232,244,240,0.35)]"
                >
                  No billing officers found for your subcity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Billing Officer"
      >
        <SubcityOfficerForm
          onSubmit={handleCreate}
          onValidationError={handleValidationToast}
          loading={createLoading}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Billing Officer"
      >
        <SubcityOfficerForm
          onSubmit={handleEdit}
          onValidationError={handleValidationToast}
          defaultValues={editTarget}
          loading={loading}
        />
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Delete Billing Officer"
        message={`Delete ${deleteTarget?.fullName || "this billing officer"}? This will soft delete the officer account.`}
      />

      <ConfirmModal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        loading={loading}
        title={
          statusTarget?.status === "SUSPENDED"
            ? "Activate Billing Officer"
            : "Suspend Billing Officer"
        }
        message={`${statusTarget?.status === "SUSPENDED" ? "Activate" : "Suspend"} ${statusTarget?.fullName || "this billing officer"}?`}
      />
    </div>
  );
}
