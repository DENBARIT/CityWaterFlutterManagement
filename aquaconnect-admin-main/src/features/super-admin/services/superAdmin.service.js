import { apiRequest } from "@/services/apiClient";

const withAuth = { useAuth: true };

export const superAdminService = {
  // Auth/admin bootstrap
  createSuperAdmin: (body) =>
    apiRequest("/super-admin/create", { ...withAuth, method: "POST", body }),
  login: (body) => apiRequest("/super-admin/login", { method: "POST", body }),

  // Subcity CRUD
  createSubCity: (body) =>
    apiRequest("/super-admin/subcities", { ...withAuth, method: "POST", body }),
  createSubCityAlias: (body) =>
    apiRequest("/super-admin/subcity", { ...withAuth, method: "POST", body }),
  updateSubCity: (id, body) =>
    apiRequest(`/super-admin/subcities/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  updateSubCityAlias: (id, body) =>
    apiRequest(`/super-admin/subcity/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  deleteSubCity: (id) =>
    apiRequest(`/super-admin/subcities/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),
  deleteSubCityAlias: (id) =>
    apiRequest(`/super-admin/subcity/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),

  // Woreda CRUD
  createWoreda: (body) =>
    apiRequest("/super-admin/woredas", { ...withAuth, method: "POST", body }),
  createWoredaAlias: (body) =>
    apiRequest("/super-admin/woreda", { ...withAuth, method: "POST", body }),
  updateWoreda: (id, body) =>
    apiRequest(`/super-admin/woredas/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  updateWoredaAlias: (id, body) =>
    apiRequest(`/super-admin/woreda/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  deleteWoreda: (id) =>
    apiRequest(`/super-admin/woredas/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),
  deleteWoredaAlias: (id) =>
    apiRequest(`/super-admin/woreda/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),

  // Admins
  getAllAdmins: (role) =>
    apiRequest("/super-admin/admins", {
      ...withAuth,
      query: role ? { role } : undefined,
    }),
  getRecentAdmins: (limit = 30) =>
    apiRequest("/super-admin/admins/recent", {
      ...withAuth,
      query: { limit },
    }),
  getAdminsByLocation: ({ subCityId = "", woredaId = "" } = {}) =>
    apiRequest("/super-admin/admins/location", {
      ...withAuth,
      query: { subCityId, woredaId },
    }),
  searchAdmins: ({ role = "", subCityId = "", woredaId = "" } = {}) =>
    apiRequest("/super-admin/admins/search", {
      ...withAuth,
      query: { role, subCityId, woredaId },
    }),
  createAdmin: (body) =>
    apiRequest("/super-admin/admin", { ...withAuth, method: "POST", body }),
  updateAdmin: (id, body) =>
    apiRequest(`/super-admin/admin/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  deleteAdmin: (id) =>
    apiRequest(`/super-admin/admin/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),

  // Users
  getAllUsers: () => apiRequest("/super-admin/users", withAuth),
  getUsersByLocation: ({ subCityId = "", woredaId = "" } = {}) =>
    apiRequest("/super-admin/users/location", {
      ...withAuth,
      query: { subCityId, woredaId },
    }),
  getSubcityUsers: () =>
    apiRequest("/subcity-admin/users", {
      ...withAuth,
    }),
  getSubcityUsersByWoreda: (woredaId) =>
    apiRequest(`/subcity-admin/users/${woredaId}`, {
      ...withAuth,
    }),
  updateUserStatus: (id, status) =>
    apiRequest(`/super-admin/users/${id}/status`, {
      ...withAuth,
      method: "PATCH",
      body: { status },
    }),

  // Officers
  getComplaintOfficers: ({ subCityId = "", woredaId = "" } = {}) =>
    apiRequest("/super-admin/complaint-officers", {
      ...withAuth,
      query: { subCityId, woredaId },
    }),
  createBillingOfficer: (body) =>
    apiRequest("/subcity-admin/billing-officer", {
      ...withAuth,
      method: "POST",
      body,
    }),
  createComplaintOfficer: (body) =>
    apiRequest("/subcity-admin/complaint-officer", {
      ...withAuth,
      method: "POST",
      body,
    }),
  getSubcityComplaintOfficers: () =>
    apiRequest("/subcity-admin/complaint-officer", {
      ...withAuth,
    }),
  updateSubcityComplaintOfficer: (id, body) =>
    apiRequest(`/subcity-admin/complaint-officer/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  suspendSubcityComplaintOfficer: (id, status) =>
    apiRequest(`/subcity-admin/complaint-officer/${id}/status`, {
      ...withAuth,
      method: "PATCH",
      body: { status },
    }),
  deleteSubcityComplaintOfficer: (id) =>
    apiRequest(`/subcity-admin/complaint-officer/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),
  getSubcityBillingOfficers: () =>
    apiRequest("/subcity-admin/billing-officer", {
      ...withAuth,
    }),
  updateSubcityBillingOfficer: (id, body) =>
    apiRequest(`/subcity-admin/billing-officer/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  suspendSubcityBillingOfficer: (id, status) =>
    apiRequest(`/subcity-admin/billing-officer/${id}/status`, {
      ...withAuth,
      method: "PATCH",
      body: { status },
    }),
  deleteSubcityBillingOfficer: (id) =>
    apiRequest(`/subcity-admin/billing-officer/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),
  getWoredaBillingOfficerAssignments: (id) =>
    apiRequest(`/subcity-admin/woreda-billing-officer/${id}/assignments`, {
      ...withAuth,
    }),
  assignWoredaBillingOfficer: (id, woredaIds = []) =>
    apiRequest(`/subcity-admin/woreda-billing-officer/${id}/assignments`, {
      ...withAuth,
      method: "PUT",
      body: { woredaIds },
    }),
  getWoredaComplaintOfficerAssignments: (id) =>
    apiRequest(`/subcity-admin/woreda-complaint-officer/${id}/assignments`, {
      ...withAuth,
    }),
  assignWoredaComplaintOfficer: (id, woredaIds = []) =>
    apiRequest(`/subcity-admin/woreda-complaint-officer/${id}/assignments`, {
      ...withAuth,
      method: "PUT",
      body: { woredaIds },
    }),
  getBillingOfficers: ({ subCityId = "", woredaId = "" } = {}) =>
    apiRequest("/super-admin/billing-officers", {
      ...withAuth,
      query: { subCityId, woredaId },
    }),
  getFieldOfficers: ({ woredaId = "", subCityId = "" } = {}) =>
    apiRequest("/super-admin/field-officers", {
      ...withAuth,
      query: { woredaId, subCityId },
    }),
  createFieldOfficer: (body) =>
    apiRequest("/super-admin/field-officers", {
      ...withAuth,
      method: "POST",
      body,
    }),
  updateFieldOfficer: (id, body) =>
    apiRequest(`/super-admin/field-officers/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  deleteFieldOfficer: (id) =>
    apiRequest(`/super-admin/field-officers/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),

  // Complaints
  getComplaints: ({
    status = "",
    category = "",
    assignedToId = "",
    woredaId = "",
    subCityId = "",
  } = {}) =>
    apiRequest("/super-admin/complaints", {
      ...withAuth,
      query: { status, category, assignedToId, woredaId, subCityId },
    }),
  updateComplaintStatus: (id, status) =>
    apiRequest(`/super-admin/complaints/${id}/status`, {
      ...withAuth,
      method: "PATCH",
      body: { status },
    }),
  assignComplaintFieldOfficer: (id, fieldOfficerId) =>
    apiRequest(`/super-admin/complaints/${id}/assign-field-officer`, {
      ...withAuth,
      method: "PATCH",
      body: { fieldOfficerId },
    }),
  updateComplaintResolutionPlan: (
    id,
    {
      assignedTeam = "",
      highLevelSolution = "",
      notifySubcityAdmins = false,
    } = {},
  ) =>
    apiRequest(`/super-admin/complaints/${id}/resolution-plan`, {
      ...withAuth,
      method: "PATCH",
      body: { assignedTeam, highLevelSolution, notifySubcityAdmins },
    }),
  escalateComplaint: (id, reason = "") =>
    apiRequest(`/super-admin/complaints/${id}/escalate`, {
      ...withAuth,
      method: "PATCH",
      body: { reason },
    }),
  contactComplaintCustomer: (
    id,
    { subject = "", message = "", sendEmail = true, sendInApp = true } = {},
  ) =>
    apiRequest(`/super-admin/complaints/${id}/contact`, {
      ...withAuth,
      method: "POST",
      body: { subject, message, sendEmail, sendInApp },
    }),
  contactComplaintSubcityAdmins: (id, { subject = "", message = "" } = {}) =>
    apiRequest(`/super-admin/complaints/${id}/contact-subcity-admins`, {
      ...withAuth,
      method: "POST",
      body: { subject, message },
    }),
  contactComplaintSubcityOfficer: (id, { subject = "", message = "" } = {}) =>
    apiRequest(`/super-admin/complaints/${id}/contact-subcity-officer`, {
      ...withAuth,
      method: "POST",
      body: { subject, message },
    }),

  // Schedules
  getSchedules: ({ subCityId = "", woredaId = "", day = "" } = {}) =>
    apiRequest("/super-admin/schedules", {
      ...withAuth,
      query: { subCityId, woredaId, day },
    }),
  createSchedule: (body) =>
    apiRequest("/super-admin/schedules", {
      ...withAuth,
      method: "POST",
      body,
    }),
  updateSchedule: (id, body) =>
    apiRequest(`/super-admin/schedules/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
  deleteSchedule: (id) =>
    apiRequest(`/super-admin/schedules/${id}`, {
      ...withAuth,
      method: "DELETE",
    }),

  // Billing
  getBills: ({ status = "", subCityId = "", woredaId = "" } = {}) =>
    apiRequest("/super-admin/bills", {
      ...withAuth,
      query: { status, subCityId, woredaId },
    }),
  markBillPaid: (id, amount) =>
    apiRequest(`/super-admin/bills/${id}/pay`, {
      ...withAuth,
      method: "PUT",
      body: { amount },
    }),
  waiveBillPenalty: (id) =>
    apiRequest(`/super-admin/bills/${id}/waive-penalty`, {
      ...withAuth,
      method: "PUT",
    }),

  // Public stats and operations metrics
  getPublicStats: (query) => apiRequest("/super-admin/public-stats", { query }),

  // Announcements
  getAnnouncements: (limit = 50) =>
    apiRequest("/super-admin/announcements", {
      ...withAuth,
      query: { limit },
    }),
  getUserAnnouncements: () =>
    apiRequest("/auth/announcements", {
      ...withAuth,
    }),
  getUserScheduleNotifications: () =>
    apiRequest("/auth/schedule-notifications", {
      ...withAuth,
    }),
  getUserNotifications: () =>
    apiRequest("/auth/notifications", {
      ...withAuth,
    }),
  markAnnouncementAsRead: (id) =>
    apiRequest(`/auth/announcements/${id}/read`, {
      ...withAuth,
      method: "PATCH",
    }),
  markNotificationAsRead: (id) =>
    apiRequest(`/auth/notifications/${id}/read`, {
      ...withAuth,
      method: "PATCH",
    }),
  createAnnouncement: (body) =>
    apiRequest("/super-admin/announcements", {
      ...withAuth,
      method: "POST",
      body,
      timeoutMs: 45000,
      retries: 0,
    }),
  getSubcityAnnouncements: (limit = 50) =>
    apiRequest("/subcity-admin/announcements", {
      ...withAuth,
      query: { limit },
    }),
  createSubcityAnnouncement: (body) =>
    apiRequest("/subcity-admin/announcements", {
      ...withAuth,
      method: "POST",
      body,
      timeoutMs: 45000,
      retries: 0,
    }),

  // Locations
  getSubCities: () => apiRequest("/locations/sub-cities", withAuth),
  getWoredas: (subCityId = "") =>
    apiRequest("/locations/woredas", {
      ...withAuth,
      query: subCityId ? { subCityId } : undefined,
    }),

  // Meters/readings/tariffs
  getMeters: () => apiRequest("/super-admin/meters", withAuth),
  createMeters: (body) =>
    apiRequest("/super-admin/meters", {
      ...withAuth,
      method: "POST",
      body,
      timeoutMs: 45000,
      retries: 0,
    }),
  getReadings: () =>
    apiRequest("/super-admin/readings", {
      ...withAuth,
      timeoutMs: 25000,
      retries: 1,
    }),
  getOcrWindowStatus: () =>
    apiRequest("/super-admin/ocr-window", {
      ...withAuth,
      timeoutMs: 20000,
      retries: 1,
    }),
  getOcrWindowHistory: (limit = 12) =>
    apiRequest("/super-admin/ocr-window/history", {
      ...withAuth,
      query: { limit },
      timeoutMs: 20000,
      retries: 1,
    }),
  openOcrWindow: (body) =>
    apiRequest("/super-admin/ocr-window/open", {
      ...withAuth,
      method: "POST",
      body,
      timeoutMs: 45000,
      retries: 0,
    }),
  expireOcrWindow: () =>
    apiRequest("/super-admin/ocr-window/expire", {
      ...withAuth,
      method: "POST",
      timeoutMs: 20000,
      retries: 0,
    }),
  getTariffs: () => apiRequest("/super-admin/tariffs", withAuth),
  createTariff: (body) =>
    apiRequest("/super-admin/tariffs", {
      ...withAuth,
      method: "POST",
      body,
    }),
  updateTariff: (id, body) =>
    apiRequest(`/super-admin/tariffs/${id}`, {
      ...withAuth,
      method: "PUT",
      body,
    }),
};
