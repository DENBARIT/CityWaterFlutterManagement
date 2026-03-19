import prisma from '../../config/db.js';
import { AppError } from '../../utils/ApiError.js';
import bcrypt from 'bcrypt';

// ─── Selects ──────────────────────────────────────────────────────────────────

const officer_select = {
  id: true,
  fullName: true,
  email: true,
  phoneE164: true,
  nationalId: true,
  role: true,
  fieldOfficerType: true,
  status: true,
  createdAt: true,
  woreda: { select: { id: true, name: true } },
  subCity: { select: { id: true, name: true } },
};

const customer_select = {
  id: true,
  fullName: true,
  email: true,
  phoneE164: true,
  nationalId: true,
  status: true,
  paymentFlag: true,
  flaggedAt: true,
  createdAt: true,
  woreda: { select: { id: true, name: true } },
  subCity: { select: { id: true, name: true } },
  meter: { select: { id: true, meterNumber: true } },
  flaggedBy: { select: { id: true, fullName: true } },
};

const legal_action_select = {
  id: true,
  type: true,
  description: true,
  actionDate: true,
  createdAt: true,
  customer: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneE164: true,
      paymentFlag: true,
    },
  },
  officer: {
    select: {
      id: true,
      fullName: true,
      role: true,
      fieldOfficerType: true,
    },
  },
};

// ─── Field Officer Management ─────────────────────────────────────────────────

export const createFieldOfficer = async (data, woredaId, subCityId) => {
  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) throw new AppError('Email already exists.');

  const existingPhone = await prisma.user.findUnique({ where: { phoneE164: data.phoneNumber } });
  if (existingPhone) throw new AppError('Phone number already exists.');

  const existingNationalId = await prisma.user.findUnique({ where: { nationalId: data.nationalId } });
  if (existingNationalId) throw new AppError('National ID already exists.');

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phoneE164: data.phoneNumber,
      nationalId: data.nationalId,
      passwordHash,
      role: 'FIELD_OFFICER',
      fieldOfficerType: data.fieldOfficerType,
      emailVerified: true,
      woreda: { connect: { id: woredaId } },
      subCity: { connect: { id: subCityId } },
    },
    select: officer_select,
  });
};

export const getAllOfficers = async (woredaId) => {
  return prisma.user.findMany({
    where: { role: 'FIELD_OFFICER', woredaId },
    select: officer_select,
    orderBy: { createdAt: 'desc' },
  });
};

export const getOfficersByType = async (woredaId, type) => {
  const validTypes = ['BILLING_OFFICER', 'COMPLAINT_OFFICER'];
  if (!validTypes.includes(type)) {
    throw new AppError('Invalid type. Use BILLING_OFFICER or COMPLAINT_OFFICER.');
  }
  return prisma.user.findMany({
    where: { role: 'FIELD_OFFICER', woredaId, fieldOfficerType: type },
    select: officer_select,
    orderBy: { createdAt: 'desc' },
  });
};

export const getOfficerById = async (id, woredaId) => {
  const officer = await prisma.user.findFirst({
    where: { id, role: 'FIELD_OFFICER', woredaId },
    select: officer_select,
  });
  if (!officer) throw new AppError('Field officer not found.', 404);
  return officer;
};

export const updateFieldOfficer = async (id, data, woredaId) => {
  const officer = await prisma.user.findFirst({
    where: { id, role: 'FIELD_OFFICER', woredaId },
  });
  if (!officer) throw new AppError('Field officer not found.', 404);

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id } },
    });
    if (existing) throw new AppError('Email already in use.');
  }

  if (data.phoneNumber) {
    const existing = await prisma.user.findFirst({
      where: { phoneE164: data.phoneNumber, NOT: { id } },
    });
    if (existing) throw new AppError('Phone number already in use.');
  }

  if (data.nationalId) {
    const existing = await prisma.user.findFirst({
      where: { nationalId: data.nationalId, NOT: { id } },
    });
    if (existing) throw new AppError('National ID already in use.');
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.email && { email: data.email }),
      ...(data.phoneNumber && { phoneE164: data.phoneNumber }),
      ...(data.nationalId && { nationalId: data.nationalId }),
    },
    select: officer_select,
  });
};

export const deleteFieldOfficer = async (id, woredaId) => {
  const officer = await prisma.user.findFirst({
    where: { id, role: 'FIELD_OFFICER', woredaId },
  });
  if (!officer) throw new AppError('Field officer not found.', 404);
  return prisma.user.delete({ where: { id } });
};

// ─── Customer Management ──────────────────────────────────────────────────────

export const getCustomersByWoreda = async (woredaId) => {
  return prisma.user.findMany({
    where: { role: 'CUSTOMER', woredaId },
    select: customer_select,
    orderBy: { createdAt: 'desc' },
  });
};

export const getCustomerById = async (id, woredaId) => {
  const customer = await prisma.user.findFirst({
    where: { id, role: 'CUSTOMER', woredaId },
    select: customer_select,
  });
  if (!customer) throw new AppError('Customer not found under your woreda.', 404);
  return customer;
};

export const getFlaggedCustomers = async (woredaId) => {
  return prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      woredaId,
      paymentFlag: { not: 'NONE' },
    },
    select: customer_select,
    orderBy: { flaggedAt: 'desc' },
  });
};

