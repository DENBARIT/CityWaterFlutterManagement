export const NAV = [
  {
    section: "Main",
    items: [
      { label: "Overview", icon: "⬛", href: "/dashboard" },
      {
        label: "Change Password",
        icon: "🔐",
        action: "change-password",
      },
    ],
  },
  {
    section: "Admin Management",
    items: [
      { label: "Super Admins", icon: "👑", href: "/dashboard/super-admins" },
      {
        label: "Subcity Admins",
        icon: "🏙️",
        href: "/dashboard/subcity-admins",
      },
      {
        label: "Woreda Admins",
        icon: "🏛️",
        href: "/dashboard/woreda-admins",
      },
      {
        label: "Complaint Officers",
        icon: "🧰",
        href: "/dashboard/complaint-officers",
      },
      {
        label: "Billing Officers",
        icon: "🧾",
        href: "/dashboard/billing-officers",
      },
    ],
  },
  {
    section: "Announcement",
    items: [
      { label: "Announcement", icon: "📣", href: "/dashboard/announcement" },
    ],
  },
  {
    section: "OCR",
    items: [{ label: "OCR Window", icon: "📊", href: "/dashboard/readings" }],
  },
  {
    section: "Meter",
    items: [{ label: "Meter", icon: "📟", href: "/dashboard/meters" }],
  },
  {
    section: "Location",
    items: [
      { label: "Subcity", icon: "🏙️", href: "/dashboard/subcities" },
      { label: "Woreda", icon: "📍", href: "/dashboard/woredas" },
    ],
  },
  {
    section: "Users",
    items: [
      { label: "All Users", icon: "👥", href: "/dashboard/users" },
      {
        label: "Users By Location",
        icon: "📍",
        href: "/dashboard/users/location",
      },
    ],
  },
  {
    section: "Complaints",
    items: [{ label: "Complaints", icon: "📋", href: "/dashboard/complaints" }],
  },
  {
    section: "Billing",
    items: [
      { label: "Bills", icon: "📄", href: "/dashboard/billing" },
      { label: "Tariff", icon: "💰", href: "/dashboard/tariff" },
      { label: "Consumption", icon: "💧", href: "/dashboard/consumption" },
    ],
  },
  {
    section: "Statistics",
    items: [
      {
        label: "Statistics",
        icon: "📈",
        href: "/dashboard/statistics",
      },
    ],
  },
];

export const PAGE_META = {
  "/dashboard": {
    title: "Overview",
    sub: "Welcome back, System Admin",
    action: "",
  },
  "/dashboard/statistics": {
    title: "Statistics",
    sub: "Graphs, charts and detailed operational data",
    action: "",
  },
  "/dashboard/super-admins": {
    title: "Super Admins",
    sub: "Manage system administrators",
    action: "",
  },
  "/dashboard/subcity-admins": {
    title: "Subcity Admins",
    sub: "Manage subcity administrators",
    action: "",
  },
  "/dashboard/woreda-admins": {
    title: "Woreda Admins",
    sub: "View woreda administrators registered by subcity admins",
    action: "",
  },
  "/dashboard/announcement": {
    title: "Announcement",
    sub: "Manage dashboard announcements",
    action: "",
  },
  "/dashboard/readings": {
    title: "OCR Window",
    sub: "View OCR meter readings",
    action: "",
  },
  "/dashboard/meters": {
    title: "Meter",
    sub: "Manage meters in the system",
    action: "",
  },
  "/dashboard/subcities": {
    title: "Subcity",
    sub: "Create, update and delete subcities",
    action: "+ Add Subcity",
  },
  "/dashboard/woredas": {
    title: "Woreda",
    sub: "Create, update and delete woredas",
    action: "",
  },
  "/dashboard/complaints": {
    title: "Complaints",
    sub: "View and update complaint status",
    action: "",
  },
  "/dashboard/complaint-officers": {
    title: "Complaint Officers",
    sub: "View complaint officers",
    action: "",
  },
  "/dashboard/billing-officers": {
    title: "Billing Officers",
    sub: "View billing officers",
    action: "",
  },
  "/dashboard/users": {
    title: "All Users",
    sub: "View all registered customers",
    action: "",
  },
  "/dashboard/users/location": {
    title: "Users By Location",
    sub: "Filter users by subcity and woreda",
    action: "",
  },
  "/dashboard/billing": {
    title: "Bills",
    sub: "View billing summaries",
    action: "Export CSV",
  },
  "/dashboard/consumption": {
    title: "Consumption",
    sub: "Track consumption totals",
    action: "",
  },
  "/dashboard/tariff": {
    title: "Tariff",
    sub: "Manage water tariff pricing",
    action: "+ Set Tariff",
  },
};
