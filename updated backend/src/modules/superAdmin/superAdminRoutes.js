import express from 'express';
import SuperAdminController from './superAdminController.js';
import { authenticate } from '../../middlewares/authmiddleware.js';
import { authorize } from '../../middlewares/rolemiddleware.js';

const router = express.Router();
// Get all active subcities (for map and list)
router.get('/subcities/active', SuperAdminController.getActiveSubCities);

// SuperAdmin management
router.post(
  '/create',
  authenticate,
  authorize('SUPER_ADMIN'),
  SuperAdminController.createSuperAdmin
);
router.post('/login', SuperAdminController.login);

// SubCity
router.post('/subcities', SuperAdminController.createSubCity);
router.put('/subcities/:id', SuperAdminController.updateSubCity);
router.delete('/subcities/:id', SuperAdminController.deleteSubCity);
router.post('/subcity', SuperAdminController.createSubCity);
router.put('/subcity/:id', SuperAdminController.updateSubCity);
router.delete('/subcity/:id', SuperAdminController.deleteSubCity);

// Woreda
router.post('/woredas', SuperAdminController.createWoreda);
router.put('/woredas/:id', SuperAdminController.updateWoreda);
router.delete('/woredas/:id', SuperAdminController.deleteWoreda);
router.post('/woreda', SuperAdminController.createWoreda);
router.put('/woreda/:id', SuperAdminController.updateWoreda);
router.delete('/woreda/:id', SuperAdminController.deleteWoreda);

// Admins
router.get('/admins', SuperAdminController.getAllAdmins);
router.get('/admins/recent', SuperAdminController.getRecentAdminsByLoginTimestamp);
router.get('/admins/location', SuperAdminController.getAdminsByLocation);

// Users
router.get('/users', SuperAdminController.getAllUsers);
router.get('/users/location', SuperAdminController.getUsersByLocation);
router.patch('/users/:id/status', SuperAdminController.updateUserStatus);
// CRUD for SubCity/Woreda admins
router.post('/admin', SuperAdminController.createAdmin);
router.put('/admin/:id', SuperAdminController.updateAdmin);
router.delete('/admin/:id', SuperAdminController.deleteAdmin);
router.get('/admins/search', SuperAdminController.getAdmins);
// Get Complaint Officers
router.get('/complaint-officers', SuperAdminController.getComplaintOfficers);

router.get('/billing-officers', SuperAdminController.getBillingOfficers);
router.get('/bills', SuperAdminController.getBills);
router.put('/bills/:id/pay', SuperAdminController.markBillPaid);
router.put('/bills/:id/waive-penalty', SuperAdminController.waiveBillPenalty);
router.get('/public-stats/stream', SuperAdminController.streamPublicStats);
router.get('/public-stats', SuperAdminController.getPublicStats);
router.get(
  '/announcements',
  authenticate,
  authorize('SUPER_ADMIN'),
  SuperAdminController.getAnnouncements
);
router.post(
  '/announcements',
  authenticate,
  authorize('SUPER_ADMIN'),
  SuperAdminController.createAnnouncement
);
router.get('/meters', SuperAdminController.getMeters);
router.post('/meters', authenticate, authorize('SUPER_ADMIN'), SuperAdminController.createMeters);
router.get('/readings', SuperAdminController.getReadings);
router.get(
  '/ocr-window',
  authenticate,
  authorize('SUPER_ADMIN'),
  SuperAdminController.getOcrWindowStatus
);
router.get(
  '/ocr-window/history',
  authenticate,
  authorize('SUPER_ADMIN'),
  SuperAdminController.getOcrWindowHistory
);
router.post(
  '/ocr-window/open',
  authenticate,
  authorize('SUPER_ADMIN'),
  SuperAdminController.openOcrWindow
);
router.post(
  '/ocr-window/expire',
  authenticate,
  authorize('SUPER_ADMIN'),
  SuperAdminController.expireOcrWindow
);
router.get('/field-officers', SuperAdminController.getWoredaFieldOfficers);
router.post('/field-officers', SuperAdminController.createWoredaFieldOfficer);
router.put('/field-officers/:id', SuperAdminController.updateWoredaFieldOfficer);
router.delete('/field-officers/:id', SuperAdminController.deleteWoredaFieldOfficer);
router.get(
  '/complaints',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'SUBCITY_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.getComplaints
);
router.put(
  '/complaints/:id/status',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.updateComplaintStatus
);
router.patch(
  '/complaints/:id/status',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.updateComplaintStatus
);
router.patch(
  '/complaints/:id/assign-field-officer',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.assignComplaintFieldOfficer
);
router.patch(
  '/complaints/:id/resolution-plan',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.updateComplaintResolutionPlan
);
router.patch(
  '/complaints/:id/escalate',
  authenticate,
  authorize('SUPER_ADMIN', 'WOREDA_ADMINS', 'WOREDA_ADMIN', 'WOREDA_COMPLAINT_OFFICER'),
  SuperAdminController.escalateComplaint
);
router.post(
  '/complaints/:id/contact',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.contactComplaintCustomer
);
router.post(
  '/complaints/:id/contact-subcity-admins',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.contactComplaintSubcityAdmins
);
router.post(
  '/complaints/:id/contact-subcity-officer',
  authenticate,
  authorize(
    'SUPER_ADMIN',
    'WOREDA_ADMINS',
    'WOREDA_ADMIN',
    'SUBCITY_ADMIN',
    'WOREDA_COMPLAINT_OFFICER',
    'SUBCITY_COMPLAINT_OFFICER'
  ),
  SuperAdminController.contactComplaintSubcityOfficer
);

router.get('/schedules', SuperAdminController.getSchedules);
router.post('/schedules', SuperAdminController.createSchedule);
router.put('/schedules/:id', SuperAdminController.updateSchedule);
router.delete('/schedules/:id', SuperAdminController.deleteSchedule);
router.get('/tariffs', SuperAdminController.getTariffs);
router.post('/tariffs', SuperAdminController.createTariff);
router.put('/tariffs/:id', SuperAdminController.updateTariff);

export default router;
