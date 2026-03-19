"use client";

import { useEffect, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function SubcityNotificationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedNotificationIds, setExpandedNotificationIds] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReplyId, setSendingReplyId] = useState("");
  const subCityId = getJwtPayload()?.subCityId || "";

  const toggleNotificationExpansion = (notificationId) => {
    setExpandedNotificationIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  };

  useEffect(() => {
    const load = async () => {
      if (!subCityId) {
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
            rawId: item.id,
            kind: "ANNOUNCEMENT",
            title: item.title || "Announcement",
            message: item.message || "",
            createdAt: item.createdAt,
            isRead: Boolean(item.isRead),
            data: item.data || null,
            source: "SUPER_ADMIN",
          })),
          ...scheduleNotifications.map((item) => ({
            id: `notification-${item.id}`,
            rawId: item.id,
            kind: "NOTIFICATION",
            title: item.title || "Notification",
            message: item.message || "",
            createdAt: item.createdAt,
            isRead: Boolean(item.isRead),
            data: item.data || null,
            source: item.type === "COMPLAINT_UPDATE" ? "COMPLAINT" : "SUBCITY",
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
  }, [subCityId]);

  const unreadCount = rows.filter((item) => !item.isRead).length;

  const notifySidebarUnreadChanged = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("subcity-notifications-updated"));
    }
  };

  const markAsRead = async (notification) => {
    if (!notification || notification.isRead) {
      return;
    }

    try {
      if (notification.kind === "ANNOUNCEMENT") {
        await superAdminService.markAnnouncementAsRead(notification.rawId);
      } else {
        await superAdminService.markNotificationAsRead(notification.rawId);
      }

      setRows((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      notifySidebarUnreadChanged();
    } catch (_error) {
      // Keep UI responsive even if mark-as-read fails.
    }
  };

  const openReplyModal = (notification) => {
    const complaintId = String(notification?.data?.complaintId || "").trim();
    if (!complaintId) {
      return;
    }

    setReplyTarget({
      id: notification.id,
      complaintId,
      title: notification.title || "Complaint update",
      officerName:
        String(notification?.data?.subcityComplaintOfficerName || "").trim() ||
        "subcity complaint officer",
    });
    setReplySubject(
      `Re: ${String(notification.title || "Complaint escalation update").trim()}`,
    );
    setReplyMessage("");
  };

  const sendReply = async () => {
    if (!replyTarget) {
      return;
    }

    const message = replyMessage.trim();
    if (!message) {
      return;
    }

    setSendingReplyId(replyTarget.id);
    try {
      await superAdminService.contactComplaintSubcityOfficer(
        replyTarget.complaintId,
        {
          subject: replySubject.trim(),
          message,
        },
      );
      setReplyTarget(null);
      setReplySubject("");
      setReplyMessage("");
    } finally {
      setSendingReplyId("");
    }
  };

  return (
    <div className="text-[#e8f4f0] bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
        <h2 className="font-syne font-bold text-sm tracking-tight">
          Notification
        </h2>
        <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
          {loading
            ? "Loading..."
            : `${rows.length} notifications (${unreadCount} unread)`}
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
              className={`rounded-xl border p-4 transition-all ${n.isRead ? "border-[rgba(121,145,137,0.2)] bg-[rgba(106,122,116,0.08)] opacity-70" : "border-[rgba(29,158,117,0.32)] bg-[rgba(29,158,117,0.12)] shadow-[0_10px_24px_rgba(29,158,117,0.18)]"}`}
            >
              <p
                className={`font-syne text-sm ${n.isRead ? "text-[rgba(232,244,240,0.65)]" : "text-[rgba(232,244,240,0.95)]"}`}
              >
                {n.title}
              </p>
              <p
                className={`text-[10px] uppercase tracking-wide mt-1 ${n.isRead ? "text-[rgba(121,145,137,0.7)]" : "text-[rgba(29,158,117,0.95)]"}`}
              >
                {n.source === "SUPER_ADMIN"
                  ? "Super Admin Announcement"
                  : n.source === "COMPLAINT"
                    ? "Complaint Update"
                    : "Subcity Notification"}
              </p>
              <p
                className={`text-xs mt-1 whitespace-pre-wrap ${n.isRead ? "text-[rgba(232,244,240,0.45)]" : "text-[rgba(232,244,240,0.72)]"}`}
              >
                {isExpanded ? fullMessage : compactMessage}
              </p>
              {n.source === "COMPLAINT" && n.data?.complaintId && (
                <div className="mt-2 rounded-lg border border-[rgba(29,158,117,0.14)] bg-[rgba(5,20,31,0.35)] p-2.5 text-[11px] text-[rgba(232,244,240,0.6)] space-y-1">
                  <p>
                    <span className="text-[rgba(232,244,240,0.4)]">
                      Complaint ID:
                    </span>{" "}
                    {n.data.complaintId}
                  </p>
                  {n.data.complaintTitle && (
                    <p>
                      <span className="text-[rgba(232,244,240,0.4)]">
                        Title:
                      </span>{" "}
                      {n.data.complaintTitle}
                    </p>
                  )}
                  {n.data.customerName && (
                    <p>
                      <span className="text-[rgba(232,244,240,0.4)]">
                        Customer:
                      </span>{" "}
                      {n.data.customerName}
                    </p>
                  )}
                  {n.data.woredaName && (
                    <p>
                      <span className="text-[rgba(232,244,240,0.4)]">
                        Woreda:
                      </span>{" "}
                      {n.data.woredaName}
                    </p>
                  )}
                </div>
              )}
              {isLongMessage && (
                <button
                  type="button"
                  onClick={() => toggleNotificationExpansion(n.id)}
                  className="mt-2 text-[11px] font-semibold text-[#7ce4be] hover:text-[#9ef1cf]"
                >
                  {isExpanded ? "Show less ^" : "Read more v"}
                </button>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => void markAsRead(n)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(29,158,117,0.16)] text-[#5DCAA5] hover:bg-[rgba(29,158,117,0.24)]"
                  >
                    Mark as read
                  </button>
                )}
                {n.source === "COMPLAINT" && n.data?.complaintId && (
                  <button
                    type="button"
                    onClick={() => openReplyModal(n)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(129,106,245,0.16)] text-[#c4b8ff] hover:bg-[rgba(129,106,245,0.28)]"
                  >
                    Reply to Officer
                  </button>
                )}
              </div>
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

      {replyTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#05141f] border border-[rgba(29,158,117,0.2)] rounded-2xl p-5">
            <h3 className="font-syne text-base font-bold mb-1">
              Reply to Subcity Complaint Officer
            </h3>
            <p className="text-[11px] text-[rgba(232,244,240,0.45)] mb-4">
              Send update instructions for complaint {replyTarget.complaintId}{" "}
              to {replyTarget.officerName}.
            </p>

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Subject
            </label>
            <input
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0] mb-3"
            />

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Message
            </label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={6}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0]"
              placeholder="Write your reply to the complaint officer..."
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setReplyTarget(null)}
                className="px-4 py-2 rounded-lg text-xs text-[rgba(232,244,240,0.7)] border border-[rgba(232,244,240,0.2)]"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendReply()}
                disabled={
                  sendingReplyId === replyTarget.id || !replyMessage.trim()
                }
                className="px-4 py-2 rounded-lg text-xs bg-[#816AF5] text-[#02131f] font-semibold hover:bg-[#9e8ef8] disabled:opacity-50"
              >
                {sendingReplyId === replyTarget.id
                  ? "Sending..."
                  : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
