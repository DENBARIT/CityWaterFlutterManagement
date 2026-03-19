"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 5;

export function useWoredaAdmins() {
  const [admins, setAdmins] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [search, setSearch] = useState("");
  const [filterWoreda, setFilterWoreda] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const subCityId = getJwtPayload()?.subCityId || "";

  const loadBaseData = useCallback(async () => {
    if (!subCityId) {
      setWoredas([]);
      setAdmins([]);
      return;
    }

    setLoading(true);
    try {
      const [woredasResult, adminsResult] = await Promise.all([
        superAdminService.getWoredas(subCityId),
        superAdminService.searchAdmins({ role: "WOREDA_ADMINS", subCityId }),
      ]);

      setWoredas(Array.isArray(woredasResult?.data) ? woredasResult.data : []);
      setAdmins(Array.isArray(adminsResult) ? adminsResult : []);
    } finally {
      setLoading(false);
    }
  }, [subCityId]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      const matchSearch =
        !search ||
        a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase());
      const matchWoreda = !filterWoreda || a.woredaId === filterWoreda;
      const matchStatus = !filterStatus || a.status === filterStatus;
      return matchSearch && matchWoreda && matchStatus;
    });
  }, [admins, search, filterWoreda, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createAdmin = async (data) => {
    setLoading(true);
    try {
      await superAdminService.createAdmin({
        fullName: data.fullName,
        email: data.email,
        phone: data.phoneNumber,
        nationalId: data.nationalId,
        password: data.password,
        role: "WOREDA_ADMINS",
        woredaId: data.woredaId,
        subCityId,
      });
      await loadBaseData();
    } finally {
      setLoading(false);
    }
  };

  const updateAdmin = async (id, data) => {
    setLoading(true);
    try {
      await superAdminService.updateAdmin(id, {
        fullName: data.fullName,
        email: data.email,
        phoneE164: data.phoneNumber || data.phoneE164,
        nationalId: data.nationalId,
        woredaId: data.woredaId,
        status: data.status,
      });
      await loadBaseData();
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (id) => {
    setLoading(true);
    try {
      await superAdminService.deleteAdmin(id);
      await loadBaseData();
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "National ID",
      "Woreda",
      "Status",
      "Created",
    ];
    const rows = filtered.map((a) => [
      a.fullName,
      a.email,
      a.phoneE164,
      a.nationalId,
      a.woreda?.name,
      a.status,
      new Date(a.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "woreda-admins.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    admins: paginated,
    allAdmins: filtered,
    woredas,
    totalPages,
    page,
    setPage,
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
    totalCount: filtered.length,
  };
}
