"use client";

import { useEffect, useMemo, useState } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const TEMPLATE_STORAGE_KEY = "citywater_billing_announcement_templates_v1";

const BILLING_DRAFT_TEMPLATES = [
  {
    id: "bill-ready",
    label: "Monthly bill ready",
    titleEn: "Your Monthly Water Bill Is Ready",
    titleAm: "የወርሃዊ የውሃ ክፍያዎ ዝግጁ ነው",
    messageEn:
      "Dear customer, your monthly water bill has been generated. Please check your latest statement in the app and complete payment before the due date to avoid penalties.",
    messageAm:
      "ውድ ደንበኛ፣ የወርሃዊ የውሃ ክፍያዎ ተዘጋጅቷል። እባክዎ በመተግበሪያው ውስጥ ያለውን የቅርብ መግለጫ ይመልከቱ እና ቅጣት እንዳይጨመር ከመክፈያ ቀን በፊት ክፍያውን ያጠናቁ።",
  },
  {
    id: "due-reminder",
    label: "Due date reminder",
    titleEn: "Payment Due Date Reminder",
    titleAm: "የክፍያ ጊዜ አስታዋሽ",
    messageEn:
      "Friendly reminder: your water bill payment is due soon. Please pay on time to keep your service uninterrupted.",
    messageAm:
      "የወዳጅነት አስታዋሽ፦ የውሃ ክፍያዎ የመክፈያ ጊዜ ቅርብ ነው። አገልግሎትዎ እንዳይቋረጥ በጊዜው ይክፈሉ።",
  },
  {
    id: "overdue-warning",
    label: "Overdue warning",
    titleEn: "Overdue Bill Notice",
    titleAm: "የዘገየ ክፍያ ማስጠንቀቂያ",
    messageEn:
      "Your account has an overdue balance. Please make payment immediately to avoid service suspension and additional charges.",
    messageAm:
      "በመለያዎ ላይ የዘገየ ክፍያ አለ። አገልግሎት መቋረጥን እና ተጨማሪ ክፍያዎችን ለመከላከል እባክዎ ወዲያውኑ ይክፈሉ።",
  },
  {
    id: "penalty-applied",
    label: "Penalty applied",
    titleEn: "Late Payment Penalty Applied",
    titleAm: "የዘገየ ክፍያ ቅጣት ተጨምሯል",
    messageEn:
      "A late payment penalty has been applied to your account according to billing policy. Please settle your outstanding amount as soon as possible.",
    messageAm:
      "በክፍያ ፖሊሲ መሰረት በመለያዎ ላይ የዘገየ ክፍያ ቅጣት ተጨምሯል። እባክዎ ያለውን ቀሪ ክፍያ በቅርቡ ያጠናቁ።",
  },
  {
    id: "payment-channels",
    label: "Payment channel update",
    titleEn: "Updated Payment Channels",
    titleAm: "የተዘመኑ የክፍያ መንገዶች",
    messageEn:
      "You can now complete your water bill payment using newly available channels. Please check the app payment section for details.",
    messageAm:
      "አሁን የውሃ ክፍያዎን በአዲስ የተጨመሩ መንገዶች መክፈል ይችላሉ። ዝርዝሩን ለማየት በመተግበሪያው የክፍያ ክፍል ይመልከቱ።",
  },
];

const EMOJI_OPTIONS = ["💧", "📣", "⚠️", "✅", "📅", "⏰", "💳", "🙏"];

