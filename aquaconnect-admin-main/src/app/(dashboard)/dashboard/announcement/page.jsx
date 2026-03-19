"use client";

import { useEffect, useMemo, useState } from "react";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const TEMPLATE_STORAGE_KEY = "citywater_superadmin_announcement_templates_v1";

const BUILT_IN_TEMPLATES = [
  {
    id: "water-shortage",
    label: "Water Shortage",
    titleEn: "Temporary Water Shortage Notice",
    titleAm: "የጊዜያዊ የውሃ እጥረት ማስታወቂያ",
    messageEn:
      "Dear customers, due to limited supply capacity, some areas may experience low pressure or temporary interruption. Our team is working to restore stable service as soon as possible. Thank you for your patience.",
    messageAm:
      "ውድ ደንበኞቻችን፣ በአቅርቦት አቅም ጉድለት ምክንያት በአንዳንድ አካባቢዎች ዝቅተኛ ግፊት ወይም ጊዜያዊ መቋረጥ ሊኖር ይችላል። ቡድናችን አገልግሎቱን በፍጥነት ለመመለስ በስራ ላይ ነው። ለትዕግስታችሁ እናመሰግናለን።",
  },
  {
    id: "yearly-announcement",
    label: "Yearly Announcement",
    titleEn: "Yearly Service Update",
    titleAm: "ዓመታዊ የአገልግሎት ዝመና",
    messageEn:
      "We are pleased to share this year's water service progress, maintenance achievements, and upcoming improvement plans. Thank you for your continued trust and cooperation.",
    messageAm:
      "የዚህ ዓመት የውሃ አገልግሎት ሂደት፣ የጥገና ስኬቶች እና የሚቀጥሉ የማሻሻያ እቅዶችን በደስታ እናጋራለን። ለቀጣይ ድጋፋችሁ እና መተባበራችሁ እናመሰግናለን።",
  },
  {
    id: "holiday-wish",
    label: "Holiday Wishes",
    titleEn: "Holiday Greetings from City Water",
    titleAm: "ከከተማ ውሃ የበዓል ሰላምታ",
    messageEn:
      "Warm holiday wishes to you and your family. We remain committed to serving you with reliable water services throughout the holiday season.",
    messageAm:
      "ለእርስዎ እና ለቤተሰብዎ የሞቅ የበዓል መልካም ምኞት እንልካለን። በበዓል ወቅትም ታማኝ የውሃ አገልግሎት ለመስጠት ቁርጠኞች ነን።",
  },
  {
    id: "tank-cleaning-shutdown",
    label: "Water Off for Tank Cleaning",
    titleEn: "Temporary Water Interruption for Tank Cleaning",
    titleAm: "ለውሃ ታንከር ጽዳት ጊዜያዊ የውሃ መቋረጥ",
    messageEn:
      "Please be informed that water service will be temporarily interrupted due to scheduled water tank cleaning and sanitization. Service will resume once cleaning is completed.",
    messageAm:
      "የታቀደ የውሃ ታንከር ጽዳት እና ማንጻት ስራ ምክንያት የውሃ አገልግሎት ለጊዜው እንደሚቋረጥ እናሳውቃለን። ስራው ከተጠናቀቀ በኋላ አገልግሎቱ ይመለሳል።",
  },
  {
    id: "infrastructure-problem",
    label: "Infrastructure Problems",
    titleEn: "Service Disruption Due to Infrastructure Issue",
    titleAm: "በመሠረተ ልማት ችግር ምክንያት የአገልግሎት መቋረጥ",
    messageEn:
      "A pipeline/network infrastructure issue has affected normal water distribution in some areas. Technical teams are on-site and working on urgent restoration.",
    messageAm:
      "በቧንቧ/ኔትወርክ መሠረተ ልማት ችግር ምክንያት በአንዳንድ አካባቢዎች መደበኛ የውሃ ስርጭት ተጎድቷል። ቴክኒክ ቡድኖቻችን በቦታው ላይ ሆነው አስቸኳይ ማስተካከያ ላይ ናቸው።",
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
  "🏗️",
  "📍",
];

export default function DashboardAnnouncementPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("ALL_USERS");
  const [subCities, setSubCities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [selectedSubCityId, setSelectedSubCityId] = useState("");
  const [selectedWoredaIds, setSelectedWoredaIds] = useState([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("EN");
  const [expandedAnnouncementIds, setExpandedAnnouncementIds] = useState([]);
  const [emojiTarget, setEmojiTarget] = useState("BODY");

  const requiresSubCity =
    targetGroup === "SUBCITY_USERS" ||
    targetGroup === "SUBCITY_ADMINS" ||
    targetGroup === "SUBCITY_USERS_AND_ADMINS" ||
    targetGroup === "OFFICERS";

  const requiresWoreda =
    targetGroup === "WOREDA_USERS" || targetGroup === "WOREDA_ADMINS";

  const groupOptions = [
    { value: "ALL_USERS", label: "All users" },
    { value: "SUBCITY_USERS", label: "Respective subcity users" },
    { value: "WOREDA_USERS", label: "Respective woreda users / woredas users" },
    { value: "SUBCITY_ADMINS", label: "Subcity admins" },
    { value: "WOREDA_ADMINS", label: "Respective woreda admins" },
    { value: "OFFICERS", label: "Officers" },
    {
      value: "SUBCITY_USERS_AND_ADMINS",
      label: "Subcity users + subcity admins",
    },
  ];

  const selectedSubCityName = useMemo(
    () => subCities.find((city) => city.id === selectedSubCityId)?.name || "",
    [selectedSubCityId, subCities],
  );

  const selectedWoredaNames = useMemo(
    () =>
      woredas
        .filter((woreda) => selectedWoredaIds.includes(woreda.id))
        .map((woreda) => woreda.name),
    [selectedWoredaIds, woredas],
  );

  const allTemplates = useMemo(() => {
    const builtIn = BUILT_IN_TEMPLATES.map((template) => ({
      ...template,
      source: "Built-in",
    }));
    const saved = customTemplates.map((template) => ({
      ...template,
      source: "Saved",
    }));
    return [...builtIn, ...saved];
  }, [customTemplates]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const rows = await superAdminService.getAnnouncements(60);
      setAnnouncements(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [cities] = await Promise.all([
          superAdminService.getSubCities(),
          loadAnnouncements(),
        ]);
        const normalizedCities = Array.isArray(cities?.data)
          ? cities.data
          : Array.isArray(cities)
            ? cities
            : [];
        setSubCities(normalizedCities);
      } catch (err) {
        setError(err?.message || "Unable to load announcement setup data.");
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedSubCityId) {
      setWoredas([]);
      setSelectedWoredaIds([]);
      return;
    }

    const loadWoredas = async () => {
      try {
        const rows = await superAdminService.getWoredas(selectedSubCityId);
        const normalized = Array.isArray(rows?.data)
          ? rows.data
          : Array.isArray(rows)
            ? rows
            : [];
        setWoredas(normalized);
        setSelectedWoredaIds((prev) =>
          prev.filter((id) => normalized.some((w) => w.id === id)),
        );
      } catch (err) {
        setError(err?.message || "Unable to load woredas.");
      }
    };

    void loadWoredas();
  }, [selectedSubCityId]);

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
    if (!titleLine) {
      return null;
    }

    const body = lines.slice(1).join("\n").trim();
    if (!body) {
      return null;
    }

    return {
      title: titleLine,
      body,
    };
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

  const handleTargetGroupChange = (nextValue) => {
    setTargetGroup(nextValue);
    setSelectedWoredaIds([]);
    if (
      nextValue !== "SUBCITY_USERS" &&
      nextValue !== "SUBCITY_ADMINS" &&
      nextValue !== "SUBCITY_USERS_AND_ADMINS" &&
      nextValue !== "OFFICERS"
    ) {
      setSelectedSubCityId("");
      setWoredas([]);
    }
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

    if (requiresSubCity && !selectedSubCityId) {
      setError("Please select a subcity for this target group.");
      return;
    }

    if (requiresWoreda && selectedWoredaIds.length === 0) {
      setError("Please select at least one woreda for this target group.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        targetGroup,
        sendEmail,
        ...(selectedSubCityId ? { subCityId: selectedSubCityId } : {}),
        ...(selectedWoredaIds.length
          ? { targetWoredaIds: selectedWoredaIds }
          : {}),
      };

      const response = await superAdminService.createAnnouncement(payload);
      setMessageText(response?.message || "Announcement send");
      setTitle("");
      setMessage("");
      await loadAnnouncements();
    } catch (err) {
      const message = String(err?.message || "");
      if (/forbidden/i.test(message)) {
        setError(
          "Forbidden: this action requires a SUPER_ADMIN account. Please sign out and sign in as super admin.",
        );
      } else {
        setError(message || "Failed to send announcement.");
      }
    } finally {
      setSending(false);
    }
  };

  if (!isMounted) {
    return <div className="text-[#e8f4f0]" />;
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
            Super Admin Announcement Composer
          </h2>
          <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
            Select recipients, prepare title/body, and send as in-app
            notifications plus email for admins/officers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Target Group
            </span>
            <select
              value={targetGroup}
              onChange={(e) => handleTargetGroupChange(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            >
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Subcity (if required)
            </span>
            <select
              value={selectedSubCityId}
              onChange={(e) => setSelectedSubCityId(e.target.value)}
              disabled={!requiresSubCity && !requiresWoreda}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all disabled:opacity-50"
            >
              <option value="">Select subcity</option>
              {subCities.map((subCity) => (
                <option key={subCity.id} value={subCity.id}>
                  {subCity.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {requiresWoreda && (
          <div className="mb-4">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-2">
              Woreda Selection (single or multiple)
            </span>
            <div className="rounded-xl border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.04)] p-3 max-h-44 overflow-auto">
              {!woredas.length ? (
                <p className="text-[11px] text-[rgba(232,244,240,0.45)]">
                  Select subcity first to load woredas.
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
              Announcement Title (placeholder: Service update for customers)
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPaste={handleDraftPaste}
              placeholder="Service update for customers"
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.25)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
              Announcement Body (placeholder: Dear customers, water supply will
              be interrupted today from 2PM to 6PM...)
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handleDraftPaste}
              rows={5}
              placeholder="Dear customers, water supply will be interrupted today from 2PM to 6PM due to maintenance works."
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-xl px-3 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.25)] outline-none focus:border-[rgba(29,158,117,0.4)] transition-all"
            />

            <div className="rounded-lg border border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.03)] p-2">
              <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[10px] text-[rgba(232,244,240,0.45)]">
                  Emoji quick insert
                </p>
                <select
                  value={emojiTarget}
                  onChange={(e) => setEmojiTarget(e.target.value)}
                  className="rounded-md border border-[rgba(29,158,117,0.2)] bg-[rgba(29,158,117,0.08)] px-2 py-1 text-[10px] text-[#e8f4f0]"
                >
                  <option value="BODY">Insert in body</option>
                  <option value="TITLE">Insert in title</option>
                </select>
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
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name (e.g. Urgent maintenance alert)"
                  className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0] placeholder-[rgba(232,244,240,0.25)] outline-none focus:border-[rgba(29,158,117,0.4)]"
                />
                <select
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
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Send email to admin/officer recipients
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
          Target preview: {targetGroup.replaceAll("_", " ")}
          {selectedSubCityName ? ` | Subcity: ${selectedSubCityName}` : ""}
          {selectedWoredaNames.length
            ? ` | Woredas: ${selectedWoredaNames.join(", ")}`
            : ""}
        </div>
      </form>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              Sent Announcements
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              Track recent announcements and delivery targets
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-3 text-sm text-[rgba(232,244,240,0.72)]">
          {loading ? (
            <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-4 text-xs text-[rgba(232,244,240,0.55)]">
              Loading announcements...
            </div>
          ) : !announcements.length ? (
            <div className="rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-4 text-xs text-[rgba(232,244,240,0.55)]">
              No announcements have been created yet.
            </div>
          ) : (
            announcements.map((item) => {
              const fullMessage = item.message || "";
              const isExpanded = expandedAnnouncementIds.includes(item.id);
              const isLongMessage = fullMessage.length > 240;
              const compactMessage = isLongMessage
                ? `${fullMessage.slice(0, 240).trimEnd()}...`
                : fullMessage;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[rgba(29,158,117,0.12)] bg-[rgba(29,158,117,0.03)] p-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-syne text-sm font-bold text-[#e8f4f0]">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-[#7ce4be]">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgba(232,244,240,0.75)] whitespace-pre-wrap">
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
                    <span>Audience: {item.audience || "ALL"}</span>
                    <span>Recipients: {item.targetUserCount ?? 0}</span>
                    <span>Read: {item.readCount ?? 0}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
