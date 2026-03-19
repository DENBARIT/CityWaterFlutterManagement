"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";
import SubcityMapCard from "@/features/dashboard/components/SubcityMapCard";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function SubcitiesPage(props) {
  const openAddSubcity = props?.openAddSubcity;
  const setOpenAddSubcity = props?.setOpenAddSubcity;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldOpenFromQuery = searchParams.get("create") === "1";
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(shouldOpenFromQuery);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openCreateModal = () => {
    setError("");
    setEditTarget(null);
    setName("");
    setCreateOpen(true);
  };

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [rows],
  );

  const loadSubcities = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the new backend endpoint for active subcities
      const result = await apiRequest("/super-admin/subcities/active", {
        useAuth: true,
      });
      setRows(
        Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [],
      );
    } catch (err) {
      setError(err?.message || "Failed to load subcities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubcities();
  }, []);

  useEffect(() => {
    if (!shouldOpenFromQuery) {
      return;
    }

    openCreateModal();
    router.replace(pathname, { scroll: false });
  }, [pathname, router, shouldOpenFromQuery]);

  useEffect(() => {
    const handleOpenFromTopbar = () => {
      openCreateModal();
    };

    window.addEventListener("dashboard:open-add-subcity", handleOpenFromTopbar);
    return () => {
      window.removeEventListener(
        "dashboard:open-add-subcity",
        handleOpenFromTopbar,
      );
    };
  }, []);

  // Open modal when triggered from Topbar
  // These props will be injected by DashboardLayout
  // openAddSubcity: boolean, setOpenAddSubcity: function
  useEffect(() => {
    if (typeof openAddSubcity !== "undefined" && openAddSubcity) {
      openCreateModal();
      if (typeof setOpenAddSubcity === "function") setOpenAddSubcity(false);
    }
  }, [openAddSubcity, setOpenAddSubcity]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 1800);
    return () => clearTimeout(timer);
  }, [message]);

  const resetForm = () => {
    setName("");
    setEditTarget(null);
  };

  const openEditModal = (row) => {
    setError("");
    setEditTarget(row);
    setName(row.name || "");
    setCreateOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      setError("Subcity name is required");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (editTarget?.id) {
        await superAdminService.updateSubCity(editTarget.id, {
          name: trimmed,
        });
        setMessage("Subcity updated");
      } else {
        await superAdminService.createSubCity({ name: trimmed });
        setMessage("Subcity created");
      }

      resetForm();
      setCreateOpen(false);
      await loadSubcities();
    } catch (err) {
      const rawMessage = String(err?.message || "").toLowerCase();
      const isDuplicateName =
        err?.status === 409 ||
        rawMessage.includes("already exists") ||
        rawMessage.includes("unique constraint");

      setError(
        isDuplicateName
          ? "Subcity name already exists"
          : err?.message || "Unable to save subcity",
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget?.id) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await superAdminService.deleteSubCityAlias(deleteTarget.id);
      setMessage("Subcity deleted");
      setDeleteTarget(null);
      await loadSubcities();
    } catch (err) {
      setError(err?.message || "Unable to delete subcity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#e8f4f0]">
      {message && (
        <div className="fixed top-5 left-1/2 z-2200 -translate-x-1/2">
          <div className="rounded-xl border border-[rgba(29,158,117,0.45)] bg-[#0b2a22] px-4 py-2 text-xs text-[#7ce4be] shadow-lg whitespace-nowrap">
            {message}
          </div>
        </div>
      )}

      {error && !createOpen && (
        <div className="mb-3 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-2 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      <div id="subcity-map" className="mb-4 scroll-mt-20">
        <SubcityMapCard subcityCount={rows.length} />
      </div>

      <div
        id="subcity-list"
        className="overflow-hidden rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] scroll-mt-20"
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-[rgba(29,158,117,0.08)] text-[rgba(232,244,240,0.65)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 w-45">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[rgba(29,158,117,0.08)]"
              >
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(row)}
                      className="rounded-lg border border-[rgba(93,202,165,0.35)] px-3 py-1 text-[11px] text-[#7ce4be]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(row)}
                      className="rounded-lg border border-[rgba(226,75,74,0.35)] px-3 py-1 text-[11px] text-[#ff9c9b]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!sortedRows.length && !loading && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-[rgba(232,244,240,0.45)]"
                >
                  No subcities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title={editTarget ? "Edit Subcity" : "Create Subcity"}
      >
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-3 py-2 text-xs text-[#ff9c9b]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] text-[rgba(232,244,240,0.55)]">
              Subcity Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subcity name"
              className="w-full rounded-xl border border-[rgba(29,158,117,0.15)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs outline-none focus:border-[rgba(29,158,117,0.4)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
              className="rounded-xl border border-[rgba(232,244,240,0.2)] px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#1D9E75] px-4 py-2 text-xs font-medium text-[#021015] disabled:opacity-50"
            >
              {editTarget ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={loading}
        title="Delete Subcity"
        message="Are you sure you want to delete the subcity?"
      />
    </div>
  );
}
