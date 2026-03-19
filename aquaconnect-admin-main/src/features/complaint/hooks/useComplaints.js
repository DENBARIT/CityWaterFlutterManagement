"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 5;
const STATUSES = ["OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"];

export function useComplaints({
  assignedOnly = false,
  statusFilter = "",
  scopeSubCityId = "",
  scopeWoredaId = "",
} = {}) {
  const jwtPayload = getJwtPayload() || {};
  const role = String(jwtPayload?.role || "").toUpperCase();
  const canUpdateStatus =
    role === "WOREDA_COMPLAINT_OFFICER" || role === "SUBCITY_COMPLAINT_OFFICER";

  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(statusFilter);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterWoredaId, setFilterWoredaId] = useState("");
  const [page, setPage] = useState(1);
  const [updateTarget, setUpdateTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [currentOfficerId] = useState(() => getJwtPayload()?.userId || "");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await superAdminService.getComplaints({
        status: filterStatus,
        category: filterCategory,
        woredaId: scopeWoredaId || filterWoredaId,
        assignedToId: assignedOnly ? currentOfficerId : "",
        subCityId: scopeSubCityId,
      });
      setComplaints(Array.isArray(rows) ? rows : []);
    } catch (_error) {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [
    assignedOnly,
    currentOfficerId,
    filterStatus,
    filterCategory,
    filterWoredaId,
    scopeSubCityId,
    scopeWoredaId,
  ]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadComplaints();
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadComplaints]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        !search ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.submittedBy?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || c.status === filterStatus;
      const matchCategory = !filterCategory || c.category === filterCategory;
      const matchWoreda = !filterWoredaId || c.woreda?.id === filterWoredaId;
      const matchAssigned =
        !assignedOnly || c.assignedTo?.id === currentOfficerId;
      return (
        matchSearch &&
        matchStatus &&
        matchCategory &&
        matchWoreda &&
        matchAssigned
      );
    });
  }, [
    complaints,
    search,
    filterStatus,
    filterCategory,
    filterWoredaId,
    assignedOnly,
    currentOfficerId,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateStatus = async (id, status) => {
    setActionError("");

    if (!canUpdateStatus) {
      const message =
        "You are not allowed to update complaint status from this account.";
      setActionError(message);
      return { ok: false, message };
    }

    setLoading(true);
    try {
      await superAdminService.updateComplaintStatus(id, status);
      await loadComplaints();
      setUpdateTarget(null);
      return { ok: true, message: "Complaint status updated." };
    } catch (error) {
      if (error?.status === 403) {
        const message =
          "Forbidden: your role cannot update complaint status. Please use a woreda complaint officer account.";
        setActionError(message);
        return { ok: false, message };
      } else {
        const message =
          error?.message || "Unable to update complaint status right now.";
        setActionError(message);
        return { ok: false, message };
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    complaints: paginated,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterWoredaId,
    setFilterWoredaId,
    loading,
    actionError,
    setActionError,
    canUpdateStatus,
    updateTarget,
    setUpdateTarget,
    updateStatus,
    reloadComplaints: loadComplaints,
    totalCount: filtered.length,
    allComplaints: complaints,
    newAssignedCount: complaints.filter(
      (c) =>
        ["OPEN", "ESCALATED"].includes(c.status) &&
        c.assignedTo?.id === currentOfficerId,
    ).length,
    STATUSES,
  };
}
