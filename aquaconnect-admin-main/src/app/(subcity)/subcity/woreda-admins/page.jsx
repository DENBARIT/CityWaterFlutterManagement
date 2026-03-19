"use client";

import { useEffect, useState } from "react";
import { useWoredaAdmins } from "@/features/subcity-admins/subcity/hooks/useWoredaAdmins";
import WoredaAdminTable from "@/features/subcity-admins/subcity/components/woredaAdminTable";
import WoredaAdminForm from "@/features/subcity-admins/subcity/components/woredaAdminForm";
import Pagination from "@/features/subcity-admins/components/Pagination";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

const STATUSES = ["", "ACTIVE", "SUSPENDED"];

export default function WoredaAdminsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  useEffect(() => {
    const openCreateModal = () => setCreateOpen(true);
    window.addEventListener(
      "subcity:woreda-admins-open-create",
      openCreateModal,
    );
    return () =>
      window.removeEventListener(
        "subcity:woreda-admins-open-create",
        openCreateModal,
      );
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

  const {
    admins,
    totalPages,
    page,
    setPage,
    allAdmins,
    woredas,
    search,
    setSearch,
    filterWoreda,
    setFilterWoreda,
    filterStatus,
    setFilterStatus,
    loading,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    exportCSV,
    totalCount,
  } = useWoredaAdmins();

  const handleCreate = async (data) => {
    try {
      await createAdmin(data);
      setCreateOpen(false);
      setActionToast({
        type: "success",
        text: "woreda admin created successfully",
      });
    } catch (err) {
      setActionToast({
        type: "error",
        text: err?.message || "unable to create woreda admin",
      });
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateAdmin(editTarget.id, data);
      setEditTarget(null);
      setActionToast({
        type: "success",
        text: "woreda admin updated successfully",
      });
    } catch (err) {
      setActionToast({
        type: "error",
        text: err?.message || "unable to update woreda admin",
      });
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteAdmin(deleteTarget.id);
      setDeleteTarget(null);
      setActionToast({
        type: "success",
        text: "woreda admin deleted successfully",
      });
    } catch (err) {
      setActionToast({
        type: "error",
        text: err?.message || "unable to delete woreda admin",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) {
      return;
    }

    try {
      await updateAdmin(statusTarget.id, {
        fullName: statusTarget.fullName,
        email: statusTarget.email,
        phoneNumber: statusTarget.phoneE164,
        nationalId: statusTarget.nationalId,
        woredaId: statusTarget.woreda?.id || statusTarget.woredaId,
        status: statusTarget.nextStatus,
      });

      setStatusTarget(null);
      setActionToast({
        type: "success",
        text:
          statusTarget.nextStatus === "ACTIVE"
            ? "woreda admin activated successfully"
            : "woreda admin suspended successfully",
      });
    } catch (err) {
      setActionToast({
        type: "error",
        text: err?.message || "unable to update woreda admin status",
      });
    }
  };

  return (
    <div className="text-[#e8f4f0]">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["Total Admins", allAdmins.length, "under your subcity"],
          [
            "Active",
            allAdmins.filter((a) => a.status === "ACTIVE").length,
            "currently active",
          ],
          ["Woredas", woredas.length, "woredas covered"],
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

      {/* Main Card */}
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Woreda Admins
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {totalCount} admins found
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
              placeholder="Search by name or email..."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl pl-8 pr-4 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </div>
          <select
            value={filterWoreda}
            onChange={(e) => {
              setFilterWoreda(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
          >
            <option value="">All Woredas</option>
            {woredas.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
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
          {(search || filterWoreda || filterStatus) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterWoreda("");
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
          <WoredaAdminTable
            admins={admins}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
            onToggleStatus={(admin, nextStatus) =>
              setStatusTarget({ ...admin, nextStatus })
            }
          />
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
        title="Add Woreda Admin"
      >
        <WoredaAdminForm
          onSubmit={handleCreate}
          loading={loading}
          woredas={woredas}
        />
      </Modal>
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Woreda Admin"
      >
        <WoredaAdminForm
          onSubmit={handleUpdate}
          defaultValues={editTarget}
          loading={loading}
          woredas={woredas}
        />
      </Modal>
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Woreda Admin"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action cannot be undone.`}
      />

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={
          statusTarget?.nextStatus === "ACTIVE"
            ? "Activate Woreda Admin"
            : "Suspend Woreda Admin"
        }
      >
        <p className="text-sm text-[rgba(232,244,240,0.55)] font-light leading-relaxed mb-6">
          {statusTarget?.nextStatus === "ACTIVE"
            ? `Are you sure you want to activate ${statusTarget?.fullName}?`
            : `Are you sure you want to suspend ${statusTarget?.fullName}?`}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setStatusTarget(null)}
            className="px-5 py-2 rounded-xl text-xs border border-[rgba(232,244,240,0.1)] text-[rgba(232,244,240,0.5)] hover:text-[#e8f4f0] hover:border-[rgba(232,244,240,0.2)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleStatusChange}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-xs transition-all disabled:opacity-50 ${
              statusTarget?.nextStatus === "ACTIVE"
                ? "bg-[rgba(29,158,117,0.15)] border border-[rgba(29,158,117,0.3)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.25)]"
                : "bg-[rgba(226,75,74,0.15)] border border-[rgba(226,75,74,0.3)] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.25)]"
            }`}
          >
            {loading
              ? statusTarget?.nextStatus === "ACTIVE"
                ? "Activating..."
                : "Suspending..."
              : statusTarget?.nextStatus === "ACTIVE"
                ? "Activate"
                : "Suspend"}
          </button>
        </div>
      </Modal>

      {actionToast && (
        <div className="fixed bottom-6 right-6 z-90 max-w-xs">
          <div
            className={`px-4 py-3 rounded-xl border text-xs shadow-lg ${
              actionToast.type === "success"
                ? "bg-[rgba(29,158,117,0.16)] border-[rgba(29,158,117,0.4)] text-[#8be3c8]"
                : "bg-[rgba(226,75,74,0.16)] border-[rgba(226,75,74,0.4)] text-[#ffb8b7]"
            }`}
          >
            {actionToast.text}
          </div>
        </div>
      )}
    </div>
  );
}
