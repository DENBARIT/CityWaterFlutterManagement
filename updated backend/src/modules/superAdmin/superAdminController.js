import SuperAdminService from './superAdminService.js';
import { validateCreateSuperAdmin } from './superAdminValidator.js';

class SuperAdminController {
  // Get all active subcities (for map and list)
  static async getActiveSubCities(req, res) {
    try {
      const result = await SuperAdminService.getActiveSubCities();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  // 1) Add new SuperAdmin
  static async createSuperAdmin(req, res) {
    try {
      const { error } = validateCreateSuperAdmin(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const result = await SuperAdminService.createSuperAdmin(req.body, req.user?.id || null);
      res.status(201).json(result);
    } catch (err) {
      if (err?.message === 'User already exists' || err?.message === 'SuperAdmin already exists') {
        return res.status(409).json({ error: 'User already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  // 2) SuperAdmin login
  static async login(req, res) {
    try {
      const { phoneOrEmail, password } = req.body;
      const token = await SuperAdminService.login(phoneOrEmail, password);
      res.json({ token });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }

  // 3) CRUD SubCities
  static async createSubCity(req, res) {
    try {
      const result = await SuperAdminService.createSubCity(req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Subcity name already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async updateSubCity(req, res) {
    try {
      const result = await SuperAdminService.updateSubCity(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Subcity name already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteSubCity(req, res) {
    try {
      const result = await SuperAdminService.deleteSubCity(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 4) CRUD Woredas
  static async createWoreda(req, res) {
    try {
      const result = await SuperAdminService.createWoreda(req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Woreda name already exists in this subcity' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async updateWoreda(req, res) {
    try {
      const result = await SuperAdminService.updateWoreda(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Woreda name already exists in this subcity' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteWoreda(req, res) {
    try {
      const result = await SuperAdminService.deleteWoreda(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 5) Get users/admins
  static async getAllAdmins(req, res) {
    try {
      const role = req.query.role; // e.g., SUBCITY_ADMIN, WOREDA_ADMINS
      const result = await SuperAdminService.getAllAdmins(role);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAdminsByLocation(req, res) {
    try {
      const { subCityId, woredaId } = req.query;
      const result = await SuperAdminService.getAdminsByLocation(subCityId, woredaId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 6) Get all users
  static async getAllUsers(req, res) {
    try {
      const result = await SuperAdminService.getAllUsers();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getUsersByLocation(req, res) {
    try {
      const { subCityId, woredaId } = req.query;
      const result = await SuperAdminService.getUsersByLocation(subCityId, woredaId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await SuperAdminService.updateUserStatus(id, status);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // 7)CRUD subcity/woreda admins
  // Create SubCity or Woreda Admin
  static async createAdmin(req, res) {
    try {
      const data = req.body; // {fullName, email, phone, role, subCityId?, woredaId?}
      const admin = await SuperAdminService.createAdmin(data, req.user?.id || null);
      res.status(201).json(admin);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Update Admin
  static async updateAdmin(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const admin = await SuperAdminService.updateAdmin(id, data);
      res.json(admin);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Delete Admin
  static async deleteAdmin(req, res) {
    try {
      const { id } = req.params;
      const result = await SuperAdminService.deleteAdmin(id, req.user?.id || null);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Get All Admins (SubCity or Woreda)
  static async getAdmins(req, res) {
    try {
      const { role, subCityId, woredaId } = req.query;
      const admins = await SuperAdminService.getAdmins({ role, subCityId, woredaId });
      res.json(admins);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getRecentAdminsByLoginTimestamp(req, res) {
    try {
      const result = await SuperAdminService.getRecentAdminsByLoginTimestamp(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getComplaintOfficers(req, res) {
    try {
      const result = await SuperAdminService.getComplaintOfficers(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getBillingOfficers(req, res) {
    try {
      const result = await SuperAdminService.getBillingOfficers(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getComplaints(req, res) {
    try {
      const result = await SuperAdminService.getComplaints(req.query, req.user || null);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateComplaintStatus(req, res) {
    try {
      const result = await SuperAdminService.updateComplaintStatus(
        req.params.id,
        req.body?.status,
        req.user || null
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async assignComplaintFieldOfficer(req, res) {
    try {
      const result = await SuperAdminService.assignComplaintFieldOfficer(
        req.params.id,
        req.body?.fieldOfficerId,
        req.user || null
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async escalateComplaint(req, res) {
    try {
      const result = await SuperAdminService.escalateComplaint(
        req.params.id,
        req.body?.reason,
        req.user || null
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async contactComplaintCustomer(req, res) {
    try {
      const result = await SuperAdminService.contactComplaintCustomer(
        req.params.id,
        req.body || {},
        req.user || null
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateComplaintResolutionPlan(req, res) {
    try {
      const result = await SuperAdminService.updateComplaintResolutionPlan(
        req.params.id,
        req.body || {},
        req.user || null
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async contactComplaintSubcityAdmins(req, res) {
    try {
      const result = await SuperAdminService.contactComplaintSubcityAdmins(
        req.params.id,
        req.body || {},
        req.user || null
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async contactComplaintSubcityOfficer(req, res) {
    try {
      const result = await SuperAdminService.contactComplaintSubcityOfficer(
        req.params.id,
        req.body || {},
        req.user || null
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getSchedules(req, res) {
    console.log("the query", req.query);  
    try {
      const result = await SuperAdminService.getSchedules(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getBills(req, res) {
    try {
      const result = await SuperAdminService.getBills(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async markBillPaid(req, res) {
    try {
      const result = await SuperAdminService.markBillPaid(req.params.id, req.body?.amount);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async waiveBillPenalty(req, res) {
    try {
      const result = await SuperAdminService.waiveBillPenalty(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getPublicStats(req, res) {
    try {
      const result = await SuperAdminService.getPublicStats();
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async streamPublicStats(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    let lastPayload = null;

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const pushStats = async () => {
      try {
        const payload = await SuperAdminService.getPublicStats();
        const serialized = JSON.stringify(payload);

        if (serialized !== lastPayload) {
          lastPayload = serialized;
          send('stats', payload);
        }
      } catch (err) {
        send('error', { message: err.message || 'Unable to load live stats' });
      }
    };

    await pushStats();

    const statsInterval = setInterval(pushStats, 1500);
    const heartbeatInterval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(statsInterval);
      clearInterval(heartbeatInterval);
      res.end();
    });
  }

  static async getMeters(req, res) {
    try {
      const result = await SuperAdminService.getMeters(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createMeters(req, res) {
    try {
      const result = await SuperAdminService.createMeters(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getReadings(req, res) {
    try {
      const result = await SuperAdminService.getReadings(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getAnnouncements(req, res) {
    try {
      const result = await SuperAdminService.getAnnouncements(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createAnnouncement(req, res) {
    try {
      const result = await SuperAdminService.createAnnouncement(req.body, req.user?.id || null);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getWoredaFieldOfficers(req, res) {
    try {
      const result = await SuperAdminService.getWoredaFieldOfficers(req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createWoredaFieldOfficer(req, res) {
    try {
      const result = await SuperAdminService.createWoredaFieldOfficer(
        req.body,
        req.user?.id || null
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateWoredaFieldOfficer(req, res) {
    try {
      const result = await SuperAdminService.updateWoredaFieldOfficer(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteWoredaFieldOfficer(req, res) {
    try {
      const result = await SuperAdminService.deleteWoredaFieldOfficer(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createSchedule(req, res) {
    try {
      const result = await SuperAdminService.createSchedule(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateSchedule(req, res) {
    try {
      const result = await SuperAdminService.updateSchedule(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteSchedule(req, res) {
    try {
      const result = await SuperAdminService.deleteSchedule(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getTariffs(req, res) {
    try {
      const result = await SuperAdminService.getTariffs();
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getOcrWindowStatus(req, res) {
    try {
      const result = await SuperAdminService.getOcrWindowStatus();
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getOcrWindowHistory(req, res) {
    try {
      const limit = Number(req.query?.limit || 12);
      const result = await SuperAdminService.getOcrWindowHistory(limit);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async openOcrWindow(req, res) {
    try {
      const result = await SuperAdminService.openOcrWindow(req.body, req.user?.id || null);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async expireOcrWindow(req, res) {
    try {
      const result = await SuperAdminService.expireOcrWindow();
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createTariff(req, res) {
    try {
      const result = await SuperAdminService.createTariff(req.body, req.user?.id || null);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateTariff(req, res) {
    try {
      const result = await SuperAdminService.updateTariff(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  // Add more endpoints here as needed (billing, complaints, etc.)
}

export default SuperAdminController;
