import express from 'express';
import AuthController from './authController.js';
import { authenticate } from '../../middlewares/authmiddleware.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/validate-otp', AuthController.validateOtp);
router.post('/resend-otp', AuthController.resendOtp);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/validate-reset-otp', AuthController.validateResetOtp);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh-token', AuthController.getNewToken);
router.post('/social-login', AuthController.socialLogin);

router.get('/me', authenticate, AuthController.getMe);
router.get('/ownership-history', authenticate, AuthController.getOwnershipHistory);
router.post('/complaints', authenticate, AuthController.createComplaint);
router.get('/ocr-window-status', authenticate, AuthController.getOcrWindowStatus);
router.post(
  '/ocr-window/request-late-access',
  authenticate,
  AuthController.requestLatePaymentOcrAccess
);
router.get('/announcements', authenticate, AuthController.getAnnouncements);
router.get('/schedule-notifications', authenticate, AuthController.getScheduleNotifications);
router.get('/notifications', authenticate, AuthController.getNotifications);
router.get('/schedules', authenticate, AuthController.getSchedules);
router.get('/billing/current', authenticate, AuthController.getCurrentCustomerBill);
router.post(
  '/billing/submit-reading',
  authenticate,
  AuthController.submitCustomerReadingAndGenerateBill
);
router.post('/billing/pay-current', authenticate, AuthController.payCurrentCycleBillWithMockChapa);
router.patch('/announcements/:id/read', authenticate, AuthController.markAnnouncementAsRead);
router.patch('/notifications/:id/read', authenticate, AuthController.markNotificationAsRead);
router.put('/change-password', authenticate, AuthController.changePassword);
router.put('/update-location', authenticate, AuthController.updateLocation);
router.post('/ownership-change', authenticate, AuthController.transferOwnership);

export default router;
