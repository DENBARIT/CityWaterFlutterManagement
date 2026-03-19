"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const DAYS_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const PAGE_SIZE = 5;

export function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [filterWoreda, setFilterWoreda] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const subCityId = getJwtPayload()?.subCityId || "";

  const loadSchedules = useCallback(async () => {
    if (!subCityId) {
      setSchedules([]);
      return;
    }

    setLoading(true);
    try {
      const rows = await superAdminService.getSchedules({
        subCityId,
        woredaId: filterWoreda,
        day: filterDay,
      });
      setSchedules(Array.isArray(rows) ? rows : []);
    } finally {
      setLoading(false);
    }
  }, [filterWoreda, filterDay, subCityId]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadSchedules();
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadSchedules]);

  const filtered = useMemo(() => {
    return schedules
      .filter((s) => {
        const matchWoreda = !filterWoreda || s.woreda?.id === filterWoreda;
        const matchDay = !filterDay || s.day === filterDay;
        return matchWoreda && matchDay;
      })
      .sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day));
  }, [schedules, filterWoreda, filterDay]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createSchedule = async (data) => {
    setLoading(true);
    try {
      await superAdminService.createSchedule({ ...data, subCityId });
      await loadSchedules();
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (id, data) => {
    setLoading(true);
    try {
      await superAdminService.updateSchedule(id, { ...data, subCityId });
      await loadSchedules();
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id) => {
    setLoading(true);
    try {
      await superAdminService.deleteSchedule(id);
      await loadSchedules();
    } finally {
      setLoading(false);
    }
  };

  return {
    schedules: paginated,
    totalPages,
    page,
    setPage,
    filterWoreda,
    setFilterWoreda,
    filterDay,
    setFilterDay,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    totalCount: filtered.length,
  };
}
