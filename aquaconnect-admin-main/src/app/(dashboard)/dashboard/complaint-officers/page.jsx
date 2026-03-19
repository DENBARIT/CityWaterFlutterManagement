"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import SubcityOfficerForm from "@/features/subcity-admins/subcity/components/SubcityOfficerForm";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function ComplaintOfficersPage() {
  const [complaintOfficers, setComplaintOfficers] = useState([]);
  const [subcities, setSubcities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [actionToast, setActionToast] = useState(null);

  const subcityNameById = useMemo(() => {
    const map = new Map();
    subcities.forEach((subcity) => map.set(subcity.id, subcity.name));
    return map;
  }, [subcities]);

  const normalizeOfficers = (payload) => {
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return rows.map((row) => {
      const base = row?.user && typeof row.user === "object" ? row.user : row;
      const resolvedStatus =
        base?.status ||
        row?.status ||
        (row?.isActive === false ? "SUSPENDED" : "ACTIVE");

      return {
        id: base?.id || row?.id,
        fullName: base?.fullName || row?.fullName || "",
        email: base?.email || row?.email || "",
        phoneE164: base?.phoneE164 || row?.phoneE164 || "",
        nationalId: base?.nationalId || row?.nationalId || "",
        status: resolvedStatus,
        createdAt: base?.createdAt || row?.createdAt || null,
        subCityId:
          base?.subCityId || row?.subCityId || row?.subCity?.id || null,
        subCity: base?.subCity || row?.subCity || null,
      };
    });
  };

  const showToast = (type, text) => {
    setActionToast({ type, text });
  };

  const refreshComplaintOfficers = async () => {
    const [subcityRes, complaintRows] = await Promise.all([
      apiRequest("/locations/sub-cities"),
      superAdminService.getComplaintOfficers(),
    ]);

    setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
    setComplaintOfficers(normalizeOfficers(complaintRows));
  };

  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      setLoading(true);
      setError("");

      try {
        const [subcityRes, complaintRows] = await Promise.all([
          apiRequest("/locations/sub-cities"),
          superAdminService.getComplaintOfficers(),
        ]);

        if (!active) {
          return;
        }

        setSubcities(Array.isArray(subcityRes?.data) ? subcityRes.data : []);
        setComplaintOfficers(normalizeOfficers(complaintRows));
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err?.message || "Failed to load complaint officers.");
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

  useEffect(() => {
    if (!actionToast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setActionToast(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [actionToast]);

  const handleValidationToast = (errors) => {
    const [firstField] = Object.keys(errors || {});
    if (!firstField) {
      return;
    }

    const fieldMessage = errors?.[firstField]?.message;
    showToast("error", fieldMessage || "Please complete the form correctly.");
  };

  const formatCreatedAt = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString();
  };

  const handleEdit = async (data) => {
    if (!editTarget) {
      return;
    }

    setMutationLoading(true);

    try {
      await superAdminService.updateSubcityComplaintOfficer(editTarget.id, {
        fullName: data.fullName,
        email: data.email,
        phoneE164: data.phoneNumber,
        nationalId: data.nationalId,
      });

      await refreshComplaintOfficers();
      setEditTarget(null);
      showToast("success", "Complaint officer updated successfully.");
    } catch (err) {
      showToast("error", err?.message || "Unable to update complaint officer.");
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setMutationLoading(true);

    try {
      await superAdminService.deleteSubcityComplaintOfficer(deleteTarget.id);
      await refreshComplaintOfficers();
      setDeleteTarget(null);
      showToast("success", "Complaint officer deleted successfully.");
    } catch (err) {
      showToast("error", err?.message || "Unable to delete complaint officer.");
    } finally {
      setMutationLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) {
      return;
    }

    const nextStatus =
      statusTarget.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

    setMutationLoading(true);

    try {
      await superAdminService.suspendSubcityComplaintOfficer(
        statusTarget.id,
        nextStatus,
      );
      await refreshComplaintOfficers();
      setStatusTarget(null);
      showToast(
        "success",
        `Complaint officer ${nextStatus.toLowerCase()} successfully.`,
      );
    } catch (err) {
      showToast(
        "error",
        err?.message || "Unable to update complaint officer status.",
      );
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <div className="text-[#e8f4f0]">
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

      {error && (
        <div className="mb-3 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-2 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f]">
        <div className="flex items-center justify-between border-b border-[rgba(29,158,117,0.08)] px-6 py-4">
          <div>
            <h2 className="font-syne text-sm font-bold tracking-tight">
              Complaint Officers
            </h2>
            <p className="mt-0.5 text-[10px] text-[rgba(232,244,240,0.3)]">
              {loading
                ? "Loading complaint officers..."
                : `${complaintOfficers.length} officers found`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto px-6 py-4">
          {loading ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              Loading complaint officers...
            </p>
          ) : !complaintOfficers.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              No complaint officers found.
            </p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Name",
                    "Email",
                    "Phone",
                    "Subcity",
                    "Status",
                    "Created",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="pb-3 pr-4 text-left text-[10px] font-medium uppercase tracking-wider text-[rgba(232,244,240,0.3)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaintOfficers.map((officer) => (
                  <tr
                    key={officer.id}
                    className="border-b border-[rgba(29,158,117,0.04)] transition-colors hover:bg-[rgba(29,158,117,0.03)]"
                  >
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                      <div className="font-medium text-[#e8f4f0]">
                        {officer.fullName || "-"}
                      </div>
                      <div className="mt-1 text-[10px] text-[rgba(232,244,240,0.35)]">
                        {officer.nationalId || "No national ID"}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {officer.email || "-"}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {officer.phoneE164 || "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-md bg-[rgba(29,158,117,0.08)] px-2 py-0.5 text-[10px] text-[#1D9E75]">
                        {subcityNameById.get(officer.subCityId) ||
                          officer.subCity?.name ||
                          "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge status={officer.status || "INACTIVE"} />
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.45)]">
                      {formatCreatedAt(officer.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setEditTarget(officer)}
                          className="rounded-lg bg-[rgba(29,158,117,0.08)] px-3 py-1 text-[10px] text-[#1D9E75] transition-colors hover:bg-[rgba(29,158,117,0.18)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setStatusTarget(officer)}
                          className="rounded-lg bg-[rgba(239,159,39,0.12)] px-3 py-1 text-[10px] text-[#EF9F27] transition-colors hover:bg-[rgba(239,159,39,0.22)]"
                        >
                          {officer.status === "SUSPENDED"
                            ? "Activate"
                            : "Suspend"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(officer)}
                          className="rounded-lg bg-[rgba(226,75,74,0.08)] px-3 py-1 text-[10px] text-[#E24B4A] transition-colors hover:bg-[rgba(226,75,74,0.18)]"
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
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Complaint Officer"
      >
        <SubcityOfficerForm
          onSubmit={handleEdit}
          onValidationError={handleValidationToast}
          defaultValues={editTarget}
          loading={mutationLoading}
        />
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={mutationLoading}
        title="Delete Complaint Officer"
        message={`Delete ${deleteTarget?.fullName || "this complaint officer"}? This action cannot be undone.`}
      />

      <ConfirmModal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        loading={mutationLoading}
        title={
          statusTarget?.status === "SUSPENDED"
            ? "Activate Complaint Officer"
            : "Suspend Complaint Officer"
        }
        message={`${statusTarget?.status === "SUSPENDED" ? "Activate" : "Suspend"} ${statusTarget?.fullName || "this complaint officer"}?`}
      />
    </div>
  );
}
