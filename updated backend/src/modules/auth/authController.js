import AuthService from './authService.js';
class AuthController {
  async register(req, res) {
    try {
      const result = await AuthService.registerUser(req.body);
      return res.status(201).json({
        status: 'success',
        message: result.message,
        email: result.email,
      });
    } catch (error) {
      return res.status(400).json({
        status: 'fail',
        message: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const tokens = await AuthService.loginUser(req.body);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: tokens,
      });
    } catch (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        return res.status(403).json({
          message: error.message,
          requiresEmailVerification: true,
          email: error.email,
        });
      }
      return res.status(400).json({ message: error.message });
    }
  }

  async validateOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.validateOtp(email, otp);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async resendOtp(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendOtp(email);
      return res.status(200).json(result);
    } catch (error) {
      const code = error.code === 'OTP_RATE_LIMIT' ? 429 : 400;
      return res.status(code).json({
        message: error.message,
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      return res.status(200).json(result);
    } catch (error) {
      const code = error.code === 'OTP_RATE_LIMIT' ? 429 : 400;
      return res.status(code).json({
        message: error.message,
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
  }

  async validateResetOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.validateResetOtp({ email, otp });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await AuthService.resetPassword({ email, otp, newPassword });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getNewToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.getNewToken(refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  }

  async socialLogin(req, res) {
    try {
      const result = await AuthService.socialLogin(req.body);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.user.id;
      const user = await AuthService.getMe(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOwnershipHistory(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.getOwnershipHistoryForWoreda(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async createComplaint(req, res) {
    try {
      const userId = req.user.id;
      const complaint = await AuthService.createComplaint(userId, req.body);

      const assignmentMessage =
        complaint.assignmentScope === 'WOREDA'
          ? 'Complaint submitted and assigned to your woreda complaint officer.'
          : complaint.assignmentScope === 'SUBCITY'
          ? 'Complaint submitted and assigned to a subcity complaint officer.'
          : 'Complaint submitted successfully. No active complaint officer assignment was found yet.';

      return res.status(201).json({
        success: true,
        message: assignmentMessage,
        data: complaint,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Old password and new password are required',
        });
      }

      await AuthService.changePassword(userId, oldPassword, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateLocation(req, res) {
    try {
      const userId = req.user.id;
      const { subCityId, woredaId, password } = req.body;

      if (!subCityId || !woredaId || !password) {
        return res.status(400).json({
          success: false,
          message: 'subCityId, woredaId, and password are required',
        });
      }

      const updatedUser = await AuthService.updateLocation(
        userId,
        { subCityId, woredaId },
        password
      );
      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getOcrWindowStatus(req, res) {
    try {
      const userId = req.user.id;
      const status = await AuthService.getOcrWindowStatus(userId);
      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async requestLatePaymentOcrAccess(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.requestLatePaymentOcrAccess(userId, req.body || {});
      return res.status(200).json({
        success: true,
        message: 'Late OCR access granted successfully.',
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAnnouncements(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.getAnnouncementsForUser(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async markAnnouncementAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.markAnnouncementAsRead(userId, req.params.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async markNotificationAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.markNotificationAsRead(userId, req.params.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getScheduleNotifications(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.getScheduleNotificationsForUser(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.getNotificationsForUser(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSchedules(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.getSchedulesForUser(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCurrentCustomerBill(req, res) {
    try {
      const userId = req.user.id;
      const bill = await AuthService.getCurrentCustomerBill(userId);
      return res.status(200).json({
        success: true,
        data: bill,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async submitCustomerReadingAndGenerateBill(req, res) {
    try {
      const userId = req.user.id;
      const bill = await AuthService.submitCustomerReadingAndGenerateBill(userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Reading submitted and bill generated successfully.',
        data: bill,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async payCurrentCycleBillWithMockChapa(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.payCurrentCycleBillWithMockChapa(userId);
      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully.',
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async transferOwnership(req, res) {
    try {
      const userId = req.user.id;
      const result = await AuthService.transferMeterOwnership(userId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Meter ownership transferred successfully.',
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new AuthController();
