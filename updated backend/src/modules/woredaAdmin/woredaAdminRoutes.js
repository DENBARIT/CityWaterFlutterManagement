import { Router } from 'express';
import * as controller from './woredaAdmin.controller.js';
import * as validation from './woredaAdmin.validator.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

router.use(authMiddleware, allowRoles('WOREDA_ADMIN'));

// ─── Field Officers ───────────────────────────────────────────────────────────
router.post(
  '/officers',
  validate(validation.createFieldOfficerSchema),
  controller.createFieldOfficer
);
router.get('/officers', controller.getAllOfficers);
router.get('/officers/type/:type', controller.getOfficersByType);
router.get('/officers/:id', controller.getOfficerById);
router.patch(
  '/officers/:id',
  validate(validation.updateFieldOfficerSchema),
  controller.updateFieldOfficer
);
router.delete('/officers/:id', controller.deleteFieldOfficer);

// ─── Customers ────────────────────────────────────────────────────────────────
router.get('/customers', controller.getCustomersByWoreda);
router.get('/customers/flagged', controller.getFlaggedCustomers);
router.get('/customers/escalated', controller.getEscalatedCustomers);
router.get('/customers/:id', controller.getCustomerById);
router.patch('/customers/:id/suspend', controller.suspendCustomer);
router.patch('/customers/:id/reactivate', controller.reactivateCustomer);

// ─── Legal Actions ────────────────────────────────────────────────────────────
router.post(
  '/legal-actions',
  validate(validation.createLegalActionSchema),
  controller.createLegalAction
);
router.get('/legal-actions', controller.getLegalActionsByWoreda);
router.get('/legal-actions/customer/:customerId', controller.getLegalActionsByCustomer);

// ─── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports/billing', controller.getBillingReport);
router.get('/reports/complaints', controller.getComplaintReport);
router.get('/reports/customers', controller.getCustomerReport);

export default router;
