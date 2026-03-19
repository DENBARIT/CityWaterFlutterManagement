// modules/subcityAdmin/subcityAdminController.js

import SubcityAdminService from './subcityAdminService.js';

class SubcityAdminController {
  // LOGIN
  static async login(req, res) {
    try {
      const { identifier, password } = req.body;

      const token = await SubcityAdminService.login(identifier, password);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // CREATE WOREDA ADMIN
  static async createWoredaAdmin(req, res) {
    try {
      const subCityId = req.user.subCityId;

      const admin = await SubcityAdminService.createWoredaAdmin(req.body, subCityId);

      return res.status(201).json({
        success: true,
        message: 'Woreda admin created successfully',
        data: admin,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET WOREDA ADMINS (SUBCITY)
  static async getWoredaAdmins(req, res) {
    try {
      const subCityId = req.user.subCityId;

      const admins = await SubcityAdminService.getWoredaAdmins(subCityId);

      return res.status(200).json({
        success: true,
        data: admins,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET WOREDA ADMINS BY WOREDA
  static async getWoredaAdminsByWoreda(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { woredaId } = req.params;

      const admins = await SubcityAdminService.getWoredaAdminsByWoreda(subCityId, woredaId);

      return res.status(200).json({
        success: true,
        data: admins,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // CREATE BILLING OFFICER
  static async createBillingOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const adminId = req.user.id;

      const officer = await SubcityAdminService.createSubcityBillingOfficer(
        req.body,
        subCityId,
        adminId
      );

      return res.status(201).json({
        success: true,
        message: 'Billing officer created successfully',
        data: officer,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // CREATE COMPLAINT OFFICER
  static async createComplaintOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const adminId = req.user.id;

      const officer = await SubcityAdminService.createSubcityComplaintOfficer(
        req.body,
        subCityId,
        adminId
      );

      return res.status(201).json({
        success: true,
        message: 'Complaint officer created successfully',
        data: officer,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getComplaintOfficers(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const officers = await SubcityAdminService.getComplaintOfficers(subCityId);

      return res.status(200).json({
        success: true,
        data: officers,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateComplaintOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const officer = await SubcityAdminService.updateComplaintOfficer(id, subCityId, req.body);

      return res.status(200).json({
        success: true,
        data: officer,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async suspendComplaintOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const officer = await SubcityAdminService.suspendComplaintOfficer(
        id,
        subCityId,
        req.body?.status
      );

      return res.status(200).json({
        success: true,
        data: officer,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteComplaintOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const result = await SubcityAdminService.deleteComplaintOfficer(id, subCityId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getBillingOfficers(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const officers = await SubcityAdminService.getBillingOfficers(subCityId);

      return res.status(200).json({
        success: true,
        data: officers,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateBillingOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const officer = await SubcityAdminService.updateBillingOfficer(id, subCityId, req.body);

      return res.status(200).json({
        success: true,
        data: officer,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async suspendBillingOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const officer = await SubcityAdminService.suspendBillingOfficer(
        id,
        subCityId,
        req.body?.status
      );

      return res.status(200).json({
        success: true,
        data: officer,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteBillingOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const result = await SubcityAdminService.deleteBillingOfficer(id, subCityId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getWoredaBillingOfficerAssignments(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const assignments = await SubcityAdminService.getWoredaBillingOfficerAssignments(
        id,
        subCityId
      );

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async assignWoredaBillingOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const adminId = req.user.id;
      const { id } = req.params;
      const assignments = await SubcityAdminService.assignWoredaBillingOfficer(
        id,
        subCityId,
        adminId,
        req.body?.woredaIds
      );

      return res.status(200).json({
        success: true,
        message: 'Woreda billing officer assignments updated successfully',
        data: assignments,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getWoredaComplaintOfficerAssignments(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { id } = req.params;
      const assignments = await SubcityAdminService.getWoredaComplaintOfficerAssignments(
        id,
        subCityId
      );

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async assignWoredaComplaintOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const adminId = req.user.id;
      const { id } = req.params;
      const assignments = await SubcityAdminService.assignWoredaComplaintOfficer(
        id,
        subCityId,
        adminId,
        req.body?.woredaIds
      );

      return res.status(200).json({
        success: true,
        message: 'Woreda complaint officer assignments updated successfully',
        data: assignments,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // CREATE FIELD OFFICER
  static async createFieldOfficer(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const adminId = req.user.id;

      const officer = await SubcityAdminService.createFieldOfficer(req.body, subCityId, adminId);

      return res.status(201).json({
        success: true,
        message: 'Field officer created successfully',
        data: officer,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET USERS
  static async getUsers(req, res) {
    try {
      const subCityId = req.user.subCityId;

      const users = await SubcityAdminService.getUsers(subCityId);

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET USERS BY WOREDA
  static async getUsersByWoreda(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const { woredaId } = req.params;

      const users = await SubcityAdminService.getUsersByWoreda(subCityId, woredaId);

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAnnouncements(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const result = await SubcityAdminService.getAnnouncements(subCityId, req.query);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async createAnnouncement(req, res) {
    try {
      const subCityId = req.user.subCityId;
      const createdById = req.user.id;
      const role = String(req.user?.role || '').toUpperCase();
      const isWoredaRole = role === 'WOREDA_ADMINS' || role === 'WOREDA_ADMIN';

      const payload = isWoredaRole
        ? {
            ...req.body,
            targetGroup: 'WOREDA_USERS',
            targetWoredaIds: req.user?.woredaId ? [req.user.woredaId] : [],
          }
        : req.body;

      if (isWoredaRole && !req.user?.woredaId) {
        return res.status(400).json({
          success: false,
          message: 'Unable to detect your woreda assignment',
        });
      }

      const result = await SubcityAdminService.createAnnouncement(payload, createdById, subCityId);

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default SubcityAdminController;
