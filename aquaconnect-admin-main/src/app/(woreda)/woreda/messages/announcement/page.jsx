"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const TEMPLATE_STORAGE_KEY = "citywater_woreda_announcement_templates_v1";

const BUILT_IN_TEMPLATES = [
  {
    id: "water-shortage",
    label: "Water Shortage",
    titleEn: "Temporary Water Shortage Notice",
    titleAm: "የጊዜያዊ የውሃ እጥረት ማስታወቂያ",
    messageEn:
      "Dear residents, due to limited supply capacity, some areas may experience low pressure or temporary interruption. Our team is working to restore stable service as soon as possible. Thank you for your patience.",
    messageAm:
      "ውድ ነዋሪዎች፣ በአቅርቦት አቅም ጉድለት ምክንያት በአንዳንድ አካባቢዎች ዝቅተኛ ግፊት ወይም ጊዜያዊ መቋረጥ ሊኖር ይችላል። ቡድናችን አገልግሎቱን በፍጥነት ለመመለስ በስራ ላይ ነው። ለትዕግስታችሁ እናመሰግናለን።",
  },
  {
    id: "service-update",
    label: "Service Update",
    titleEn: "Woreda Service Update",
    titleAm: "የወረዳ አገልግሎት ዝመና",
    messageEn:
      "We are sharing an update regarding water service, maintenance work, and upcoming improvements in your woreda. Please review the details below and stay informed.",
    messageAm:
      "በወረዳዎ ውስጥ ስለ የውሃ አገልግሎት፣ የጥገና ስራ እና የሚቀጥሉ ማሻሻያዎች ዝመና እንጋራለን። እባክዎ ከታች ያለውን ዝርዝር ይመልከቱ እና ተከታተሉ።",
  },
  {
    id: "maintenance",
    label: "Maintenance Window",
    titleEn: "Planned Maintenance Notice",
    titleAm: "የታቀደ የጥገና ማስታወቂያ",
    messageEn:
      "Please note that water service may be interrupted temporarily due to planned maintenance work. We apologize for the inconvenience and will restore service as soon as possible.",
    messageAm:
      "በታቀደ የጥገና ስራ ምክንያት የውሃ አገልግሎት ለጊዜው ሊቋረጥ ይችላል። ለሚፈጠረው እንግዳነት ይቅርታ እንጠይቃለን፣ አገልግሎቱንም በቅርቡ እንመልሳለን።",
  },
  {
    id: "holiday",
    label: "Holiday Greeting",
    titleEn: "Holiday Greetings from Your Woreda Office",
    titleAm: "ከወረዳ ጽ/ቤት የበዓል ሰላምታ",
    messageEn:
      "Warm holiday wishes to every household in our woreda. We remain committed to serving you with reliable water services throughout the holiday season.",
    messageAm:
      "በወረዳችን ያሉ ሁሉንም ቤተሰቦች የሞቅ የበዓል ሰላምታ እንልካለን። በበዓል ወቅትም ታማኝ የውሃ አገልግሎት ለመስጠት ቁርጠኞች ነን።",
  },
];

const EMOJI_OPTIONS = [
  "💧",
  "📣",
  "⚠️",
  "✅",
  "🛠️",
  "🚰",
  "📅",
  "⏰",
  "🙏",
  "🎉",
  "📍",
  "🔔",
];

const readWoredaId = (source) => {
  if (!source) {
    return "";
  }

  const candidates = [
    source?.woredaId,
    source?.scopeWoredaId,
    source?.woreda?.id,
    source?.woreda?._id,
    source?.user?.woredaId,
    source?.user?.scopeWoredaId,
    source?.user?.woreda?.id,
    source?.data?.woredaId,
    source?.data?.woreda?.id,
  ];

  return String(candidates.find((candidate) => candidate) || "").trim();
};

const readWoredaName = (source) => {
  if (!source) {
    return "";
  }

  const candidates = [
    source?.woredaName,
    source?.woreda?.name,
    source?.user?.woredaName,
    source?.user?.woreda?.name,
    source?.data?.woredaName,
    source?.data?.woreda?.name,
  ];

  return String(candidates.find((candidate) => candidate) || "").trim();
};

