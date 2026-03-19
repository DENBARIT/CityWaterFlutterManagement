"use client";

import { useEffect, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function WoredaNotificationPage() {
  const woredaId = getJwtPayload()?.woredaId || "";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedNotificationIds, setExpandedNotificationIds] = useState([]);

  const toggleNotificationExpansion = (notificationId) => {
    setExpandedNotificationIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  };

  useEffect(() => {
    const load = async () => {
      if (!woredaId) {
        setRows([]);
        return;
      }

      setLoading(true);
      try {
        const [announcementFeed, scheduleFeed] = await Promise.all([
          superAdminService.getUserAnnouncements(),
          superAdminService.getUserNotifications(),
        ]);

        const announcements = Array.isArray(announcementFeed?.items)
          ? announcementFeed.items
          : Array.isArray(announcementFeed?.data?.items)
            ? announcementFeed.data.items
            : [];

        const scheduleNotifications = Array.isArray(scheduleFeed?.items)
          ? scheduleFeed.items
          : Array.isArray(scheduleFeed?.data?.items)
            ? scheduleFeed.data.items
            : [];

        const notifications = [
          ...announcements.map((item) => ({
            id: `announcement-${item.id}`,
            title: item.title || "Announcement",
            message: item.message || "",
            createdAt: item.createdAt,
            source: "ANNOUNCEMENT",
          })),
          ...scheduleNotifications.map((item) => ({
            id: `schedule-${item.id}`,
            title: item.title || "Notification",
            message: item.message || "",
            createdAt: item.createdAt,
            source: item.type === "COMPLAINT_UPDATE" ? "COMPLAINT" : "SCHEDULE",
          })),
        ].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );

        setRows(notifications);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [woredaId]);

  return (
    <div className="text-[#e8f4f0] bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
        <h2 className="font-syne font-bold text-sm tracking-tight">
          Notification
        </h2>
        <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
          {loading ? "Loading..." : `${rows.length} notifications`}
        </p>
      </div>
      <div className="px-6 py-4 space-y-3">
        {rows.map((n) => {
          const fullMessage = String(n.message || "");
          const isExpanded = expandedNotificationIds.includes(n.id);
          const isLongMessage = fullMessage.length > 220;
          const compactMessage = isLongMessage
            ? `${fullMessage.slice(0, 220).trimEnd()}...`
            : fullMessage;

          return (
            <div
              key={n.id}
              className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-4"
            >
              <p className="font-syne text-sm text-[rgba(232,244,240,0.9)]">
                {n.title}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-[rgba(29,158,117,0.8)] mt-1">
                {n.source === "ANNOUNCEMENT"
                  ? "Woreda Announcement"
                  : n.source === "COMPLAINT"
                    ? "Complaint Update"
                    : "Woreda Notification"}
              </p>
              <p className="text-xs text-[rgba(232,244,240,0.55)] mt-1 whitespace-pre-wrap">
                {isExpanded ? fullMessage : compactMessage}
              </p>
              {isLongMessage && (
                <button
                  type="button"
                  onClick={() => toggleNotificationExpansion(n.id)}
                  className="mt-2 text-[11px] font-semibold text-[#7ce4be] hover:text-[#9ef1cf]"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
              <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-2">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
              </p>
            </div>
          );
        })}
        {!loading && !rows.length && (
          <p className="text-[10px] text-[rgba(232,244,240,0.35)]">
            No notifications available.
          </p>
        )}
      </div>
    </div>
  );
}
