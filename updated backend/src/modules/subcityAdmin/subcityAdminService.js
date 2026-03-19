import { prisma } from '../../config/db.js';
import { comparePassword, hashPassword } from '../../utils/hashtoken.js';
import jwt from 'jsonwebtoken';
import { sendAdminVerificationOtp, sendAnnouncementNotice } from '../../config/email.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const normalizeWoredaIds = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const single = String(value || '').trim();
  return single ? [single] : [];
};

const toUniqueIds = (value) => [...new Set(normalizeWoredaIds(value))];

const toAnnouncementView = (announcement) => {
  const titleText = announcement?.title?.en || announcement?.title?.am || '';
  const bodyText = announcement?.message?.en || announcement?.message?.am || '';

  return {
    id: announcement.id,
    title: titleText,
    message: bodyText,
    titleLocalized: announcement.title,
    messageLocalized: announcement.message,
    targetGroup: null,
    targetLabel: null,
    isBroadcast: Boolean(announcement.isBroadcast),
    targetUserCount: announcement.isBroadcast ? 0 : announcement.targetUserIds.length,
    sentEmailCount: 0,
    subCityId: announcement.subCityId,
    targetWoredaIds: announcement.targetWoredaIds,
    createdBy: announcement.createdBy
      ? {
          id: announcement.createdBy.id,
          fullName: announcement.createdBy.fullName,
          email: announcement.createdBy.email,
          role: announcement.createdBy.role,
        }
      : null,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
};

class SubcityAdminService {
  // SubcityAdmin LOGIN
  static async login(identifier, password) {
    const admin = await prisma.user.findFirst({
      where: {
        role: 'SUBCITY_ADMIN',
        deletedAt: null,
        status: 'ACTIVE',
        OR: [{ email: identifier }, { phoneE164: identifier }],
      },
    });

    if (!admin) throw new Error('SubCity admin not found');

    const match = await comparePassword(password, admin.passwordHash);
    if (!match) throw new Error('Invalid credentials');

    return jwt.sign(
      {
        userId: admin.id,
        role: admin.role,
        subCityId: admin.subCityId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
  }
  // Create Woreda Admin
  static async createWoredaAdmin(data, subCityId) {
    const hashed = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phoneE164: data.phoneE164,
        nationalId: data.nationalId,
        passwordHash: hashed,
        role: 'WOREDA_ADMINS',
        subCityId,
        woredaId: data.woredaId,
      },
    });
  }
  // Get Woreda Admins by SubCity
  static async getWoredaAdmins(subCityId) {
    return prisma.user.findMany({
      where: {
        role: 'WOREDA_ADMINS',
        subCityId,
        deletedAt: null,
      },
    });
  }
  // Get Woreda Admins by Woreda
  static async getWoredaAdminsByWoreda(subCityId, woredaId) {
    return prisma.user.findMany({
      where: {
        role: 'WOREDA_ADMINS',
        subCityId,
        woredaId,
        deletedAt: null,
      },
    });
  }
  // Create SubCity Billing Officer
  static async createSubcityBillingOfficer(data, subCityId, adminId) {
    const normalizedEmail = String(data.email || '')
      .trim()
      .toLowerCase();
    const hashed = await hashPassword(data.password);
    const otp = generateOTP();
    const otpHash = await hashPassword(otp);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

    const [creator, subCity] = await Promise.all([
      adminId
        ? prisma.user.findUnique({
            where: { id: adminId },
            select: { fullName: true, email: true, phoneE164: true, nationalId: true },
          })
        : null,
      prisma.subCity.findUnique({
        where: { id: subCityId },
        select: { name: true },
      }),
    ]);

    const existingOfficer = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phoneE164: data.phoneE164 },
          { nationalId: data.nationalId },
        ],
      },
      select: { id: true },
    });

    let officer;
    try {
      officer = existingOfficer
        ? await prisma.user.update({
            where: { id: existingOfficer.id },
            data: {
              fullName: data.fullName,
              email: normalizedEmail,
              phoneE164: data.phoneE164,
              nationalId: data.nationalId,
              passwordHash: hashed,
              role: 'SUBCITY_BILLING_OFFICER',
              subCityId,
              status: 'ACTIVE',
              deletedAt: null,
              emailVerified: false,
              otp: otpHash,
              otpExpiry,
            },
          })
        : await prisma.user.create({
            data: {
              fullName: data.fullName,
              email: normalizedEmail,
              phoneE164: data.phoneE164,
              nationalId: data.nationalId,
              passwordHash: hashed,
              role: 'SUBCITY_BILLING_OFFICER',
              subCityId,
              status: 'ACTIVE',
              emailVerified: false,
              otp: otpHash,
              otpExpiry,
            },
          });
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new Error(
          'Billing officer with this email, phone number, or national ID already exists'
        );
      }
      throw error;
    }

    const existingAssignment = await prisma.billingOfficerAssignment.findFirst({
      where: {
        subCityId,
        officerId: officer.id,
        woredaId: null,
        isSubCityLevel: true,
      },
      select: { id: true },
    });

    if (existingAssignment) {
      await prisma.billingOfficerAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          subCityId,
          isSubCityLevel: true,
          isActive: true,
          assignedById: adminId,
        },
      });
    } else {
      await prisma.billingOfficerAssignment.create({
        data: {
          subCityId,
          officerId: officer.id,
          woredaId: null,
          isSubCityLevel: true,
          assignedById: adminId,
        },
      });
    }

    try {
      await sendAdminVerificationOtp(normalizedEmail, {
        otp,
        role: 'SUBCITY_BILLING_OFFICER',
        fullName: officer.fullName,
        email: officer.email,
        phoneE164: officer.phoneE164,
        nationalId: officer.nationalId,
        password: data.password,
        assignedByName: creator?.fullName || 'Subcity Admin',
        assignedByEmail: creator?.email || 'Not available',
        assignedByPhone: creator?.phoneE164 || 'Not available',
        assignedByNationalId: creator?.nationalId || 'Not available',
        assignedAt: new Date().toISOString(),
        assignedSubCity: subCity?.name || 'Not assigned',
        assignedWoreda: 'Subcity Level',
      });
    } catch (error) {
      console.error('Failed to send billing officer verification email:', error?.message || error);
    }

    return officer;
  }
  // Create SubCity Complaint Officer
  static async createSubcityComplaintOfficer(data, subCityId, adminId) {
    const normalizedEmail = String(data.email || '')
      .trim()
      .toLowerCase();
    const hashed = await hashPassword(data.password);
    const otp = generateOTP();
    const otpHash = await hashPassword(otp);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

    const [creator, subCity] = await Promise.all([
      adminId
        ? prisma.user.findUnique({
            where: { id: adminId },
            select: { fullName: true, email: true, phoneE164: true, nationalId: true },
          })
        : null,
      prisma.subCity.findUnique({
        where: { id: subCityId },
        select: { name: true },
      }),
    ]);

    const existingOfficer = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phoneE164: data.phoneE164 },
          { nationalId: data.nationalId },
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    const officer = existingOfficer
      ? await prisma.user.update({
          where: { id: existingOfficer.id },
          data: {
            fullName: data.fullName,
            email: normalizedEmail,
            phoneE164: data.phoneE164,
            nationalId: data.nationalId,
            passwordHash: hashed,
            role: 'SUBCITY_COMPLAINT_OFFICER',
            subCityId,
            status: 'ACTIVE',
            emailVerified: false,
            otp: otpHash,
            otpExpiry,
          },
        })
      : await prisma.user.create({
          data: {
            fullName: data.fullName,
            email: normalizedEmail,
            phoneE164: data.phoneE164,
            nationalId: data.nationalId,
            passwordHash: hashed,
            role: 'SUBCITY_COMPLAINT_OFFICER',
            subCityId,
            status: 'ACTIVE',
            emailVerified: false,
            otp: otpHash,
            otpExpiry,
          },
        });

    const existingAssignment = await prisma.complaintOfficerAssignment.findFirst({
      where: {
        subCityId,
        officerId: officer.id,
        woredaId: null,
        isSubCityLevel: true,
      },
      select: { id: true },
    });

    if (existingAssignment) {
      await prisma.complaintOfficerAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          subCityId,
          isSubCityLevel: true,
          isActive: true,
          assignedById: adminId,
        },
      });
    } else {
      await prisma.complaintOfficerAssignment.create({
        data: {
          subCityId,
          officerId: officer.id,
          woredaId: null,
          isSubCityLevel: true,
          assignedById: adminId,
        },
      });
    }

    await sendAdminVerificationOtp(normalizedEmail, {
      otp,
      role: 'SUBCITY_COMPLAINT_OFFICER',
      fullName: officer.fullName,
      email: officer.email,
      phoneE164: officer.phoneE164,
      nationalId: officer.nationalId,
      password: data.password,
      assignedByName: creator?.fullName || 'Subcity Admin',
      assignedByEmail: creator?.email || 'Not available',
      assignedByPhone: creator?.phoneE164 || 'Not available',
      assignedByNationalId: creator?.nationalId || 'Not available',
      assignedAt: new Date().toISOString(),
      assignedSubCity: subCity?.name || 'Not assigned',
      assignedWoreda: 'Subcity Level',
    });

    return officer;
  }

  static async getComplaintOfficers(subCityId) {
    return prisma.user.findMany({
      where: {
        role: 'SUBCITY_COMPLAINT_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        nationalId: true,
        role: true,
        status: true,
        subCityId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async updateComplaintOfficer(id, subCityId, data) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'SUBCITY_COMPLAINT_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Complaint officer not found');
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.phoneE164 ? { phoneE164: data.phoneE164 } : {}),
        ...(data.nationalId ? { nationalId: data.nationalId } : {}),
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        nationalId: true,
        role: true,
        status: true,
        subCityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async suspendComplaintOfficer(id, subCityId, status) {
    const nextStatus = String(status || '').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';

    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'SUBCITY_COMPLAINT_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Complaint officer not found');
    }

    return prisma.user.update({
      where: { id },
      data: { status: nextStatus },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        nationalId: true,
        role: true,
        status: true,
        subCityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async deleteComplaintOfficer(id, subCityId) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'SUBCITY_COMPLAINT_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Complaint officer not found');
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });

    return { success: true };
  }

  static async getBillingOfficers(subCityId) {
    return prisma.user.findMany({
      where: {
        role: 'SUBCITY_BILLING_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        nationalId: true,
        role: true,
        status: true,
        subCityId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async updateBillingOfficer(id, subCityId, data) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'SUBCITY_BILLING_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Billing officer not found');
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.phoneE164 ? { phoneE164: data.phoneE164 } : {}),
        ...(data.nationalId ? { nationalId: data.nationalId } : {}),
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        nationalId: true,
        role: true,
        status: true,
        subCityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async suspendBillingOfficer(id, subCityId, status) {
    const nextStatus = String(status || '').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';

    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'SUBCITY_BILLING_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Billing officer not found');
    }

    return prisma.user.update({
      where: { id },
      data: { status: nextStatus },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        nationalId: true,
        role: true,
        status: true,
        subCityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async deleteBillingOfficer(id, subCityId) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'SUBCITY_BILLING_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Billing officer not found');
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });

    return { success: true };
  }

  static async getWoredaBillingOfficerAssignments(officerId, subCityId) {
    const officer = await prisma.user.findFirst({
      where: {
        id: officerId,
        role: 'WOREDA_BILLING_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!officer) {
      throw new Error('Woreda billing officer not found');
    }

    return prisma.billingOfficerAssignment.findMany({
      where: {
        officerId,
        subCityId,
        isSubCityLevel: false,
        isActive: true,
        woredaId: { not: null },
      },
      select: {
        id: true,
        woredaId: true,
        woreda: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async assignWoredaBillingOfficer(officerId, subCityId, adminId, woredaIds) {
    const normalizedWoredaIds = toUniqueIds(woredaIds);

    const officer = await prisma.user.findFirst({
      where: {
        id: officerId,
        role: 'WOREDA_BILLING_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!officer) {
      throw new Error('Woreda billing officer not found');
    }

    if (normalizedWoredaIds.length) {
      const woredas = await prisma.woreda.findMany({
        where: {
          id: { in: normalizedWoredaIds },
          subCityId,
        },
        select: { id: true },
      });

      if (woredas.length !== normalizedWoredaIds.length) {
        throw new Error('One or more selected woredas are invalid for this subcity');
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.billingOfficerAssignment.deleteMany({
        where: {
          officerId,
          subCityId,
          isSubCityLevel: false,
          woredaId: { not: null },
        },
      });

      if (normalizedWoredaIds.length) {
        await tx.billingOfficerAssignment.createMany({
          data: normalizedWoredaIds.map((woredaId) => ({
            subCityId,
            officerId,
            woredaId,
            isSubCityLevel: false,
            isActive: true,
            assignedById: adminId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.getWoredaBillingOfficerAssignments(officerId, subCityId);
  }

  static async getWoredaComplaintOfficerAssignments(officerId, subCityId) {
    const officer = await prisma.user.findFirst({
      where: {
        id: officerId,
        role: 'WOREDA_COMPLAINT_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!officer) {
      throw new Error('Woreda complaint officer not found');
    }

    return prisma.complaintOfficerAssignment.findMany({
      where: {
        officerId,
        subCityId,
        isSubCityLevel: false,
        isActive: true,
        woredaId: { not: null },
      },
      select: {
        id: true,
        woredaId: true,
        woreda: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async assignWoredaComplaintOfficer(officerId, subCityId, adminId, woredaIds) {
    const normalizedWoredaIds = toUniqueIds(woredaIds);

    const officer = await prisma.user.findFirst({
      where: {
        id: officerId,
        role: 'WOREDA_COMPLAINT_OFFICER',
        subCityId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!officer) {
      throw new Error('Woreda complaint officer not found');
    }

    if (normalizedWoredaIds.length) {
      const woredas = await prisma.woreda.findMany({
        where: {
          id: { in: normalizedWoredaIds },
          subCityId,
        },
        select: { id: true },
      });

      if (woredas.length !== normalizedWoredaIds.length) {
        throw new Error('One or more selected woredas are invalid for this subcity');
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.complaintOfficerAssignment.deleteMany({
        where: {
          officerId,
          subCityId,
          isSubCityLevel: false,
          woredaId: { not: null },
        },
      });

      if (normalizedWoredaIds.length) {
        await tx.complaintOfficerAssignment.createMany({
          data: normalizedWoredaIds.map((woredaId) => ({
            subCityId,
            officerId,
            woredaId,
            isSubCityLevel: false,
            isActive: true,
            assignedById: adminId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.getWoredaComplaintOfficerAssignments(officerId, subCityId);
  }

  // create field officer
  static async createFieldOfficer(data, subCityId, adminId) {
    const hashed = await hashPassword(data.password);

    const officer = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phoneE164: data.phoneE164,
        nationalId: data.nationalId,
        passwordHash: hashed,
        role: 'FIELD_OFFICER',
        fieldOfficerType: data.fieldOfficerType,
        subCityId,
      },
    });

    await prisma.fieldOfficerWoredaAssignment.create({
      data: {
        subCityId,
        woredaId: data.woredaId,
        officerId: officer.id,
        assignedById: adminId,
      },
    });

    return officer;
  }
  // GET USERS BY subcity
  static async getUsers(subCityId) {
    return prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        subCityId,
        deletedAt: null,
      },
      include: {
        subCity: { select: { id: true, name: true } },
        woreda: { select: { id: true, name: true } },
        meters: {
          select: {
            id: true,
            meterNumber: true,
            status: true,
          },
        },
      },
    });
  }
  // GET USERS BY WOREDA
  static async getUsersByWoreda(subCityId, woredaId) {
    return prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        subCityId,
        woredaId,
        deletedAt: null,
      },
      include: {
        subCity: { select: { id: true, name: true } },
        woreda: { select: { id: true, name: true } },
        meters: {
          select: {
            id: true,
            meterNumber: true,
            status: true,
          },
        },
      },
    });
  }

  static async getAnnouncements(subCityId, { limit } = {}) {
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const rows = await prisma.announcement.findMany({
      where: {
        isActive: true,
        subCityId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        reads: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
    });

    return rows.map((announcement) => ({
      ...toAnnouncementView(announcement),
      readCount: announcement.reads.length,
    }));
  }

  static async createAnnouncement(data, createdById, subCityId) {
    const title = String(data?.title || '').trim();
    const message = String(data?.message || '').trim();
    const targetGroup = String(data?.targetGroup || '').trim();
    const requestedWoredaIds = normalizeWoredaIds(data?.targetWoredaIds);
    const sendEmail = data?.sendEmail === true;

    if (!title) {
      throw new Error('Title is required');
    }

    if (!message) {
      throw new Error('Message is required');
    }

    if (!targetGroup) {
      throw new Error('Target group is required');
    }

    let targetWoredaIds = [];
    if (targetGroup === 'WOREDA_USERS') {
      if (!requestedWoredaIds.length) {
        throw new Error('At least one woreda is required for this target group');
      }

      const woredas = await prisma.woreda.findMany({
        where: {
          id: { in: requestedWoredaIds },
          subCityId,
        },
        select: { id: true },
      });

      targetWoredaIds = woredas.map((item) => item.id);
      if (!targetWoredaIds.length) {
        throw new Error('No valid woreda found for the selected target group');
      }
    } else if (targetGroup !== 'SUBCITY_USERS') {
      throw new Error('Unsupported target group');
    }

    const recipients = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        status: 'ACTIVE',
        deletedAt: null,
        subCityId,
        ...(targetGroup === 'WOREDA_USERS' ? { woredaId: { in: targetWoredaIds } } : {}),
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!recipients.length) {
      throw new Error('No recipients found for the selected target group');
    }

    const createdBy = createdById
      ? await prisma.user.findUnique({
          where: { id: createdById },
          select: { id: true, fullName: true, email: true },
        })
      : null;

    const targetUserIds = recipients.map((user) => user.id);

    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          subCityId,
          targetWoredaIds,
          type: 'GENERAL',
          priority: 'MEDIUM',
          title: {
            en: title,
            am: title,
          },
          message: {
            en: message,
            am: message,
          },
          mediaUrls: [],
          isActive: true,
          isBroadcast: false,
          audience: 'CUSTOMERS',
          targetUserIds,
          createdById: createdBy?.id || null,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          reads: {
            select: {
              id: true,
            },
          },
        },
      });

      await tx.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: {
            en: title,
            am: title,
          },
          message: {
            en: message,
            am: message,
          },
          data: {
            announcementId: created.id,
            targetGroup,
          },
          isRead: false,
          isSent: true,
          sentVia: ['IN_APP'],
        })),
      });

      return created;
    });

    if (sendEmail) {
      const emailRecipients = recipients
        .map((item) => String(item.email || '').trim())
        .filter(Boolean);

      if (emailRecipients.length) {
        const targetLabel =
          targetGroup === 'WOREDA_USERS'
            ? targetWoredaIds.length > 1
              ? 'Users in selected woredas'
              : 'Users in selected woreda'
            : 'All users in subcity';

        void Promise.allSettled(
          emailRecipients.map((email) =>
            sendAnnouncementNotice(email, {
              title,
              message,
              targetLabel,
              senderName: createdBy?.fullName || 'Subcity Admin',
              senderEmail: createdBy?.email || '',
            })
          )
        );
      }
    }

    return {
      message: 'Announcement sent successfully',
      announcement: toAnnouncementView(announcement),
      targetUserCount: recipients.length,
      sentEmailCount: 0,
    };
  }
}

export default SubcityAdminService;
