"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Badge from "@/components/ui/Badge";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const CREATE_SUPERADMIN_DEFAULTS = {
  fullName: "",
  email: "",
  phoneE164: "+251",
  nationalId: "",
  password: "",
  confirmPassword: "",
};

export default function SuperAdminsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionToast, setActionToast] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: CREATE_SUPERADMIN_DEFAULTS,
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors },
  } = useForm();

  const normalizePhoneE164 = (rawValue) => {
    const value = String(rawValue || "").replace(/[^\d+]/g, "");

    if (value.startsWith("+251")) {
      return `+251${value.slice(4).replace(/\D/g, "").slice(0, 9)}`;
    }

    if (value.startsWith("251")) {
      return `+251${value.slice(3).replace(/\D/g, "").slice(0, 9)}`;
    }

    const localDigits = value.replace(/\D/g, "").replace(/^0+/, "");
    return `+251${localDigits.slice(0, 9)}`;
  };

  const normalizeNationalId = (rawValue) =>
    String(rawValue || "")
      .replace(/\D/g, "")
      .slice(0, 12);

  const validateTwoPartName = (value) => {
    return (
      String(value || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length >= 2 || "Include first name and second name."
    );
  };

  const passwordValue = watch("password") || "";

  const getPasswordStrength = (password) => {
    if (!password) {
      return { label: "Weak", percent: 0, color: "bg-[rgba(226,75,74,0.35)]" };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return { label: "Weak", percent: 33, color: "bg-[#E24B4A]" };
    }

    if (score <= 3) {
      return { label: "Medium", percent: 66, color: "bg-[#f59e0b]" };
    }

    return { label: "Strong", percent: 100, color: "bg-[#1D9E75]" };
  };

  const passwordStrength = getPasswordStrength(passwordValue);
  const passwordChecks = [
    {
      label: "8 characters",
      ok: passwordValue.length >= 8,
    },
    {
      label: "Uppercase letter",
      ok: /[A-Z]/.test(passwordValue),
    },
    {
      label: "Lowercase letter",
      ok: /[a-z]/.test(passwordValue),
    },
    {
      label: "Number",
      ok: /\d/.test(passwordValue),
    },
    {
      label: "Special character",
      ok: /[^A-Za-z0-9]/.test(passwordValue),
    },
  ];

  const handleInactiveOrDeletedSession = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    setActionToast({
      type: "error",
      text: "Your session is inactive or deleted. Please sign in again.",
    });
    setTimeout(() => {
      router.push("/login");
    }, 800);
  }, [router]);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await superAdminService.searchAdmins({
        role: "SUPER_ADMIN",
      });
      setAdmins(Array.isArray(rows) ? rows : []);
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
        return;
      }
      setErrorMessage(err?.message || "Failed to load super admins.");
    } finally {
      setLoading(false);
    }
  }, [handleInactiveOrDeletedSession]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      reset(CREATE_SUPERADMIN_DEFAULTS);
      setCreateOpen(true);
    }
  }, [searchParams, reset]);

  useEffect(() => {
    if (!editTarget) {
      resetEdit({});
      return;
    }

    resetEdit({
      fullName: editTarget.fullName || "",
      email: editTarget.email || "",
      phoneE164: editTarget.phoneE164 || "+251",
      nationalId: editTarget.nationalId || "",
    });
  }, [editTarget, resetEdit]);

  useEffect(() => {
    if (!actionToast) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setActionToast(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [actionToast]);

  const onSubmit = async (data) => {
    setLoading(true);
    setActionToast(null);
    setErrorMessage("");
    try {
      const payload = {
        fullName: String(data.fullName || "")
          .trim()
          .replace(/\s+/g, " "),
        email: String(data.email || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ""),
        phoneE164: normalizePhoneE164(data.phoneE164),
        nationalId: normalizeNationalId(data.nationalId),
        password: String(data.password || "").replace(/\s+/g, ""),
      };

      await superAdminService.createSuperAdmin(payload);
      await loadAdmins();
      setCreateOpen(false);
      reset();
      setActionToast({
        type: "success",
        text: "super admin created successfully",
      });
    } catch (err) {
      const message = String(err?.message || "");
      const lowered = message.toLowerCase();
      if (lowered.includes("already exists")) {
        setActionToast({
          type: "error",
          text: "super admin already exists",
        });
      } else if (lowered.includes("inactive or deleted")) {
        handleInactiveOrDeletedSession();
      } else if (
        lowered.includes("unauthorized") ||
        lowered.includes("invalid token") ||
        lowered.includes("forbidden")
      ) {
        setActionToast({
          type: "error",
          text: "You are not authorized to create super admins. Please sign in again with a super admin account.",
        });
      } else {
        setActionToast({
          type: "error",
          text: message || "unable to create super admin",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setLoading(true);
    setActionToast(null);
    setErrorMessage("");
    try {
      await superAdminService.updateAdmin(editTarget.id, {
        fullName: data.fullName,
        email: data.email,
        phoneE164: data.phoneE164,
        nationalId: data.nationalId,
      });
      await loadAdmins();
      setEditTarget(null);
      setActionToast({
        type: "success",
        text: "super admin updated successfully",
      });
    } catch (err) {
      setActionToast({
        type: "error",
        text: err?.message || "unable to update super admin",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    setActionToast(null);
    setErrorMessage("");
    try {
      await superAdminService.deleteAdmin(deleteTarget.id);
      await loadAdmins();
      setDeleteTarget(null);
      setActionToast({
        type: "success",
        text: "super admin deleted successfully",
      });
    } catch (err) {
      setActionToast({
        type: "error",
        text: err?.message || "unable to delete super admin",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!suspendTarget) return;

    setLoading(true);
    setActionToast(null);
    setErrorMessage("");
    try {
      await superAdminService.updateAdmin(suspendTarget.id, {
        status: suspendTarget.nextStatus,
      });
      await loadAdmins();
      setActionToast({
        type: "success",
        text:
          suspendTarget.nextStatus === "ACTIVE"
            ? "super admin activated successfully"
            : "super admin suspended successfully",
      });
      setSuspendTarget(null);
    } catch (err) {
      setActionToast({
        type: "error",
        text: err?.message || "unable to update super admin status",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    reset(CREATE_SUPERADMIN_DEFAULTS);
    setCreateOpen(true);
  };

  return (
    <div className="text-[#e8f4f0]">
      {actionToast && (
        <div className="fixed top-5 left-1/2 z-80 -translate-x-1/2">
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

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Super Admins
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-0.5">
              Manage platform-level administrators
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs bg-[#1D9E75] text-[#020f1a] font-medium hover:bg-[#5DCAA5] transition-colors"
          >
            + Add Super Admin
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-3 text-xs text-[#ff9c9b]">
            {errorMessage}
          </div>
        )}

        <div className="px-6 py-4 overflow-x-auto">
          {loading && !admins.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.5)]">
              Loading super admins...
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Full Name",
                    "Email",
                    "Phone",
                    "National ID",
                    "Status",
                    "Created",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.length ? (
                  admins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-[rgba(29,158,117,0.04)]"
                    >
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                        {admin.fullName}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.6)]">
                        {admin.email || "-"}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.6)]">
                        {admin.phoneE164 || "-"}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.6)]">
                        {admin.nationalId || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge status={admin.status || "ACTIVE"} />
                      </td>
                      <td className="py-3 text-[rgba(232,244,240,0.4)]">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditTarget(admin)}
                            className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.18)] transition-colors"
                          >
                            Edit
                          </button>
                          {admin.status !== "SUSPENDED" && (
                            <button
                              onClick={() =>
                                setSuspendTarget({
                                  ...admin,
                                  nextStatus: "SUSPENDED",
                                })
                              }
                              className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(239,159,39,0.12)] text-[#EF9F27] hover:bg-[rgba(239,159,39,0.22)] transition-colors"
                            >
                              Suspend
                            </button>
                          )}
                          {admin.status === "SUSPENDED" && (
                            <button
                              onClick={() =>
                                setSuspendTarget({
                                  ...admin,
                                  nextStatus: "ACTIVE",
                                })
                              }
                              className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.12)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.22)] transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(admin)}
                            className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(226,75,74,0.08)] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.18)] transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="py-4 text-[rgba(232,244,240,0.5)]"
                      colSpan={7}
                    >
                      No super admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          reset(CREATE_SUPERADMIN_DEFAULTS);
        }}
        title="Add Super Admin"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="relative">
          <FormField label="Full name" error={errors.fullName?.message}>
            <Input
              placeholder="e.g. Abebe Kebede"
              error={errors.fullName}
              {...register("fullName", {
                required: "Full name is required.",
                minLength: { value: 3, message: "At least 3 characters." },
                validate: validateTwoPartName,
              })}
            />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <Input
              type="email"
              placeholder="superadmin@citywater.local"
              autoComplete="off"
              error={errors.email}
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Enter a valid email.",
                },
                onChange: (event) => {
                  setValue(
                    "email",
                    String(event?.target?.value || "")
                      .toLowerCase()
                      .replace(/\s+/g, ""),
                    {
                      shouldValidate: true,
                    },
                  );
                },
              })}
            />
          </FormField>

          <FormField label="Phone (E.164)" error={errors.phoneE164?.message}>
            <Input
              placeholder="+251900000001"
              error={errors.phoneE164}
              {...register("phoneE164", {
                required: "Phone is required.",
                pattern: {
                  value: /^\+251(?:9\d{8}|7\d{8}|11\d{7})$/,
                  message:
                    "Phone number must start with +251 and use 9, 7, or 11 prefixes only.",
                },
                onChange: (event) => {
                  setValue(
                    "phoneE164",
                    normalizePhoneE164(event.target.value),
                    {
                      shouldValidate: true,
                    },
                  );
                },
              })}
            />
          </FormField>

          <FormField label="National ID" error={errors.nationalId?.message}>
            <Input
              placeholder="123456789012"
              error={errors.nationalId}
              {...register("nationalId", {
                required: "National ID is required.",
                pattern: {
                  value: /^\d{12}$/,
                  message: "National ID must be exactly 12 digits.",
                },
                onChange: (event) => {
                  setValue(
                    "nationalId",
                    normalizeNationalId(event.target.value),
                    {
                      shouldValidate: true,
                    },
                  );
                },
              })}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={errors.password}
              {...register("password", {
                required: "Password is required.",
                minLength: { value: 8, message: "At least 8 characters." },
                onChange: (event) => {
                  setValue(
                    "password",
                    String(event?.target?.value || "").replace(/\s+/g, ""),
                    {
                      shouldValidate: true,
                    },
                  );
                },
              })}
            />
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-[rgba(232,244,240,0.6)] mb-1">
                <span>Password strength</span>
                <span>{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[rgba(232,244,240,0.15)] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.percent}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {passwordChecks.map((rule) => (
                  <p
                    key={rule.label}
                    className={`text-[10px] ${
                      rule.ok
                        ? "text-[#7ce4be]"
                        : "text-[rgba(232,244,240,0.45)]"
                    }`}
                  >
                    {rule.ok ? "✓" : "•"} {rule.label}
                  </p>
                ))}
              </div>
            </div>
          </FormField>

          <FormField
            label="Confirm Password"
            error={errors.confirmPassword?.message}
          >
            <Input
              type="password"
              placeholder="Re-enter password"
              autoComplete="new-password"
              error={errors.confirmPassword}
              {...register("confirmPassword", {
                required: "Please confirm the password.",
                validate: (value) =>
                  value === getValues("password") || "Passwords do not match.",
              })}
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Creating..." : "Create Super Admin"}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Super Admin"
      >
        <form onSubmit={handleSubmitEdit(handleUpdate)}>
          <FormField label="Full name" error={editErrors.fullName?.message}>
            <Input
              placeholder="e.g. Abebe Kebede"
              error={editErrors.fullName}
              {...registerEdit("fullName", {
                required: "Full name is required.",
                minLength: { value: 3, message: "At least 3 characters." },
                validate: validateTwoPartName,
              })}
            />
          </FormField>

          <FormField label="Email" error={editErrors.email?.message}>
            <Input
              type="email"
              placeholder="superadmin@citywater.local"
              error={editErrors.email}
              {...registerEdit("email", {
                required: "Email is required.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Enter a valid email.",
                },
              })}
            />
          </FormField>

          <FormField
            label="Phone (E.164)"
            error={editErrors.phoneE164?.message}
          >
            <Input
              placeholder="+251900000001"
              error={editErrors.phoneE164}
              {...registerEdit("phoneE164", {
                required: "Phone is required.",
                pattern: {
                  value: /^\+251\d{9}$/,
                  message:
                    "Phone number must start with +251 and include 9 digits after it.",
                },
                onChange: (event) => {
                  setValueEdit(
                    "phoneE164",
                    normalizePhoneE164(event.target.value),
                    {
                      shouldValidate: true,
                    },
                  );
                },
              })}
            />
          </FormField>

          <FormField label="National ID" error={editErrors.nationalId?.message}>
            <Input
              placeholder="123456789012"
              error={editErrors.nationalId}
              {...registerEdit("nationalId", {
                required: "National ID is required.",
                pattern: {
                  value: /^\d{12}$/,
                  message: "National ID must be exactly 12 digits.",
                },
                onChange: (event) => {
                  setValueEdit(
                    "nationalId",
                    normalizeNationalId(event.target.value),
                    {
                      shouldValidate: true,
                    },
                  );
                },
              })}
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Updating..." : "Update Super Admin"}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Delete Super Admin"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action cannot be undone.`}
      />

      <Modal
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title={
          suspendTarget?.nextStatus === "ACTIVE"
            ? "Activate Super Admin"
            : "Suspend Super Admin"
        }
      >
        <p className="text-sm text-[rgba(232,244,240,0.55)] font-light leading-relaxed mb-6">
          {suspendTarget?.nextStatus === "ACTIVE"
            ? `Are you sure you want to activate ${suspendTarget?.fullName}?`
            : `Are you sure you want to suspend ${suspendTarget?.fullName}?`}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setSuspendTarget(null)}
            className="px-5 py-2 rounded-xl text-xs border border-[rgba(232,244,240,0.1)] text-[rgba(232,244,240,0.5)] hover:text-[#e8f4f0] hover:border-[rgba(232,244,240,0.2)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleStatusChange}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs bg-[rgba(239,159,39,0.15)] border border-[rgba(239,159,39,0.35)] text-[#EF9F27] hover:bg-[rgba(239,159,39,0.25)] transition-all disabled:opacity-50"
          >
            {loading
              ? suspendTarget?.nextStatus === "ACTIVE"
                ? "Activating..."
                : "Suspending..."
              : suspendTarget?.nextStatus === "ACTIVE"
                ? "Activate"
                : "Suspend"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
