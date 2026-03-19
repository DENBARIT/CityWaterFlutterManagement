// modules/subcityAdmin/subcityAdminRoutes.js

import express from 'express';
import SubcityAdminController from './subcityAdminController.js';
import {
  loginValidator,
  createAdminValidator,
  createOfficerValidator,
  createFieldOfficerValidator,
} from './subcityAdminValidator.js';
import { validationResult } from 'express-validator';
import { authenticate } from '../../middlewares/authmiddleware.js';
import { authorize } from '../../middlewares/rolemiddleware.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: result.array(),
    });
  }
  return next();
};

// LOGIN
router.post('/login', loginValidator, validateRequest, SubcityAdminController.login);

// Protected routes
router.use(authenticate);

// ANNOUNCEMENTS (Subcity admin + subcity billing officer)
router.get(
  '/announcements',
  authorize('SUBCITY_ADMIN', 'SUBCITY_BILLING_OFFICER', 'WOREDA_ADMINS', 'WOREDA_ADMIN'),
  SubcityAdminController.getAnnouncements
);
router.post(
  '/announcements',
  authorize('SUBCITY_ADMIN', 'SUBCITY_BILLING_OFFICER', 'WOREDA_ADMINS', 'WOREDA_ADMIN'),
  SubcityAdminController.createAnnouncement
);

// Remaining subcity admin routes
router.use(authorize('SUBCITY_ADMIN'));

// WOREDA ADMINS
router.post(
  '/woreda-admin',
  createAdminValidator,
  validateRequest,
  SubcityAdminController.createWoredaAdmin
);

router.get('/woreda-admin', SubcityAdminController.getWoredaAdmins);

router.get('/woreda-admin/:woredaId', SubcityAdminController.getWoredaAdminsByWoreda);

// BILLING OFFICER
router.get('/billing-officer', SubcityAdminController.getBillingOfficers);

router.post(
  '/billing-officer',
  createOfficerValidator,
  validateRequest,
  SubcityAdminController.createBillingOfficer
);

router.put('/billing-officer/:id', SubcityAdminController.updateBillingOfficer);

router.patch('/billing-officer/:id/status', SubcityAdminController.suspendBillingOfficer);

router.delete('/billing-officer/:id', SubcityAdminController.deleteBillingOfficer);

router.get(
  '/woreda-billing-officer/:id/assignments',
  SubcityAdminController.getWoredaBillingOfficerAssignments
);
router.put(
  '/woreda-billing-officer/:id/assignments',
  SubcityAdminController.assignWoredaBillingOfficer
);

// COMPLAINT OFFICER
router.get('/complaint-officer', SubcityAdminController.getComplaintOfficers);

router.post(
  '/complaint-officer',
  createOfficerValidator,
  validateRequest,
  SubcityAdminController.createComplaintOfficer
);

router.put('/complaint-officer/:id', SubcityAdminController.updateComplaintOfficer);

router.patch('/complaint-officer/:id/status', SubcityAdminController.suspendComplaintOfficer);

router.delete('/complaint-officer/:id', SubcityAdminController.deleteComplaintOfficer);

router.get(
  '/woreda-complaint-officer/:id/assignments',
  SubcityAdminController.getWoredaComplaintOfficerAssignments
);
router.put(
  '/woreda-complaint-officer/:id/assignments',
  SubcityAdminController.assignWoredaComplaintOfficer
);

// FIELD OFFICER
router.post(
  '/field-officer',
  createFieldOfficerValidator,
  validateRequest,
  SubcityAdminController.createFieldOfficer
);

// USERS
router.get('/users', SubcityAdminController.getUsers);

router.get('/users/:woredaId', SubcityAdminController.getUsersByWoreda);

export default router;
