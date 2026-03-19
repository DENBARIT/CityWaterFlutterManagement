"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 6;

function normalizeUser(u) {
  const meterFromList = Array.isArray(u.meters) ? u.meters[0] || null : null;

  return {
    ...u,
    meter: u.meter || meterFromList,
    paymentFlag: u.paymentFlag || "NONE",
  };
}

function normalizeRows(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.users)) {
    return response.users;
  }

  return [];
}

function csvEscape(value) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function useUsers({
  subcityId = "",
  woredaId = "",
  source = "super-admin",
} = {}) {
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFlag, setFilterFlag] = useState("");
  const [page, setPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState("");

  const loadUsers = useCallback(async () => {
    const useSubcityEndpoints = source === "subcity" && Boolean(subcityId);
    let response;

    if (useSubcityEndpoints) {
      response = woredaId
        ? await superAdminService.getSubcityUsersByWoreda(woredaId)
        : await superAdminService.getSubcityUsers();
    } else {
      const hasLocationFilter = Boolean(subcityId || woredaId);
      response = hasLocationFilter
        ? await superAdminService.getUsersByLocation({
            subCityId: subcityId,
            woredaId,
          })
        : await superAdminService.getAllUsers();
    }

    const rows = normalizeRows(response);

    const normalized = rows.map(normalizeUser);
    setAllUsers(normalized);
  }, [subcityId, woredaId, source]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadUsers]);

  const filtered = useMemo(() => {
    return allUsers.filter((u) => {
      const meterNumber = u.meter?.meterNumber || "";
      const matchSearch =
        !search ||
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        meterNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || u.status === filterStatus;
      const matchFlag = !filterFlag || u.paymentFlag === filterFlag;
      return matchSearch && matchStatus && matchFlag;
    });
  }, [allUsers, search, filterStatus, filterFlag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "National ID",
      "Subcity",
      "Woreda",
      "Meter",
      "Status",
      "Payment Flag",
      "Email Verified",
      "Created",
    ];
    const rows = filtered.map((u) => [
      u.fullName,
      u.email,
      u.phoneE164,
      u.nationalId,
      u.subCity?.name,
      u.woreda?.name,
      u.meter?.meterNumber ?? "No Meter",
      u.status,
      u.paymentFlag,
      u.emailVerified ? "Yes" : "No",
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateUserStatus = useCallback(
    async (id, status) => {
      setUpdatingUserId(id);
      try {
        await superAdminService.updateUserStatus(id, status);
        await loadUsers();
      } finally {
        setUpdatingUserId("");
      }
    },
    [loadUsers],
  );

  return {
    users: paginated,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterFlag,
    setFilterFlag,
    exportCSV,
    totalCount: filtered.length,
    allUsers,
    reloadUsers: loadUsers,
    updatingUserId,
    updateUserStatus,
  };
}