export default function WoredaAnnouncementPage() {
  const [woredaId, setWoredaId] = useState(() => readWoredaId(getJwtPayload()));
  const [woredaName, setWoredaName] = useState(
    () => readWoredaName(getJwtPayload()) || "your woreda",
  );

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("EN");
  const [expandedAnnouncementIds, setExpandedAnnouncementIds] = useState([]);
  const [emojiTarget, setEmojiTarget] = useState("BODY");

  const allTemplates = useMemo(() => {
    const builtIn = BUILT_IN_TEMPLATES.map((template) => ({
      ...template,
      source: "Draft",
    }));
    const saved = customTemplates.map((template) => ({
      ...template,
      source: "Saved",
    }));
    return [...builtIn, ...saved];
  }, [customTemplates]);

  const selectedMessageScope = `Woreda users in ${woredaName}`;

  const loadAnnouncements = async () => {
    if (!woredaId) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const result = await superAdminService.getSubcityAnnouncements(60);
      const normalized = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setRows(normalized);
    } catch (err) {
      setError(err?.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, [woredaId]);

  useEffect(() => {
    if (woredaId) {
      return;
    }

    let cancelled = false;

    const resolveFromProfile = async () => {
      try {
        const profile = await apiRequest("/auth/me", { useAuth: true });
        const profileWoredaId = readWoredaId(profile);
        const profileWoredaName = readWoredaName(profile);

        if (!cancelled && profileWoredaId) {
          setWoredaId(profileWoredaId);
        }

        if (!cancelled && profileWoredaName) {
          setWoredaName(profileWoredaName);
        }
      } catch (_error) {
        // Keep current state; submit path handles unresolved woreda context.
      }
    };

    void resolveFromProfile();

    return () => {
      cancelled = true;
    };
  }, [woredaId]);

  useEffect(() => {
    if (!messageText && !error) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessageText("");
      setError("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [messageText, error]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCustomTemplates(parsed);
      }
    } catch {
      // Ignore malformed local template cache.
    }
  }, []);

  const persistTemplates = (nextTemplates) => {
    setCustomTemplates(nextTemplates);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        TEMPLATE_STORAGE_KEY,
        JSON.stringify(nextTemplates),
      );
    }
  };

  const applyTemplate = (template, language) => {
    const isAm = language === "AM";
    const templateTitle = isAm ? template.titleAm : template.titleEn;
    const templateMessage = isAm ? template.messageAm : template.messageEn;

    setTitle(templateTitle || template.titleEn || template.titleAm || "");
    setMessage(
      templateMessage || template.messageEn || template.messageAm || "",
    );
    setMessageText("Template applied to the announcement draft.");
  };

  const copyTemplate = async (template, language) => {
    const isAm = language === "AM";
    const templateTitle = isAm ? template.titleAm : template.titleEn;
    const templateMessage = isAm ? template.messageAm : template.messageEn;
    const content = `${templateTitle}\n\n${templateMessage}`.trim();

    try {
      await navigator.clipboard.writeText(content);
      setMessageText("Template copied. You can paste and adjust it.");
    } catch {
      setError("Unable to copy template. Please copy manually.");
    }
  };

  const appendEmoji = (emoji) => {
    if (emojiTarget === "TITLE") {
      setTitle((prev) => (prev ? `${prev} ${emoji}` : emoji));
      return;
    }

    setMessage((prev) => (prev ? `${prev} ${emoji}` : emoji));
  };

  const splitDraftContent = (text) => {
    const normalized = (text || "").replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return null;
    }

    const lines = normalized.split("\n");
    const titleLine = (lines[0] || "").trim();
    const body = lines.slice(1).join("\n").trim();

    if (!titleLine || !body) {
      return null;
    }

    return { title: titleLine, body };
  };

  const handleDraftPaste = (event) => {
    const pasted = event.clipboardData?.getData("text") || "";
    const parsed = splitDraftContent(pasted);
    if (!parsed) {
      return;
    }

    event.preventDefault();
    setTitle(parsed.title);
    setMessage(parsed.body);
    setMessageText("Draft pasted into title and body.");
    setError("");
  };

  const saveCurrentAsTemplate = () => {
    setError("");

    if (!templateName.trim()) {
      setError("Template name is required.");
      return;
    }

    if (!title.trim() || !message.trim()) {
      setError("Write title and body before saving a template.");
      return;
    }

    const isAm = templateLanguage === "AM";
    const nextTemplate = {
      id: `saved-${Date.now()}`,
      label: templateName.trim(),
      titleEn: isAm ? "" : title.trim(),
      titleAm: isAm ? title.trim() : "",
      messageEn: isAm ? "" : message.trim(),
      messageAm: isAm ? message.trim() : "",
    };

    const nextTemplates = [nextTemplate, ...customTemplates];
    persistTemplates(nextTemplates);
    setTemplateName("");
    setMessageText("Draft saved as reusable template.");
  };

  const toggleAnnouncementExpansion = (announcementId) => {
    setExpandedAnnouncementIds((prev) =>
      prev.includes(announcementId)
        ? prev.filter((id) => id !== announcementId)
        : [...prev, announcementId],
    );
  };

  const normalizeAnnouncementRows = (items) => {
    return items
      .filter((item) => {
        const targetGroup = String(item.targetGroup || "").toUpperCase();
        const targetWoredaIds = Array.isArray(item.targetWoredaIds)
          ? item.targetWoredaIds.map(String)
          : [];

        if (!targetGroup && targetWoredaIds.length === 0) {
          return true;
        }

        if (targetGroup.includes("WOREDA")) {
          if (!targetWoredaIds.length) {
            return true;
          }

          return targetWoredaIds.includes(String(woredaId));
        }

        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
  };

  const handleSendAnnouncement = async (event) => {
    event.preventDefault();
    setError("");
    setMessageText("");

    if (!title.trim()) {
      setError("Announcement title is required.");
      return;
    }

    if (!message.trim()) {
      setError("Announcement body is required.");
      return;
    }

    setSending(true);
    try {
      let resolvedWoredaId = woredaId;

      if (!resolvedWoredaId) {
        resolvedWoredaId = readWoredaId(getJwtPayload());
      }

      if (!resolvedWoredaId) {
        const profile = await apiRequest("/auth/me", { useAuth: true });
        resolvedWoredaId = readWoredaId(profile);
        const profileWoredaName = readWoredaName(profile);
        if (profileWoredaName) {
          setWoredaName(profileWoredaName);
        }
      }

      if (!resolvedWoredaId) {
        setError("Unable to detect your woreda.");
        return;
      }

      if (resolvedWoredaId !== woredaId) {
        setWoredaId(resolvedWoredaId);
      }

      const payload = {
        title: title.trim(),
        message: message.trim(),
        targetGroup: "WOREDA_USERS",
        sendEmail,
        targetWoredaIds: [resolvedWoredaId],
      };

      const response =
        await superAdminService.createSubcityAnnouncement(payload);
      setMessageText(response?.message || "Announcement sent successfully.");
      setTitle("");
      setMessage("");
      await loadAnnouncements();
    } catch (err) {
      setError(err?.message || "Failed to send announcement.");
    } finally {
      setSending(false);
    }
  };

  const visibleAnnouncements = normalizeAnnouncementRows(rows);

  return (
    <div className="text-[#e8f4f0]">
      {messageText && (
        <div className="mb-4 rounded-xl border border-[rgba(29,158,117,0.35)] bg-[rgba(29,158,117,0.08)] px-4 py-3 text-xs text-[#7ce4be]">
          {messageText}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-4 py-3 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSendAnnouncement}
        className="mb-6 rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f] p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Message Center
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              Send woreda announcements as in-app notifications to users in your
              woreda.
            </p>
          </div>
          <div className="rounded-full border border-[rgba(29,158,117,0.18)] bg-[rgba(29,158,117,0.06)] px-3 py-1 text-[10px] text-[#9ff1d3]">
            Recipients: {selectedMessageScope}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] p-3">
            <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold text-[#a7f0d5]">
                  Draft Templates
                </p>
                <p className="text-[10px] text-[rgba(232,244,240,0.45)]">
                  Pick EN/AM templates, copy, then adjust quickly.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-52 overflow-auto pr-1">
              {allTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border border-[rgba(29,158,117,0.12)] bg-[rgba(5,20,31,0.8)] p-2"
                >
                  <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[11px] font-semibold text-[#e8f4f0]">
                      {template.label}
                    </p>
                    <span className="text-[10px] text-[rgba(232,244,240,0.5)]">
                      {template.source}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyTemplate(template, "EN")}
                      className="rounded-md border border-[rgba(29,158,117,0.35)] px-2 py-1 text-[10px] text-[#9ff1d3] hover:bg-[rgba(29,158,117,0.16)]"
                    >
                      Use EN
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplate(template, "AM")}
                      className="rounded-md border border-[rgba(29,158,117,0.35)] px-2 py-1 text-[10px] text-[#9ff1d3] hover:bg-[rgba(29,158,117,0.16)]"
                    >
                      Use AM
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTemplate(template, "EN")}
                      className="rounded-md border border-[rgba(232,244,240,0.2)] px-2 py-1 text-[10px] text-[rgba(232,244,240,0.78)] hover:bg-[rgba(232,244,240,0.08)]"
                    >
                      Copy EN
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTemplate(template, "AM")}
                      className="rounded-md border border-[rgba(232,244,240,0.2)] px-2 py-1 text-[10px] text-[rgba(232,244,240,0.78)] hover:bg-[rgba(232,244,240,0.08)]"
                    >
                      Copy AM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Announcement Title
            </span>
            <input
              suppressHydrationWarning
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPaste={handleDraftPaste}
              placeholder="Service update for woreda users"
              autoComplete="off"
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.25)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Announcement Body
            </span>
            <textarea
              suppressHydrationWarning
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handleDraftPaste}
              rows={6}
              placeholder="Dear users, water service will be interrupted today from 2PM to 6PM due to maintenance works."
              autoComplete="off"
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.25)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />

            <div className="rounded-lg border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[10px] text-[rgba(232,244,240,0.45)]">
                  Emoji quick insert
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[rgba(232,244,240,0.55)]">
                  <button
                    type="button"
                    onClick={() => setEmojiTarget("TITLE")}
                    className={`rounded-full px-2 py-1 ${emojiTarget === "TITLE" ? "bg-[rgba(29,158,117,0.18)] text-[#9ff1d3]" : "bg-transparent"}`}
                  >
                    Title
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmojiTarget("BODY")}
                    className={`rounded-full px-2 py-1 ${emojiTarget === "BODY" ? "bg-[rgba(29,158,117,0.18)] text-[#9ff1d3]" : "bg-transparent"}`}
                  >
                    Body
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => appendEmoji(emoji)}
                    className="h-7 w-7 rounded-md border border-[rgba(29,158,117,0.2)] bg-[rgba(29,158,117,0.06)] text-sm hover:bg-[rgba(29,158,117,0.16)]"
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] p-3">
              <p className="mb-2 text-[11px] font-semibold text-[#a7f0d5]">
                Save current writing as template
              </p>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                <input
                  suppressHydrationWarning
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name (e.g. Woreda maintenance alert)"
                  autoComplete="off"
                  className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.25)] outline-none focus:border-[rgba(29,158,117,0.4)]"
                />
                <select
                  suppressHydrationWarning
                  value={templateLanguage}
                  onChange={(e) => setTemplateLanguage(e.target.value)}
                  className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0]"
                >
                  <option value="EN">Save as EN</option>
                  <option value="AM">Save as AM</option>
                </select>
                <button
                  type="button"
                  onClick={saveCurrentAsTemplate}
                  className="rounded-lg border border-[rgba(29,158,117,0.35)] px-3 py-2 text-xs font-semibold text-[#9ff1d3] hover:bg-[rgba(29,158,117,0.16)]"
                >
                  Save Template
                </button>
              </div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <label className="inline-flex items-center gap-2 text-xs text-[rgba(232,244,240,0.72)]">
            <input
              suppressHydrationWarning
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Send email copy to the woreda users
          </label>

          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-[#1D9E75] px-4 py-2.5 text-xs font-semibold text-[#05141f] hover:bg-[#5DCAA5] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending ? "Sending..." : "Send Announcement"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-3 text-[11px] text-[rgba(232,244,240,0.58)]">
          Target preview: {selectedMessageScope}
        </div>
      </form>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <h2 className="font-syne font-bold text-sm tracking-tight">
            Sent Announcements
          </h2>
          <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
            {loading
              ? "Loading..."
              : `${visibleAnnouncements.length} announcements`}
          </p>
        </div>
        <div className="px-6 py-4 space-y-3">
          {visibleAnnouncements.map((item) => {
            const fullMessage = item.message || item.body || "";
            const isExpanded = expandedAnnouncementIds.includes(item.id);
            const isLongMessage = fullMessage.length > 240;
            const compactMessage = isLongMessage
              ? `${fullMessage.slice(0, 240).trimEnd()}...`
              : fullMessage;

            return (
              <div
                key={item.id || `${item.title}-${item.createdAt}`}
                className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-4"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-syne text-sm text-[rgba(232,244,240,0.9)]">
                    {item.title || "Announcement"}
                  </p>
                  <span className="text-[10px] text-[#7ce4be]">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-[rgba(232,244,240,0.55)] mt-2 whitespace-pre-wrap">
                  {isExpanded ? fullMessage : compactMessage}
                </p>
                {isLongMessage && (
                  <button
                    type="button"
                    onClick={() => toggleAnnouncementExpansion(item.id)}
                    className="mt-2 text-[11px] font-semibold text-[#7ce4be] hover:text-[#9ef1cf]"
                  >
                    {isExpanded ? "Show less" : "Read full message"}
                  </button>
                )}
                <div className="mt-3 text-[10px] text-[rgba(232,244,240,0.45)] flex flex-wrap gap-3">
                  <span>Recipients: {item.targetUserCount ?? 0}</span>
                  <span>Read: {item.readCount ?? 0}</span>
                </div>
              </div>
            );
          })}
          {!loading && !visibleAnnouncements.length && (
            <p className="text-[10px] text-[rgba(232,244,240,0.35)]">
              No announcements available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
