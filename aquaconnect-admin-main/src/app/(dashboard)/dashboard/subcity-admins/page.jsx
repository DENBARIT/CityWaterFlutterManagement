"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubcityAdmins } from "@/features/subcity-admins/hooks/useSubcityAdmins";
import SubcityAdminTable from "@/features/subcity-admins/components/SubcityAdminTable";
import SubcityAdminForm from "@/features/subcity-admins/components/SubcityAdminForm";
import Pagination from "@/features/subcity-admins/components/Pagination";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

const STATUSES = ["", "ACTIVE", "SUSPENDED"];

export default function SubcityAdminsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [actionToast, setActionToast] = useState(null);

  const showToast = (type, text) => {
    setActionToast({ type, text });
  };

  const handleInactiveOrDeletedSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    showToast(
      "error",
      "Your session is inactive or deleted. Please sign in again.",
    );
    setTimeout(() => {
      router.push("/login");
    }, 800);
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
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const {
    admins,
    totalPages,
    page,
    setPage,
    subcities,
    search,
    setSearch,
    filterSubcity,
    setFilterSubcity,
    filterStatus,
    setFilterStatus,
    loading,
    error,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    updateAdminStatus,
    exportCSV,
  } = useSubcityAdmins();

  const handleCreate = async (data) => {
    try {
      await createAdmin(data);
      setCreateOpen(false);
      showToast("success", "Subcity admin created successfully.");
    } catch (_err) {
      const message = String(_err?.message || "").toLowerCase();
      if (
        message.includes("already") ||
        message.includes("exists") ||
        message.includes("duplicate") ||
        message.includes("unique")
      ) {
        showToast("error", "User already exists.");
      } else if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
      } else if (
        message.includes("unauthorized") ||
        message.includes("invalid token") ||
        message.includes("forbidden")
      ) {
        showToast(
          "error",
          "You are not authorized to manage subcity admins. Please sign in again with a super admin account.",
        );
      } else {
        showToast("error", _err?.message || "Unable to create subcity admin.");
      }
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateAdmin(editTarget.id, data);
      setEditTarget(null);
      showToast("success", "Subcity admin updated successfully.");
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
      } else {
        showToast("error", err?.message || "Unable to update subcity admin.");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAdmin(deleteTarget.id);
      setDeleteTarget(null);
      showToast("success", "Subcity admin deleted successfully.");
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
      } else {
        showToast("error", err?.message || "Unable to delete subcity admin.");
      }
    }
  };

  const handleStatusChange = (admin, status) => {
    setStatusTarget({ admin, status });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget?.admin?.id || !statusTarget?.status) {
      setStatusTarget(null);
      return;
    }

    try {
      await updateAdminStatus(statusTarget.admin.id, statusTarget.status);
      setStatusTarget(null);
      showToast(
        "success",
        `${statusTarget.admin.fullName} is now ${statusTarget.status.toLowerCase()}.`,
      );
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
      } else {
        setStatusTarget(null);
        showToast("error", err?.message || "Unable to update admin status.");
      }
    }
  };

  const FIELD_TOAST_LABELS = {
    fullName: "full name",
    email: "email address",
    phoneNumber: "phone number",
    nationalId: "national ID",
    password: "password",
    confirmPassword: "confirm password",
    subcityId: "subcity",
  };

  const handleValidationToast = (errors) => {
    const [firstField] = Object.keys(errors || {});
    if (!firstField) {
      return;
    }

    const fieldLabel = FIELD_TOAST_LABELS[firstField] || "form";
    const fieldMessage = errors?.[firstField]?.message;

    showToast("error", fieldMessage || `Please provide a valid ${fieldLabel}.`);
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

      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-xl text-xs bg-[#1D9E75] text-[#020f1a] font-medium hover:bg-[#5DCAA5] transition-colors"
        >
          + Add Subcity Admin
        </button>
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-3 text-xs text-[#ff9c9b]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Subcity Admins
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-0.5">
              Manage subcity-level administrators
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-xl text-xs border border-[rgba(29,158,117,0.15)] text-[rgba(232,244,240,0.5)] hover:text-[#1D9E75] hover:border-[rgba(29,158,117,0.35)] transition-all"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
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
              placeholder="Search by name or email..."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl pl-8 pr-4 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </div>
          <select
            value={filterSubcity}
            onChange={(e) => {
              setFilterSubcity(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
          >
            <option value="">All Subcities</option>
            {subcities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
          {(search || filterSubcity || filterStatus) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterSubcity("");
                setFilterStatus("");
                setPage(1);
              }}
              className="text-[10px] text-[rgba(232,244,240,0.3)] hover:text-[#E24B4A] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          {loading && !admins.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.5)]">
              Loading subcity admins...
            </p>
          ) : (
            <SubcityAdminTable
              admins={admins}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onStatusChange={handleStatusChange}
            />
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Subcity Admin"
      >
        <SubcityAdminForm
          key={createOpen ? "create-open" : "create-closed"}
          onSubmit={handleCreate}
          onValidationError={handleValidationToast}
          loading={loading}
          subcities={subcities}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Subcity Admin"
      >
        <SubcityAdminForm
          onSubmit={handleUpdate}
          onValidationError={handleValidationToast}
          defaultValues={editTarget}
          loading={loading}
          subcities={subcities}
        />
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Delete Subcity Admin"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action cannot be undone.`}
      />

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={`${statusTarget?.status === "SUSPENDED" ? "Suspend" : "Activate"} Subcity Admin`}
      >
        <p className="text-sm text-[rgba(232,244,240,0.55)] font-light leading-relaxed mb-6">
          {`Are you sure you want to ${String(statusTarget?.status || "").toLowerCase()} ${statusTarget?.admin?.fullName || "this admin"}?`}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setStatusTarget(null)}
            className="px-5 py-2 rounded-xl text-xs border border-[rgba(232,244,240,0.1)] text-[rgba(232,244,240,0.5)] hover:text-[#e8f4f0] hover:border-[rgba(232,244,240,0.2)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmStatusChange}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs bg-[rgba(29,158,117,0.15)] border border-[rgba(29,158,117,0.35)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.25)] transition-all disabled:opacity-50"
          >
            {loading
              ? `${statusTarget?.status === "SUSPENDED" ? "Suspending" : "Activating"}...`
              : statusTarget?.status === "SUSPENDED"
                ? "Suspend"
                : "Activate"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