export const getEscalatedCustomers = async (woredaId) => {
  return prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      woredaId,
      paymentFlag: 'LEGAL_ACTION',
    },
    select: customer_select,
    orderBy: { flaggedAt: 'desc' },
  });
};

export const suspendCustomer = async (id, woredaId, officerId) => {
  const customer = await prisma.user.findFirst({
    where: { id, role: 'CUSTOMER', woredaId },
  });
  if (!customer) throw new AppError('Customer not found under your woreda.', 404);
  if (customer.status === 'SUSPENDED') throw new AppError('Customer is already suspended.');

  return prisma.user.update({
    where: { id },
    data: {
      status: 'SUSPENDED',
      flaggedBy: { connect: { id: officerId } },
      flaggedAt: new Date(),
    },
    select: customer_select,
  });
};

export const reactivateCustomer = async (id, woredaId) => {
  const customer = await prisma.user.findFirst({
    where: { id, role: 'CUSTOMER', woredaId },
  });
  if (!customer) throw new AppError('Customer not found under your woreda.', 404);
  if (customer.status === 'ACTIVE') throw new AppError('Customer is already active.');

  return prisma.user.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      paymentFlag: 'NONE',
      flaggedAt: null,
      flaggedById: null,
    },
    select: customer_select,
  });
};

// ─── Legal Actions ────────────────────────────────────────────────────────────

export const createLegalAction = async (data, officerId, woredaId) => {
  const customer = await prisma.user.findFirst({
    where: { id: data.customerId, role: 'CUSTOMER', woredaId },
  });
  if (!customer) throw new AppError('Customer not found under your woreda.', 404);
  if (customer.paymentFlag !== 'LEGAL_ACTION') {
    throw new AppError('Legal actions can only be taken on customers flagged for legal action.');
  }

  return prisma.legalAction.create({
    data: {
      type: data.type,
      description: data.description,
      customer: { connect: { id: data.customerId } },
      officer: { connect: { id: officerId } },
    },
    select: legal_action_select,
  });
};

export const getLegalActionsByWoreda = async (woredaId) => {
  return prisma.legalAction.findMany({
    where: { customer: { woredaId } },
    select: legal_action_select,
    orderBy: { createdAt: 'desc' },
  });
};

export const getLegalActionsByCustomer = async (customerId, woredaId) => {
  const customer = await prisma.user.findFirst({
    where: { id: customerId, role: 'CUSTOMER', woredaId },
  });
  if (!customer) throw new AppError('Customer not found under your woreda.', 404);

  return prisma.legalAction.findMany({
    where: { customerId },
    select: legal_action_select,
    orderBy: { createdAt: 'desc' },
  });
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const getBillingReport = async (woredaId) => {
  const [total, paid, unpaid, overdue, escalated] = await Promise.all([
    prisma.bill.count({ where: { customer: { woredaId } } }),
    prisma.bill.count({ where: { customer: { woredaId }, status: 'PAID' } }),
    prisma.bill.count({ where: { customer: { woredaId }, status: 'UNPAID' } }),
    prisma.bill.count({ where: { customer: { woredaId }, status: 'OVERDUE' } }),
    prisma.bill.count({ where: { customer: { woredaId }, status: 'ESCALATED' } }),
  ]);

  const [totalAmount, collectedAmount, pendingAmount] = await Promise.all([
    prisma.bill.aggregate({
      where: { customer: { woredaId } },
      _sum: { amount: true },
    }),
    prisma.bill.aggregate({
      where: { customer: { woredaId }, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.bill.aggregate({
      where: { customer: { woredaId }, status: { in: ['UNPAID', 'OVERDUE', 'ESCALATED'] } },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalBills: total,
    breakdown: { paid, unpaid, overdue, escalated },
    totalAmount: totalAmount._sum.amount ?? 0,
    collectedAmount: collectedAmount._sum.amount ?? 0,
    pendingAmount: pendingAmount._sum.amount ?? 0,
  };
};

export const getComplaintReport = async (woredaId) => {
  const [total, open, inProgress, resolved, closed] = await Promise.all([
    prisma.complaint.count({ where: { woredaId } }),
    prisma.complaint.count({ where: { woredaId, status: 'OPEN' } }),
    prisma.complaint.count({ where: { woredaId, status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { woredaId, status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { woredaId, status: 'CLOSED' } }),
  ]);

  return {
    totalComplaints: total,
    breakdown: { open, inProgress, resolved, closed },
    resolutionRate: total > 0
      ? `${(((resolved + closed) / total) * 100).toFixed(1)}%`
      : '0%',
  };
};

export const getCustomerReport = async (woredaId) => {
  const [total, active, suspended, flagged, escalated] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER', woredaId } }),
    prisma.user.count({ where: { role: 'CUSTOMER', woredaId, status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'CUSTOMER', woredaId, status: 'SUSPENDED' } }),
    prisma.user.count({ where: { role: 'CUSTOMER', woredaId, paymentFlag: { not: 'NONE' } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', woredaId, paymentFlag: 'LEGAL_ACTION' } }),
  ]);

  return {
    totalCustomers: total,
    breakdown: { active, suspended, flagged, escalated },
  };
};