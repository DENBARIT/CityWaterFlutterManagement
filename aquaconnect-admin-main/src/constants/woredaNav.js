export const WOREDA_NAV = [
  {
    section: "Main",
    items: [
      { label: "Overview", icon: "⬛", href: "/woreda" },
      {
        label: "Ownership Change",
        icon: "🔄",
        href: "/woreda/ownership-change",
      },
      {
        label: "Change Password",
        icon: "🔐",
        href: "/woreda/change-password",
      },
    ],
  },
  {
    section: "Management",
    items: [
      { label: "Field Officers", icon: "👷", href: "/woreda/officers" },
      {
        label: "Billing Officers",

        icon: "💳",
        href: "/woreda/officers/billing",
      },
      {
        label: "Complaint Officers",
        icon: "📝",
        href: "/woreda/officers/complaint",
      },
    ],
  },
  {
    section: "Message",
    items: [
      {
        label: "Announcement",
        icon: "📣",
        href: "/woreda/messages/announcement",
      },
      {
        label: "Notification",
        icon: "🔔",
        href: "/woreda/messages/notification",
      },
    ],
  },
  {
    section: "Users",
    items: [{ label: "Customers", icon: "👥", href: "/woreda/customers" }],
  },
  {
    section: "Reports",
    items: [
      {
        label: "Customer Report",
        icon: "📊",
        href: "/woreda/reports/customers",
      },
    ],
  },
];

export const WOREDA_PAGE_META = {
  "/woreda": {
    title: "Overview",
    sub: "Welcome back, Woreda Admin",
    action: "",
  },
  "/woreda/ownership-change": {
    title: "Ownership Change",
    sub: "Review meter ownership transfers in your woreda",
    action: "",
  },
  "/woreda/change-password": {
    title: "Change Password",
    sub: "Update your account password securely",
    action: "",
  },
  "/woreda/officers": {
    title: "Field Officers",
    sub: "Manage billing and complaint officers",
    action: "+ Add Officer",
  },
  "/woreda/messages/announcement": {
    title: "Announcement",
    sub: "Send woreda announcements as app notifications",
    action: "",
  },
  "/woreda/messages/notification": {
    title: "Notification",
    sub: "View woreda in-app notifications",
    action: "",
  },
  "/woreda/officers/billing": {
    title: "Billing Officers",
    sub: "Manage billing officers under your woreda",
    action: "+ Add Officer",
  },
  "/woreda/officers/complaint": {
    title: "Complaint Officers",
    sub: "Manage complaint officers under your woreda",
    action: "+ Add Officer",
  },
  "/woreda/customers": {
    title: "Customers",
    sub: "View customers under your woreda",
    action: "Export CSV",
  },
  "/woreda/reports/customers": {
    title: "Customer Report",
    sub: "Customer overview for your woreda",
    action: "",
  },
};
