"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import SubcityOfficerForm from "@/features/subcity-admins/subcity/components/SubcityOfficerForm";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function WoredaBillingOfficersPage() {
  const [officers, setOfficers] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedWoredaIds, setSelectedWoredaIds] = useState([]);
  const [actionToast, setActionToast] = useState(null);
  const subCityId = getJwtPayload()?.subCityId || "";

  const showToast = (type, text) => {
    setActionToast({ type, text });
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

  const normalizeAssignments = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return [];
  };

  const refreshOfficers = async () => {
    const rows = await superAdminService.getBillingOfficers({ subCityId });
    const normalized = Array.isArray(rows) ? rows : [];
    const woredaBillingRows = normalized.filter(
      (item) => item.role === "WOREDA_BILLING_OFFICER",
    );

    const rowsWithAssignments = await Promise.all(
      woredaBillingRows.map(async (item) => {
        try {
          const assignmentsPayload =
            await superAdminService.getWoredaBillingOfficerAssignments(item.id);
          const assignments = normalizeAssignments(assignmentsPayload);
          return {
            ...item,
            assignmentWoredas: assignments
              .map((entry) => ({
                id: entry?.woreda?.id || entry?.woredaId,
                name: entry?.woreda?.name || "",
              }))
              .filter((entry) => entry.id),
          };
        } catch (_error) {
          return { ...item, assignmentWoredas: [] };
        }
      }),
    );

    setOfficers(rowsWithAssignments);
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
        const woredaResponse = await superAdminService.getWoredas(subCityId);
        const woredaRows = Array.isArray(woredaResponse?.data)
          ? woredaResponse.data
          : [];
        setWoredas(woredaRows);
        await refreshOfficers();
      } catch (err) {
        showToast("error", err?.message || "Failed to load billing officers.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [subCityId]);

  const handleEdit = async (data) => {
    if (!editTarget) {
      return;
    }

    try {
      await superAdminService.updateFieldOfficer(editTarget.id, {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        nationalId: data.nationalId,
      });

      await refreshOfficers();
      setEditTarget(null);
      showToast("success", "Woreda billing officer updated successfully.");
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
      await superAdminService.deleteFieldOfficer(deleteTarget.id);
      await refreshOfficers();
      setDeleteTarget(null);
      showToast("success", "Woreda billing officer deleted successfully.");
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
      await superAdminService.updateFieldOfficer(statusTarget.id, {
        status: nextStatus,
      });
      await refreshOfficers();
      setStatusTarget(null);
      showToast(
        "success",
        `Woreda billing officer ${nextStatus.toLowerCase()} successfully.`,
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
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Woreda",
      "Assigned Woredas",
      "Status",
      "Registered Date",
    ];

    const rows = officers.map((row) => [
      row.fullName || "",
      row.email || "",
      row.phoneE164 || "",
      row.woreda?.name || "",
      (row.assignmentWoredas || []).map((entry) => entry.name).join("; "),
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
    link.download = "woreda-billing-officers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openAssignModal = async (officer) => {
    try {
      const assignmentsPayload =
        await superAdminService.getWoredaBillingOfficerAssignments(officer.id);
      const assignments = normalizeAssignments(assignmentsPayload);
      setSelectedWoredaIds(
        assignments
          .map((entry) => entry?.woreda?.id || entry?.woredaId)
          .filter(Boolean),
      );
      setAssignTarget(officer);
    } catch (err) {
      showToast("error", err?.message || "Unable to load officer assignments.");
    }
  };

  const toggleWoredaSelection = (woredaId) => {
    setSelectedWoredaIds((current) =>
      current.includes(woredaId)
        ? current.filter((id) => id !== woredaId)
        : [...current, woredaId],
    );
  };

  const handleAssignWoredas = async () => {
    if (!assignTarget) {
      return;
    }

    setAssignLoading(true);
    try {
      await superAdminService.assignWoredaBillingOfficer(
        assignTarget.id,
        selectedWoredaIds,
      );
      await refreshOfficers();
      setAssignTarget(null);
      setSelectedWoredaIds([]);
      showToast("success", "Woreda assignments updated successfully.");
    } catch (err) {
      showToast("error", err?.message || "Unable to update assignments.");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="text-[#e8f4f0] bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
      {actionToast && (
        <div className="fixed top-5 left-1/2 z-80 -translate-x-1/2">
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
              Woreda Billing Officers
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
                "Woreda",
                "Assigned Woredas",
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
                className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
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
                  {row.email || "-"}
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                  {row.phoneE164 || "-"}
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                  {row.woreda?.name || "-"}
                </td>
                <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                  {(row.assignmentWoredas || []).length
                    ? row.assignmentWoredas
                        .map((entry) => entry.name)
                        .join(", ")
                    : "-"}
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
                      onClick={() => openAssignModal(row)}
                      className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(55,138,221,0.12)] text-[#60A5FA] hover:bg-[rgba(55,138,221,0.22)] transition-colors"
                    >
                      Assign Woredas
                    </button>
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
                  colSpan={8}
                  className="py-4 text-[10px] text-[rgba(232,244,240,0.35)]"
                >
                  No woreda billing officers found for your subcity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!assignTarget}
        onClose={() => {
          setAssignTarget(null);
          setSelectedWoredaIds([]);
        }}
        title="Assign Woredas"
      >
        <div className="space-y-3">
          <p className="text-xs text-[rgba(232,244,240,0.6)]">
            Select one or multiple woredas for{" "}
            {assignTarget?.fullName || "this officer"}.
          </p>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-[rgba(29,158,117,0.12)] p-3 space-y-2">
            {woredas.map((woreda) => {
              const checked = selectedWoredaIds.includes(woreda.id);
              return (
                <label
                  key={woreda.id}
                  className="flex items-center gap-2 text-xs text-[rgba(232,244,240,0.75)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWoredaSelection(woreda.id)}
                  />
                  <span>{woreda.name}</span>
                </label>
              );
            })}
            {!woredas.length && (
              <p className="text-[10px] text-[rgba(232,244,240,0.4)]">
                No woredas found under this subcity.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAssignWoredas}
            disabled={assignLoading}
            className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 text-sm"
          >
            {assignLoading ? "Saving..." : "Save Woreda Assignments"}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Woreda Billing Officer"
      >
        <SubcityOfficerForm
          onSubmit={handleEdit}
          defaultValues={editTarget}
          loading={loading}
        />
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Delete Woreda Billing Officer"
        message={`Delete ${deleteTarget?.fullName || "this billing officer"}? This action cannot be undone.`}
      />

      <ConfirmModal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        loading={loading}
        title={
          statusTarget?.status === "SUSPENDED"
            ? "Activate Woreda Billing Officer"
            : "Suspend Woreda Billing Officer"
        }
        message={`${statusTarget?.status === "SUSPENDED" ? "Activate" : "Suspend"} ${statusTarget?.fullName || "this billing officer"}?`}
      />
    </div>
  );
}
