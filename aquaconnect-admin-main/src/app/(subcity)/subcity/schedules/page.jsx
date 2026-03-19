"use client";

import { useEffect, useState } from "react";
import { useSchedules } from "@/features/subcity-admins/subcity/hooks/useSchedules";
import ScheduleTable from "@/features/subcity-admins/subcity/components/scheduleTable";
import ScheduleForm from "@/features/subcity-admins/subcity/components/scheduleForm";
import Pagination from "@/features/subcity-admins/components/Pagination";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { apiRequest, getJwtPayload } from "@/services/apiClient";

const DAYS = [
  "",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function SchedulesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [woredas, setWoredas] = useState([]);
  const subCityId = getJwtPayload()?.subCityId || "";

  useEffect(() => {
    const loadWoredas = async () => {
      if (!subCityId) {
        setWoredas([]);
        return;
      }

      const result = await apiRequest("/locations/woredas", {
        query: { subCityId },
      });
      setWoredas(result?.data || []);
    };

    loadWoredas();
  }, [subCityId]);

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    window.addEventListener("subcity:schedules-open-create", openCreate);
    return () => {
      window.removeEventListener("subcity:schedules-open-create", openCreate);
    };
  }, []);

  const {
    schedules,
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
    totalCount,
  } = useSchedules();

  const handleCreate = async (data) => {
    await createSchedule(data);
    setCreateOpen(false);
  };
  const handleUpdate = async (data) => {
    await updateSchedule(editTarget.id, data);
    setEditTarget(null);
  };
  const handleDelete = async () => {
    await deleteSchedule(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="text-[#e8f4f0]">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["Total Schedules", totalCount, "across all woredas"],
          [
            "Woredas Covered",
            new Set(schedules.map((s) => s.woreda?.id)).size,
            "with schedules",
          ],
          [
            "Days Scheduled",
            new Set(schedules.map((s) => s.day)).size,
            "days of the week",
          ],
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
              Water Distribution Schedules
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {totalCount} schedules found
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 border-b border-[rgba(29,158,117,0.06)]">
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
            value={filterDay}
            onChange={(e) => {
              setFilterDay(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d ? d.charAt(0) + d.slice(1).toLowerCase() : "All Days"}
              </option>
            ))}
          </select>
          {(filterWoreda || filterDay) && (
            <button
              onClick={() => {
                setFilterWoreda("");
                setFilterDay("");
                setPage(1);
              }}
              className="text-[10px] text-[rgba(232,244,240,0.3)] hover:text-[#E24B4A] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          <ScheduleTable
            schedules={schedules}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
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
        title="Add Flexible Schedule"
      >
        <ScheduleForm
          onSubmit={handleCreate}
          loading={loading}
          woredas={woredas}
        />
      </Modal>
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Schedule"
      >
        <ScheduleForm
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
        loading={loading}
        title="Delete Schedule"
        message={`Delete the ${deleteTarget?.day?.toLowerCase()} schedule for ${deleteTarget?.woreda?.name}? This cannot be undone.`}
      />
    </div>
  );
}