export default function BillingAnnouncementPage() {
  const [authContext, setAuthContext] = useState({
    ready: false,
    role: "",
    subCityId: "",
  });
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("SUBCITY_USERS");
  const [woredas, setWoredas] = useState([]);
  const [selectedWoredaIds, setSelectedWoredaIds] = useState([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [expandedAnnouncementIds, setExpandedAnnouncementIds] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("EN");

  const role = authContext.role;
  const subCityId = authContext.subCityId;
  const isAuthReady = authContext.ready;
  const isSubcityBillingOfficer = role === "SUBCITY_BILLING_OFFICER";
  const requiresWoreda = targetGroup === "WOREDA_USERS";

  useEffect(() => {
    const payload = getJwtPayload() || {};
    setAuthContext({
      ready: true,
      role: payload?.role || "",
      subCityId: payload?.subCityId || "",
    });
  }, []);

  const selectedWoredaNames = useMemo(
    () =>
      woredas
        .filter((woreda) => selectedWoredaIds.includes(woreda.id))
        .map((woreda) => woreda.name),
    [selectedWoredaIds, woredas],
  );

  const allTemplates = useMemo(() => {
    const builtIn = BILLING_DRAFT_TEMPLATES.map((template) => ({
      ...template,
      source: "Billing Draft",
    }));
    const saved = customTemplates.map((template) => ({
      ...template,
      source: "Saved",
    }));
    return [...builtIn, ...saved];
  }, [customTemplates]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const result = await superAdminService.getSubcityAnnouncements(60);
      setRows(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err?.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSubcityBillingOfficer || !subCityId) {
      setRows([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [announcementRows, woredaRows] = await Promise.all([
          superAdminService.getSubcityAnnouncements(60),
          superAdminService.getWoredas(subCityId),
        ]);

        setRows(Array.isArray(announcementRows) ? announcementRows : []);
        const normalizedWoredas = Array.isArray(woredaRows?.data)
          ? woredaRows.data
          : Array.isArray(woredaRows)
            ? woredaRows
            : [];
        setWoredas(normalizedWoredas);
      } catch (err) {
        setError(err?.message || "Unable to load announcement setup data.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isSubcityBillingOfficer, subCityId]);

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
    setMessage((prev) => (prev ? `${prev} ${emoji}` : emoji));
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
    setMessageText("Template saved successfully.");
  };

  const toggleWoredaSelection = (woredaId) => {
    setSelectedWoredaIds((prev) =>
      prev.includes(woredaId)
        ? prev.filter((id) => id !== woredaId)
        : [...prev, woredaId],
    );
  };

  const toggleAnnouncementExpansion = (announcementId) => {
    setExpandedAnnouncementIds((prev) =>
      prev.includes(announcementId)
        ? prev.filter((id) => id !== announcementId)
        : [...prev, announcementId],
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

    if (requiresWoreda && !selectedWoredaIds.length) {
      setError("Please select at least one woreda.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        targetGroup,
        sendEmail,
        ...(requiresWoreda ? { targetWoredaIds: selectedWoredaIds } : {}),
      };

      const response =
        await superAdminService.createSubcityAnnouncement(payload);
      setMessageText(response?.message || "Announcement sent successfully.");
      setTitle("");
      setMessage("");
      setSelectedWoredaIds([]);
      await loadAnnouncements();
    } catch (err) {
      setError(err?.message || "Failed to send announcement.");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthReady) {
    return <div className="text-[#e8f4f0]" />;
  }

  if (!isSubcityBillingOfficer) {
    return (
      <div className="text-[#e8f4f0]">
        <div className="rounded-2xl border border-[rgba(226,75,74,0.2)] bg-[rgba(226,75,74,0.07)] px-5 py-4 text-sm text-[#ffb9b8]">
          This section is available for subcity billing officers only.
        </div>
      </div>
    );
  }

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
        <div className="mb-5">
          <h2 className="font-syne font-bold text-sm tracking-tight">
            Billing Announcement Composer
          </h2>
          <p className="mt-0.5 text-[10px] text-[rgba(232,244,240,0.3)]">
            Send in-app notifications and optional email to all users in your
            subcity or selected woredas.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4">
          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Target Group
            </span>
            <select
              value={targetGroup}
              onChange={(e) => {
                setTargetGroup(e.target.value);
                setSelectedWoredaIds([]);
              }}
              className="w-full rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all focus:border-[rgba(29,158,117,0.4)]"
            >
              <option value="SUBCITY_USERS">All users in this subcity</option>
              <option value="WOREDA_USERS">Selected woreda users</option>
            </select>
          </label>

          {requiresWoreda && (
            <div>
              <span className="mb-2 block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
                Woreda Selection
              </span>
              <div className="max-h-44 overflow-auto rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] p-3">
                {!woredas.length ? (
                  <p className="text-[11px] text-[rgba(232,244,240,0.45)]">
                    No woredas available.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {woredas.map((woreda) => {
                      const selected = selectedWoredaIds.includes(woreda.id);
                      return (
                        <button
                          key={woreda.id}
                          type="button"
                          onClick={() => toggleWoredaSelection(woreda.id)}
                          className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${selected ? "border-[#1D9E75] bg-[rgba(29,158,117,0.18)] text-[#9ff1d3]" : "border-[rgba(232,244,240,0.18)] bg-transparent text-[rgba(232,244,240,0.75)]"}`}
                        >
                          {woreda.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-[#a7f0d5]">
                  Billing Draft Messages
                </p>
                <p className="text-[10px] text-[rgba(232,244,240,0.45)]">
                  Use ready billing drafts, then adjust as needed.
                </p>
              </div>
            </div>

            <div className="max-h-52 space-y-2 overflow-auto pr-1">
              {allTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border border-[rgba(29,158,117,0.12)] bg-[rgba(5,20,31,0.8)] p-2"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Payment reminder for customers"
              className="w-full rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all placeholder-[rgba(232,244,240,0.25)] focus:border-[rgba(29,158,117,0.4)]"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Announcement Body
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Dear customers, please settle your water bill before the due date."
              className="w-full rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs text-[#e8f4f0] outline-none transition-all placeholder-[rgba(232,244,240,0.25)] focus:border-[rgba(29,158,117,0.4)]"
            />

            <div className="rounded-lg border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] p-2">
              <p className="mb-2 text-[10px] text-[rgba(232,244,240,0.45)]">
                Emoji quick insert
              </p>
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
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="w-full rounded-lg border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs text-[#e8f4f0] outline-none placeholder-[rgba(232,244,240,0.25)] focus:border-[rgba(29,158,117,0.4)]"
                />
                <select
                  value={templateLanguage}
                  onChange={(e) => setTemplateLanguage(e.target.value)}
                  className="rounded-lg border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] px-3 py-2 text-xs text-[#e8f4f0]"
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

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2 text-xs text-[rgba(232,244,240,0.72)]">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Send email copy to targeted users
          </label>

          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-[#1D9E75] px-4 py-2.5 text-xs font-semibold text-[#05141f] transition-colors hover:bg-[#5DCAA5] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending ? "Sending..." : "Send Announcement"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-3 text-[11px] text-[rgba(232,244,240,0.58)]">
          Target preview:{" "}
          {targetGroup === "SUBCITY_USERS"
            ? "All users in this subcity"
            : "Selected woreda users"}
          {selectedWoredaNames.length
            ? ` | Woredas: ${selectedWoredaNames.join(", ")}`
            : ""}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[#05141f]">
        <div className="border-b border-[rgba(29,158,117,0.08)] px-6 py-4">
          <h2 className="font-syne text-sm font-bold tracking-tight">
            Sent Announcements
          </h2>
          <p className="mt-0.5 text-[10px] text-[rgba(232,244,240,0.3)]">
            {loading ? "Loading..." : `${rows.length} announcements`}
          </p>
        </div>

        <div className="space-y-3 px-6 py-4">
          {rows.map((item) => {
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-syne text-sm text-[rgba(232,244,240,0.9)]">
                    {item.title || "Announcement"}
                  </p>
                  <span className="text-[10px] text-[#7ce4be]">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ""}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-xs text-[rgba(232,244,240,0.55)]">
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

                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[rgba(232,244,240,0.45)]">
                  <span>Recipients: {item.targetUserCount ?? 0}</span>
                  <span>Read: {item.readCount ?? 0}</span>
                </div>
              </div>
            );
          })}

          {!loading && !rows.length && (
            <p className="text-[10px] text-[rgba(232,244,240,0.35)]">
              No announcements available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
