"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { useOfficers } from "@/features/woreda/hooks/useOfficers";
import OfficerTable from "@/features/woreda/components/OfficerTable";
import OfficerForm from "@/features/woreda/components/OfficerForm";
import Pagination from "@/features/subcity-admins/components/Pagination";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  OFFICER_TYPE_OPTIONS,
  getOfficerTypeLabel,
  getOfficerTypeSelectLabel,
} from "@/features/woreda/constants/officerTypes";

const STATUSES = ["", "ACTIVE", "SUSPENDED", "DEACTIVATED"];
const DEDICATED_OFFICER_TYPES = new Set([
  "BILLING_OFFICER",
  "COMPLAINT_OFFICER",
]);

export default function FieldOfficersPage() {
  const woredaId = getJwtPayload()?.woredaId || "unknown";
  const teamStorageKey = `woreda-officer-teams:${woredaId}`;

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamError, setTeamError] = useState("");
  const [actionToast, setActionToast] = useState(null);

  const showToast = (type, text) => {
    setActionToast({ type, text });
  };

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);

    window.addEventListener("woreda:officers-open-create", openCreate);
    return () => {
      window.removeEventListener("woreda:officers-open-create", openCreate);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(teamStorageKey);
      if (!raw) {
        setTeams([]);
        return;
      }

      const parsed = JSON.parse(raw);
      setTeams(Array.isArray(parsed) ? parsed : []);
    } catch (_error) {
      setTeams([]);
    }
  }, [teamStorageKey]);

  useEffect(() => {
    if (!actionToast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setActionToast(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [actionToast]);

  const persistTeams = (nextTeams) => {
    setTeams(nextTeams);
    localStorage.setItem(teamStorageKey, JSON.stringify(nextTeams));
  };

  const {
    officers,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    loading,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    exportCSV,
    totalCount,
    allOfficers,
  } = useOfficers();

  const generalOfficerTypeOptions = useMemo(() => {
    return OFFICER_TYPE_OPTIONS.filter(
      (option) => !DEDICATED_OFFICER_TYPES.has(option.value),
    );
  }, []);

  const typeCounts = useMemo(() => {
    return OFFICER_TYPE_OPTIONS.reduce((acc, item) => {
      acc[item.value] = allOfficers.filter(
        (officer) => officer.fieldOfficerType === item.value,
      ).length;
      return acc;
    }, {});
  }, [allOfficers]);

  const teamMembersById = useMemo(() => {
    return allOfficers.reduce((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [allOfficers]);

  const handleCreate = async (data) => {
    try {
      await createOfficer(data);
      setCreateOpen(false);
      showToast("success", "Field officer created.");
    } catch (error) {
      showToast("error", error?.message || "Field officer creation failed.");
    }
  };
  const handleUpdate = async (data) => {
    try {
      await updateOfficer(editTarget.id, data);
      setEditTarget(null);
      showToast("success", "Field officer updated successfully.");
    } catch (error) {
      showToast("error", error?.message || "Unable to update field officer.");
    }
  };
  const handleDelete = async () => {
    try {
      await deleteOfficer(deleteTarget.id);
      setDeleteTarget(null);
      showToast("success", "Field officer deleted successfully.");
    } catch (error) {
      showToast("error", error?.message || "Unable to delete field officer.");
    }
  };

  const handleSuspendToggle = async (officer) => {
    const nextStatus = officer.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await updateOfficer(officer.id, { status: nextStatus });
      showToast(
        "success",
        `${officer.fullName || "Officer"} is now ${nextStatus.toLowerCase()}.`,
      );
    } catch (error) {
      showToast("error", error?.message || "Unable to update officer status.");
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds((current) => {
      return current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];
    });
  };

  const createTeam = () => {
    const trimmedName = teamName.trim();
    if (!trimmedName) {
      setTeamError("Please provide a team name.");
      return;
    }

    const selectedMembers = allOfficers.filter((officer) =>
      selectedMemberIds.includes(officer.id),
    );

    if (!selectedMembers.length) {
      setTeamError("Select at least one officer to create a team.");
      return;
    }

    const hasDriver = selectedMembers.some(
      (member) => member.fieldOfficerType === "DRIVER",
    );
    if (!hasDriver) {
      setTeamError("Each team must include at least one Driver.");
      return;
    }

    const hasNonDriver = selectedMembers.some(
      (member) => member.fieldOfficerType !== "DRIVER",
    );
    if (!hasNonDriver) {
      setTeamError("Each team must include at least one non-driver officer.");
      return;
    }

    const nextTeams = [
      {
        id: `${Date.now()}`,
        name: trimmedName,
        memberIds: selectedMemberIds,
        createdAt: new Date().toISOString(),
      },
      ...teams,
    ];

    persistTeams(nextTeams);
    setTeamName("");
    setSelectedMemberIds([]);
    setTeamError("");
  };

  const deleteTeam = (teamId) => {
    const nextTeams = teams.filter((team) => team.id !== teamId);
    persistTeams(nextTeams);
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["Total Officers", allOfficers.length, "under your woreda"],
          ["Drivers", typeCounts.DRIVER || 0, "assigned to transport teams"],
          [
            "Technicians",
            typeCounts.TECHNICIAN || 0,
            "handle installation and repair",
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

      {/* Main Card */}
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Field Officers
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {totalCount} officers found
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
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
          >
            <option value="">All Types</option>
            {generalOfficerTypeOptions.map((typeOption) => (
              <option key={typeOption.value} value={typeOption.value}>
                {getOfficerTypeSelectLabel(typeOption.value)}
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
          {(search || filterType || filterStatus) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterType("");
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
          <OfficerTable
            officers={officers}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
            onSuspend={handleSuspendToggle}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <div className="mt-6 bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <h3 className="font-syne font-bold text-sm tracking-tight">
            Team Composition
          </h3>
          <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
            Create named teams by selecting drivers and officers.
          </p>
        </div>

        <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-3">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (example: East Repair Squad)"
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
            <button
              onClick={createTeam}
              className="px-4 py-2 rounded-xl text-xs bg-[#1D9E75] text-[#020f1a] font-medium hover:bg-[#5DCAA5] transition-colors"
            >
              + Create Team
            </button>
          </div>

          {teamError && (
            <p className="text-[11px] text-[#E24B4A] mb-3">{teamError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {allOfficers.map((member) => {
              const active = selectedMemberIds.includes(member.id);

              return (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => toggleMemberSelection(member.id)}
                  className={`text-left rounded-xl border px-3 py-2 transition-all ${
                    active
                      ? "border-[#1D9E75] bg-[rgba(29,158,117,0.14)]"
                      : "border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] hover:bg-[rgba(29,158,117,0.08)]"
                  }`}
                >
                  <p className="text-xs font-semibold text-[#e8f4f0]">
                    {member.fullName}
                  </p>
                  <p className="text-[10px] text-[rgba(232,244,240,0.45)] mt-0.5">
                    {getOfficerTypeLabel(member.fieldOfficerType)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4">
          {!teams.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              No teams created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => {
                const members = team.memberIds
                  .map((memberId) => teamMembersById[memberId])
                  .filter(Boolean);

                return (
                  <div
                    key={team.id}
                    className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-syne text-sm font-bold text-[#e8f4f0]">
                          {team.name}
                        </p>
                        <p className="text-[10px] text-[rgba(232,244,240,0.4)] mt-0.5">
                          {members.length} members
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(226,75,74,0.08)] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.18)] transition-colors"
                      >
                        Delete Team
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {members.map((member) => (
                        <span
                          key={member.id}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(29,158,117,0.12)] text-[#5DCAA5]"
                        >
                          {member.fullName} -{" "}
                          {getOfficerTypeLabel(member.fieldOfficerType)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Field Officer"
      >
        <OfficerForm
          onSubmit={handleCreate}
          loading={loading}
          typeOptions={generalOfficerTypeOptions}
        />
      </Modal>
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Field Officer"
      >
        <OfficerForm
          onSubmit={handleUpdate}
          defaultValues={editTarget}
          loading={loading}
        />
      </Modal>
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Delete Field Officer"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action cannot be undone.`}
      />
    </div>
  );
}
