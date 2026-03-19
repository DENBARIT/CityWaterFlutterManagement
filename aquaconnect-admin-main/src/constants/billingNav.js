export const BILLING_NAV = [
  {
    section: "Main",
    items: [
      { label: "Overview", icon: "⬛", href: "/billing" },
      {
        label: "Change Password",
        icon: "🔐",
        href: "/billing/change-password",
      },
    ],
  },
  {
    section: "Announcement",
    items: [
      { label: "Announcement", icon: "📣", href: "/billing/announcement" },
    ],
  },
  {
    section: "OCR",
    items: [{ label: "OCR Window", icon: "📊", href: "/billing/readings" }],
  },
  {
    section: "Meter",
    items: [{ label: "Meter", icon: "📟", href: "/billing/meters" }],
  },
  {
    section: "Billing",
    items: [{ label: "Consumption", icon: "💧", href: "/billing/consumption" }],
  },
  {
    section: "Reports",
    items: [{ label: "Billing Report", icon: "📄", href: "/billing/report" }],
  },
];

export const BILLING_PAGE_META = {
  "/billing": {
    title: "Overview",
    sub: "Welcome back, Billing Officer",
    action: "",
  },
  "/billing/change-password": {
    title: "Change Password",
    sub: "Update your account password securely",
    action: "",
  },
  "/billing/announcement": {
    title: "Announcement",
    sub: "Manage billing announcements",
    action: "",
  },
  "/billing/meters": {
    title: "Meter",
    sub: "View meters under your woreda",
    action: "",
  },
  "/billing/readings": {
    title: "OCR Window",
    sub: "View OCR meter readings",
    action: "",
  },
  "/billing/consumption": {
    title: "Consumption",
    sub: "Track water consumption totals",
    action: "",
  },
  "/billing/report": {
    title: "Billing Report",
    sub: "Billing summary in your assigned area",
    action: "Export CSV",
  },
};
