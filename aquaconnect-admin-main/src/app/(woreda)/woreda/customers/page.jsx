"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UsersTable from "@/features/users/components/UsersTable";
import Pagination from "@/features/subcity-admins/components/Pagination";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";

const PAGE_SIZE = 6;
const STATUSES = ["", "ACTIVE", "INACTIVE", "SUSPENDED"];
const FLAGS = ["", "NONE", "WARNING", "CRITICAL", "LEGAL_ACTION"];

function toPaymentFlag(userId, bills) {
  const mine = bills.filter((b) => b.customer?.id === userId);
  const overdue = mine.filter((b) => b.status === "OVERDUE").length;
  const unpaid = mine.filter((b) => b.status === "UNPAID").length;

  if (overdue > 0) return "LEGAL_ACTION";
  if (unpaid >= 2) return "CRITICAL";
  if (unpaid === 1) return "WARNING";
  return "NONE";
}

export default function WoredaCustomersPage() {
  const [users, setUsers] = useState([]);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFlag, setFilterFlag] = useState("");
  const [page, setPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneE164: "",
    nationalId: "",
  });

  const woredaId = getJwtPayload()?.woredaId || "";

  const loadData = useCallback(async () => {
    const [usersRows, billsRows] = await Promise.all([
      superAdminService.getUsersByLocation({ woredaId }),
      superAdminService.getBills({ woredaId }),
    ]);

    setUsers(Array.isArray(usersRows) ? usersRows : []);
    setBills(Array.isArray(billsRows) ? billsRows : []);
  }, [woredaId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleStatus = async (userId, status) => {
    setUpdatingUserId(userId);
    try {
      await superAdminService.updateUserStatus(userId, status);
      await loadData();
    } finally {
      setUpdatingUserId("");
    }
  };

  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phoneE164: user.phoneE164 || "",
      nationalId: user.nationalId || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget?.id) {
      return;
    }

    setUpdatingUserId(editTarget.id);
    try {
      await superAdminService.updateAdmin(editTarget.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phoneE164: editForm.phoneE164.trim(),
        nationalId: editForm.nationalId.trim(),
      });
      setEditTarget(null);
      await loadData();
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    setDeletingUserId(deleteTarget.id);
    try {
      await superAdminService.deleteAdmin(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } finally {
      setDeletingUserId("");
    }
  };

  const normalizedUsers = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        meter: Array.isArray(u.meters) ? u.meters[0] || null : null,
        paymentFlag: toPaymentFlag(u.id, bills),
      })),
    [users, bills],
  );

  const filtered = useMemo(() => {
    return normalizedUsers.filter((u) => {
      const matchSearch =
        !search ||
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        (u.meter?.meterNumber || "")
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || u.status === filterStatus;
      const matchFlag = !filterFlag || u.paymentFlag === filterFlag;
      return matchSearch && matchStatus && matchFlag;
    });
  }, [normalizedUsers, search, filterStatus, filterFlag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "National ID",
      "Meter",
      "Status",
      "Payment Flag",
      "Verified",
    ];
    const rows = filtered.map((u) => [
      u.fullName,
      u.email,
      u.phoneE164,
      u.nationalId,
      u.meter?.meterNumber ?? "No Meter",
      u.status,
      u.paymentFlag,
      u.emailVerified ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "woreda-customers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: normalizedUsers.length,
    active: normalizedUsers.filter((u) => u.status === "ACTIVE").length,
    flagged: normalizedUsers.filter((u) => u.paymentFlag !== "NONE").length,
    escalated: normalizedUsers.filter((u) => u.paymentFlag === "LEGAL_ACTION")
      .length,
  };

  return (
    <div className="text-[#e8f4f0]">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ["Total", stats.total, "customers in woreda"],
          ["Active", stats.active, "currently active"],
          ["Flagged", stats.flagged, "payment issues"],
          ["Escalated", stats.escalated, "legal action"],
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Woreda Customers
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {filtered.length} customers found
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-xs border border-[rgba(29,158,117,0.15)] text-[rgba(232,244,240,0.5)] hover:text-[#1D9E75] hover:border-[rgba(29,158,117,0.35)] transition-all"
          >
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 border-b border-[rgba(29,158,117,0.06)] flex-wrap">
          <div className="relative flex-1 min-w-50 max-w-xs">
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
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || "All Statuses"}
              </option>
            ))}
          </select>
          <select
            value={filterFlag}
            onChange={(e) => {
              setFilterFlag(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all"
          >
            {FLAGS.map((f) => (
              <option key={f} value={f}>
                {f || "All Payment Flags"}
              </option>
            ))}
          </select>
          {(search || filterStatus || filterFlag) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("");
                setFilterFlag("");
                setPage(1);
              }}
              className="text-[10px] text-[rgba(232,244,240,0.3)] hover:text-[#E24B4A] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          <UsersTable
            users={paginated}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onToggleStatus={handleToggleStatus}
            updatingUserId={updatingUserId}
            deletingUserId={deletingUserId}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Customer"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3">
          <Input
            placeholder="Full name"
            value={editForm.fullName}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />
          <Input
            placeholder="Phone (+251...)"
            value={editForm.phoneE164}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, phoneE164: e.target.value }))
            }
            required
          />
          <Input
            placeholder="National ID"
            value={editForm.nationalId}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, nationalId: e.target.value }))
            }
            required
          />
          <button
            type="submit"
            disabled={updatingUserId === editTarget?.id}
            className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 text-sm"
          >
            {updatingUserId === editTarget?.id ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deletingUserId === deleteTarget?.id}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deleteTarget?.fullName || "this customer"}? This action cannot be undone.`}
      />
    </div>
  );
}
