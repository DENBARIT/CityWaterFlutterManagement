export const SUBCITY_NAV = [
  {
    section: "Main",
    items: [
      { label: "Overview", icon: "⬛", href: "/subcity" },
      {
        label: "Change Password",
        icon: "🔐",
        href: "/subcity/change-password",
      },
    ],
  },
  {
    section: "Management",
    items: [
      { label: "Woreda Admins", icon: "🏛️", href: "/subcity/woreda-admins" },
      { label: "Woreda", icon: "", kind: "group" },
      {
        label: "Complaint Officers",
        icon: "🛠️",
        href: "/subcity/woreda/complaint-officers",
      },
      {
        label: "Billing Officers",
        icon: "🧾",
        href: "/subcity/woreda/billing-officers",
      },
      { label: "Subcity", icon: "", kind: "group" },
      {
        label: "Billing Officers",
        icon: "🧾",
        href: "/subcity/billing-officers",
      },
      {
        label: "Complaint Officers",
        icon: "🛠️",
        href: "/subcity/complaint-officers",
      },
      { label: "Schedules", icon: "📅", href: "/subcity/schedules" },
    ],
  },
  {
    section: "Users",
    items: [
      { label: "Subcity Users", icon: "👥", href: "/subcity/users" },
      { label: "Woreda Users", icon: "📍", href: "/subcity/users/woreda" },
    ],
  },
  {
    section: "Messages",
    items: [
      {
        label: "Announcement",
        icon: "📣",
        href: "/subcity/messages/announcement",
      },
      {
        label: "Notification",
        icon: "🔔",
        href: "/subcity/messages/notification",
      },
    ],
  },
  {
    section: "Reports",
    items: [{ label: "Reports", icon: "📊", href: "/subcity/reports" }],
  },
];

export const SUBCITY_PAGE_META = {
  "/subcity": {
    title: "Overview",
    sub: "Welcome back, Subcity Admin",
    action: "",
  },
  "/subcity/change-password": {
    title: "Change Password",
    sub: "Update your account password securely",
    action: "",
  },
  "/subcity/woreda-admins": {
    title: "Woreda Admins",
    sub: "Manage woreda administrators",
    action: "+ Add Woreda Admin",
  },
  "/subcity/woreda/billing-officers": {
    title: "Woreda Billing Officers",
    sub: "Manage billing officers assigned to woredas in your subcity",
    action: "",
  },
  "/subcity/woreda/complaint-officers": {
    title: "Woreda Complaint Officers",
    sub: "Manage complaint officers assigned to woredas in your subcity",
    action: "",
  },
  "/subcity/billing-officers": {
    title: "Subcity Billing Officers",
    sub: "View billing officers assigned at subcity level",
    action: "+ Add Billing Officer",
  },
  "/subcity/complaint-officers": {
    title: "Subcity Complaint Officers",
    sub: "View complaint officers assigned at subcity level",
    action: "+ Add Complaint Officer",
  },
  "/subcity/schedules": {
    title: "Schedules",
    sub: "Manage water distribution schedules",
    action: "+ Add Schedule",
  },
  "/subcity/users": {
    title: "Subcity Users",
    sub: "All users under your subcity",
    action: "Export CSV",
  },
  "/subcity/users/woreda": {
    title: "Woreda Users",
    sub: "Filter users by woreda",
    action: "Export CSV",
  },
  "/subcity/messages/announcement": {
    title: "Announcement",
    sub: "Announcements for your subcity",
    action: "",
  },
  "/subcity/messages/notification": {
    title: "Notification",
    sub: "Recent notifications for your subcity",
    action: "",
  },
  "/subcity/reports": {
    title: "Reports",
    sub: "Billing summary for your subcity",
    action: "Export CSV",
  },
};
