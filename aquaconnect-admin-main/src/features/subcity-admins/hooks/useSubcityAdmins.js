"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const PAGE_SIZE = 5;

export function useSubcityAdmins() {
  const [admins, setAdmins] = useState([]);
  const [subcities, setSubcities] = useState([]);
  const [search, setSearch] = useState("");
  const [filterSubcity, setFilterSubcity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAdmins = useCallback(async () => {
    const adminsResult = await superAdminService.searchAdmins({
      role: "SUBCITY_ADMIN",
    });
    setAdmins(Array.isArray(adminsResult) ? adminsResult : []);
  }, []);

  const loadSubcities = useCallback(async () => {
    const subcitiesResult = await apiRequest("/locations/sub-cities");
    const rows = Array.isArray(subcitiesResult?.data)
      ? subcitiesResult.data
      : Array.isArray(subcitiesResult)
        ? subcitiesResult
        : [];
    setSubcities(rows);
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadSubcities(), loadAdmins()]);
    } catch (err) {
      setError(err?.message || "Failed to load subcity admins.");
    } finally {
      setLoading(false);
    }
  }, [loadAdmins, loadSubcities]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      const matchSearch =
        !search ||
        a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase());
      const matchSubcity = !filterSubcity || a.subCityId === filterSubcity;
      const matchStatus = !filterStatus || a.status === filterStatus;
      return matchSearch && matchSubcity && matchStatus;
    });
  }, [admins, search, filterSubcity, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createAdmin = async (data) => {
    setLoading(true);
    setError("");
    try {
      const normalizedPayload = {
        fullName: String(data.fullName || "")
          .trim()
          .replace(/\s+/g, " "),
        email: String(data.email || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ""),
        phoneNumber: String(data.phoneNumber || "").replace(/\s+/g, ""),
        nationalId: String(data.nationalId || "")
          .replace(/\D/g, "")
          .slice(0, 12),
      };

      await superAdminService.createAdmin({
        fullName: normalizedPayload.fullName,
        email: normalizedPayload.email,
        phone: normalizedPayload.phoneNumber,
        phoneE164: normalizedPayload.phoneNumber,
        nationalId: normalizedPayload.nationalId,
        password: String(data.password || "").replace(/\s+/g, ""),
        role: "SUBCITY_ADMIN",
        subCityId: data.subcityId,
      });
      await loadAdmins();
    } catch (err) {
      const message = err?.message || "Failed to create subcity admin.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAdmin = async (id, data) => {
    setLoading(true);
    setError("");
    try {
      const normalizedPayload = {
        fullName: String(data.fullName || "")
          .trim()
          .replace(/\s+/g, " "),
        email: String(data.email || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ""),
        phoneNumber: String(data.phoneNumber || "").replace(/\s+/g, ""),
        nationalId: String(data.nationalId || "")
          .replace(/\D/g, "")
          .slice(0, 12),
      };

      await superAdminService.updateAdmin(id, {
        fullName: normalizedPayload.fullName,
        email: normalizedPayload.email,
        phoneE164: normalizedPayload.phoneNumber,
        nationalId: normalizedPayload.nationalId,
        subCityId: data.subcityId,
      });
      await loadAdmins();
    } catch (err) {
      const message = err?.message || "Failed to update subcity admin.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (id) => {
    setLoading(true);
    setError("");
    try {
      await superAdminService.deleteAdmin(id);
      await loadAdmins();
    } catch (err) {
      const message = err?.message || "Failed to delete subcity admin.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAdminStatus = async (id, status) => {
    setLoading(true);
    setError("");
    try {
      await superAdminService.updateAdmin(id, { status });
      await loadAdmins();
    } catch (err) {
      const message = err?.message || "Failed to update subcity admin status.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone Number",
      "National ID",
      "Subcity",
      "Status",
      "Created At",
    ];
    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = admins.map((a) => {
      const phone = a.phoneE164 || a.phone || a.phoneNumber || "";
      const nationalId = a.nationalId || a.nationalID || "";
      const createdAt = a.createdAt
        ? new Date(a.createdAt).toLocaleString()
        : "";

      return [
        a.fullName || "",
        a.email || "",
        phone,
        nationalId,
        a.subCity?.name || "",
        a.status || "",
        createdAt,
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "subcity-admins.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    admins: paginated,
    allAdmins: filtered,
    subcities,
    totalPages,
    page,
    setPage,
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
    totalCount: filtered.length,
  };
}
