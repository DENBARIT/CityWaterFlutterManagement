"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSidebar } from "@/store/sidebarStore";
import { apiRequest, getJwtPayload } from "@/services/apiClient";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { requestResetOtp } from "@/features/auth/services/auth.service";

export default function Sidebar({
  nav,
  role = "SA",
  name = "System Admin",
  roleLabel = "SYSTEM_ADMIN",
}) {
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [loggedName, setLoggedName] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordStatus, setChangePasswordStatus] = useState({
    type: "",
    message: "",
  });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [newAssignedComplaintsCount, setNewAssignedComplaintsCount] =
    useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const result = await apiRequest("/auth/me", { useAuth: true });
        const fullName = result?.data?.fullName || "";
        const email = result?.data?.email || "";
        if (mounted) {
          setLoggedName(fullName);
          setLoggedEmail(email);
        }
      } catch (_error) {
        if (mounted) {
          setLoggedName("");
          setLoggedEmail("");
        }
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const payload = getJwtPayload() || {};
    const role = String(payload?.role || "").toUpperCase();
    const isSubcityComplaintOfficer = role === "SUBCITY_COMPLAINT_OFFICER";
    const isComplaintOfficer =
      isSubcityComplaintOfficer || role === "WOREDA_COMPLAINT_OFFICER";

    if (!isComplaintOfficer || !payload?.userId) {
      setNewAssignedComplaintsCount(0);
      return;
    }

    let cancelled = false;

    const loadNewAssignedCount = async () => {
      try {
        const statusFilter = isSubcityComplaintOfficer ? "ESCALATED" : "OPEN";
        const rows = await apiRequest("/super-admin/complaints", {
          useAuth: true,
          query: {
            assignedToId: payload.userId,
            status: statusFilter,
            subCityId: payload?.subCityId || "",
            woredaId: payload?.woredaId || "",
          },
        });

        if (!cancelled) {
          setNewAssignedComplaintsCount(Array.isArray(rows) ? rows.length : 0);
        }
      } catch (_error) {
        if (!cancelled) {
          setNewAssignedComplaintsCount(0);
        }
      }
    };

    void loadNewAssignedCount();
    const timerId = setInterval(() => {
      void loadNewAssignedCount();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(timerId);
    };
  }, [pathname]);

  useEffect(() => {
    const payload = getJwtPayload() || {};
    const role = String(payload?.role || "").toUpperCase();
    const isSubcityAdmin = role === "SUBCITY_ADMIN";

    if (!isSubcityAdmin || !payload?.userId) {
      setUnreadNotificationsCount(0);
      return;
    }

    let cancelled = false;

    const loadUnreadNotifications = async () => {
      try {
        const [announcementFeed, notificationFeed] = await Promise.all([
          apiRequest("/auth/announcements", { useAuth: true }),
          apiRequest("/auth/notifications", { useAuth: true }),
        ]);

        const announcementUnread = Number(
          announcementFeed?.unreadCount ??
            announcementFeed?.data?.unreadCount ??
            0,
        );
        const notificationUnread = Number(
          notificationFeed?.unreadCount ??
            notificationFeed?.data?.unreadCount ??
            0,
        );

        if (!cancelled) {
          setUnreadNotificationsCount(
            Math.max(0, announcementUnread) + Math.max(0, notificationUnread),
          );
        }
      } catch (_error) {
        if (!cancelled) {
          setUnreadNotificationsCount(0);
        }
      }
    };

    void loadUnreadNotifications();

    const handleUnreadRefresh = () => {
      void loadUnreadNotifications();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "subcity-notifications-updated",
        handleUnreadRefresh,
      );
    }

    const timerId = setInterval(() => {
      void loadUnreadNotifications();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(timerId);
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "subcity-notifications-updated",
          handleUnreadRefresh,
        );
      }
    };
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.clear();
    }
    router.replace("/");
  };

  const openChangePassword = () => {
    setChangePasswordStatus({ type: "", message: "" });
    reset({ newPassword: "", confirmPassword: "" });
    setChangePasswordOpen(true);
  };

  const closeChangePassword = () => {
    setChangePasswordOpen(false);
    setChangePasswordStatus({ type: "", message: "" });
    reset({ newPassword: "", confirmPassword: "" });
  };

  const submitChangePassword = async (data) => {
    if (!loggedEmail) {
      setChangePasswordStatus({
        type: "error",
        message:
          "We could not find your account email. Please refresh and try again.",
      });
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordStatus({ type: "", message: "" });

    try {
      const newPassword = String(data.newPassword || "").trim();

      await requestResetOtp({ email: loggedEmail });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "pendingPasswordChange",
          JSON.stringify({
            email: loggedEmail,
            newPassword,
            savedAt: Date.now(),
          }),
        );
      }

      setChangePasswordStatus({
        type: "success",
        message:
          "OTP sent to your email. Open the reset page and confirm the password change.",
      });
    } catch (error) {
      setChangePasswordStatus({
        type: "error",
        message:
          error?.message || "Unable to request password confirmation OTP.",
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <aside
      className={`flex flex-col bg-[#05141f] border-r border-[rgba(29,158,117,0.1)] transition-all duration-250 shrink-0 h-screen sticky top-0 overflow-hidden ${collapsed ? "w-15" : "w-55"}`}
    >
      <div className="flex items-center justify-between px-4 h-14 border-b border-[rgba(29,158,117,0.08)] shrink-0">
        {!collapsed && (
          <Link
            href="/"
            className="font-syne font-extrabold text-base text-[#1D9E75] hover:opacity-80 transition-opacity"
          >
            Aqua<span className="text-[#e8f4f0]">Connect</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[rgba(232,244,240,0.3)] hover:text-[#1D9E75] transition-colors text-xs p-1 rounded ml-auto"
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {nav.map(({ section, items }) => (
          <div key={section}>
            {!collapsed ? (
              <p className="px-3 pt-3 pb-1 text-[9px] uppercase tracking-widest text-[rgba(232,244,240,0.2)]">
                {section}
              </p>
            ) : (
              <div className="h-3" />
            )}
            {items.map(({ label, icon, href, action, kind }) => {
              const active = href ? pathname === href : false;
              const showMyAssignmentsBadge =
                href === "/complaint/complaints/assigned" &&
                newAssignedComplaintsCount > 0;
              const showSubcityNotificationBadge =
                href === "/subcity/messages/notification" &&
                unreadNotificationsCount > 0;
              const badgeCount = showMyAssignmentsBadge
                ? newAssignedComplaintsCount
                : showSubcityNotificationBadge
                  ? unreadNotificationsCount
                  : 0;
              const itemClass = `flex items-center gap-2 px-3 py-2 mx-2 rounded-lg transition-all text-xs mb-0.5 ${active ? "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]" : "text-[rgba(232,244,240,0.45)] hover:bg-[rgba(29,158,117,0.07)] hover:text-[#e8f4f0]"}`;

              if (kind === "group") {
                if (collapsed) {
                  return <div key={`group-${label}`} className="h-1" />;
                }

                return (
                  <p
                    key={`group-${label}`}
                    className="px-3 pt-2 pb-1 mx-2 text-[9px] uppercase tracking-widest text-[rgba(232,244,240,0.25)]"
                  >
                    {label}
                  </p>
                );
              }

              if (action === "change-password") {
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={openChangePassword}
                    title={collapsed ? label : undefined}
                    className={itemClass}
                  >
                    <span className="text-xs w-4 shrink-0 text-center">
                      {icon}
                    </span>
                    {!collapsed && (
                      <span className="whitespace-nowrap font-medium">
                        {label}
                      </span>
                    )}
                  </button>
                );
              }

              if (!href) {
                return null;
              }

              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  title={collapsed ? label : undefined}
                  className={itemClass}
                >
                  <span className="text-xs w-4 shrink-0 text-center">
                    {icon}
                  </span>
                  {!collapsed && (
                    <span
                      className={`whitespace-nowrap font-medium ${active ? "text-[#1D9E75]" : ""}`}
                    >
                      {label}
                    </span>
                  )}
                  {badgeCount > 0 && (
                    <span className="ml-auto inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-[#E24B4A] text-white text-[10px] font-bold">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[rgba(29,158,117,0.08)]">
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full mb-2 flex items-center gap-2 p-2 rounded-xl border border-[rgba(226,75,74,0.28)] text-[#ff9c9b] hover:bg-[rgba(226,75,74,0.12)] transition-all"
        >
          <span className="text-xs w-4 shrink-0 text-center">⎋</span>
          {!collapsed && (
            <span className="text-xs font-medium whitespace-nowrap">
              Logout
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(29,158,117,0.05)] overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-[rgba(29,158,117,0.2)] flex items-center justify-center text-[10px] font-syne font-bold text-[#1D9E75] shrink-0">
            {role}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate">
                {loggedName || name}
              </p>
              <p className="text-[9px] text-[rgba(232,244,240,0.3)]">
                {loggedEmail || roleLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={changePasswordOpen}
        onClose={closeChangePassword}
        title="Change Password"
      >
        {changePasswordStatus.type === "success" ? (
          <div className="space-y-4">
            <p className="text-sm text-[rgba(232,244,240,0.7)] leading-relaxed">
              OTP sent to <span className="text-[#1D9E75]">{loggedEmail}</span>.
              Open the reset page to confirm the new password.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  closeChangePassword();
                  router.push(
                    `/reset-password?email=${encodeURIComponent(loggedEmail)}`,
                  );
                }}
                className="flex-1 rounded-xl bg-[#1D9E75] px-4 py-3 text-sm font-syne font-bold text-[#020f1a] hover:bg-[#5DCAA5] transition-all"
              >
                Continue to reset
              </button>
              <button
                type="button"
                onClick={closeChangePassword}
                className="flex-1 rounded-xl border border-[rgba(29,158,117,0.15)] px-4 py-3 text-sm text-[rgba(232,244,240,0.7)] hover:border-[rgba(29,158,117,0.35)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(submitChangePassword)}
            className="space-y-4"
          >
            {changePasswordStatus.message ? (
              <p
                className={`text-xs rounded-lg px-3 py-2 border ${
                  changePasswordStatus.type === "error"
                    ? "text-[#f09595] bg-[rgba(240,149,149,0.1)] border-[rgba(240,149,149,0.35)]"
                    : "text-[#9be5c9] bg-[rgba(29,158,117,0.12)] border-[rgba(29,158,117,0.35)]"
                }`}
              >
                {changePasswordStatus.message}
              </p>
            ) : null}

            <div>
              <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
                Account email
              </label>
              <Input value={loggedEmail || "Loading..."} readOnly />
            </div>

            <div>
              <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
                New password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                error={errors.newPassword}
                {...register("newPassword", {
                  required: "New password is required.",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters.",
                  },
                })}
              />
              {errors.newPassword ? (
                <p className="mt-1 text-xs text-[#f09595]">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
                Confirm password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword}
                {...register("confirmPassword", {
                  required: "Please confirm the password.",
                  validate: (value) =>
                    value === watch("newPassword") || "Passwords do not match.",
                })}
              />
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-[#f09595]">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={changePasswordLoading}
              className="w-full rounded-xl bg-[#1D9E75] px-4 py-3 text-sm font-syne font-bold text-[#020f1a] hover:bg-[#5DCAA5] transition-all disabled:opacity-60"
            >
              {changePasswordLoading
                ? "Sending OTP..."
                : "Send confirmation email"}
            </button>
          </form>
        )}
      </Modal>
    </aside>
  );
}
