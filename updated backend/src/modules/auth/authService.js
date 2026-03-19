import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { comparePassword, hashPassword } from '../../utils/hashtoken.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateToken.js';
import {
  sendOtp,
  sendPasswordResetOtp,
  sendSuperAdminVerificationOtp,
  sendOwnershipTransferNotice,
  sendBillingGeneratedNotice,
  sendBillingPaymentThankYouNotice,
} from '../../config/email.js';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'superrefreshsecret';
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || '';
const LATE_OCR_WINDOW_DURATION_DAYS = Number(process.env.LATE_OCR_WINDOW_DURATION_DAYS || 3);

const otpRequestLocks = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeProvider(provider) {
  return String(provider || '')
    .trim()
    .toLowerCase();
}

function normalizeMeterNumber(meterNumber) {
  const normalized = String(meterNumber || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (/^\d{5}$/.test(normalized)) {
    return `MTR-${normalized}`;
  }

  return normalized;
}

function normalizeCustomerType(customerType) {
  const normalized = String(customerType || '')
    .trim()
    .toUpperCase();

  if (['RESIDENTIAL', 'COMMERCIAL', 'GOVERNMENTAL'].includes(normalized)) {
    return normalized;
  }

  return '';
}

function currentCycle(now = new Date()) {
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    cycleKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return 0;
}

function normalizeTariffBlocks(blocks) {
  const rows = Array.isArray(blocks) ? blocks : [];

  return rows
    .map((block) => ({
      fromM3: Number.parseInt(block?.fromM3, 10),
      toM3:
        block?.toM3 === null || block?.toM3 === undefined || block?.toM3 === ''
          ? null
          : Number.parseInt(block?.toM3, 10),
      pricePerM3: toNumber(block?.pricePerM3),
    }))
    .filter((block) => Number.isFinite(block.fromM3) && Number.isFinite(block.pricePerM3))
    .sort((a, b) => a.fromM3 - b.fromM3);
}

function validateTariffBlocksOrThrow(blocks) {
  if (!blocks.length) {
    throw new Error('Active tariff is invalid: at least one tier is required.');
  }

  if (blocks[0].fromM3 !== 0) {
    throw new Error('Active tariff is invalid: first tier must start at 0 m3.');
  }

  let previousTo = null;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (!Number.isInteger(block.fromM3) || block.fromM3 < 0) {
      throw new Error('Active tariff is invalid: tier fromM3 must be a non-negative integer.');
    }

    if (block.toM3 !== null && (!Number.isInteger(block.toM3) || block.toM3 < block.fromM3)) {
      throw new Error(
        'Active tariff is invalid: tier toM3 must be null or an integer greater than or equal to fromM3.'
      );
    }

    if (!Number.isFinite(block.pricePerM3) || block.pricePerM3 <= 0) {
      throw new Error('Active tariff is invalid: each tier must have a positive price.');
    }

    if (previousTo === null && i > 0) {
      throw new Error('Active tariff is invalid: open-ended tier must be the last tier.');
    }

    if (previousTo !== null && block.fromM3 !== previousTo + 1) {
      throw new Error('Active tariff is invalid: tiers must be continuous without gaps.');
    }

    previousTo = block.toM3;
  }
}

function calculateTieredAmount(consumption, blocks) {
  if (!Number.isFinite(consumption) || consumption <= 0) {
    return 0;
  }

  let amount = 0;

  for (const block of blocks) {
    const startExclusive = block.fromM3 <= 0 ? 0 : block.fromM3 - 1;
    const endInclusive = block.toM3 === null ? Number.POSITIVE_INFINITY : block.toM3;
    const unitsInBlock = Math.max(0, Math.min(consumption, endInclusive) - startExclusive);

    if (unitsInBlock <= 0) {
      continue;
    }

    amount += unitsInBlock * block.pricePerM3;
  }

  return Number(amount.toFixed(2));
}

function resolveTariffPricePerM3(tariff) {
  const blocks = normalizeTariffBlocks(tariff?.blocks);
  if (!blocks.length) {
    return 0;
  }

  return toNumber(blocks[0].pricePerM3);
}

function buildMobileBillView(bill) {
  const payment = Array.isArray(bill?.payments) && bill.payments.length ? bill.payments[0] : null;
  const amountDue = toNumber(bill?.totalAmount);
  const inferredUnitPrice =
    amountDue > 0 && Number(bill?.consumption) > 0 ? amountDue / bill.consumption : 0;
  const tariffPerM3 =
    inferredUnitPrice > 0
      ? Number(inferredUnitPrice.toFixed(2))
      : resolveTariffPricePerM3(bill?.tariff);
  const source = bill?.reading?.source || 'MANUAL';

  return {
    id: bill.id,
    cycleKey: `${bill.billYear}-${String(bill.billMonth).padStart(2, '0')}`,
    meterNumber: bill?.meter?.meterNumber || '',
    customerName: bill?.customer?.fullName || '',
    customerEmail: bill?.customer?.email || '',
    customerType: bill?.customerType || 'RESIDENTIAL',
    readingValue: bill?.reading?.readingValue || 0,
    previousReadingValue: bill?.previousValue ?? null,
    consumption: bill?.consumption || 0,
    tariffPerCubicMeter: tariffPerM3,
    amountDue,
    paymentStatus: bill?.status || 'UNPAID',
    source,
    generatedAt: bill?.generatedAt || bill?.createdAt || new Date(),
    dueDate: bill?.dueDate || new Date(),
    paymentReference: payment?.referenceNumber || payment?.transactionId || null,
    paidAt: payment?.paidAt || null,
    checkoutUrl: payment?.referenceNumber || null,
  };
}

function buildBillNumber({ meterNumber, month, year }) {
  const compactMeter = String(meterNumber || '')
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-6);
  const timestampPart = String(Date.now()).slice(-6);
  return `BILL-${year}${String(month).padStart(2, '0')}-${compactMeter}-${timestampPart}`;
}

async function initializeChapaSandbox({ amount, email, fullName, phoneE164, txRef }) {
  if (!CHAPA_SECRET_KEY) {
    return {
      usedChapa: false,
      checkoutUrl: null,
      referenceNumber: null,
      providerMessage: 'CHAPA_SECRET_KEY is not set. Payment recorded as mock success.',
    };
  }

  const payload = {
    amount: String(amount.toFixed(2)),
    currency: 'ETB',
    email,
    first_name: String(fullName || 'Customer').split(' ')[0] || 'Customer',
    last_name:
      String(fullName || 'Customer')
        .split(' ')
        .slice(1)
        .join(' ') || 'User',
    phone_number: phoneE164 || undefined,
    tx_ref: txRef,
    callback_url: process.env.CHAPA_CALLBACK_URL || undefined,
    return_url: process.env.CHAPA_RETURN_URL || undefined,
    customization: {
      title: 'AquaConnect Billing Sandbox',
      description: 'Sandbox payment initialization for generated monthly bill',
    },
  };

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  let decoded = null;
  try {
    decoded = await response.json();
  } catch (_error) {
    decoded = null;
  }

  if (!response.ok || !decoded || decoded.status !== 'success') {
    const reason = decoded?.message || 'Failed to initialize Chapa sandbox payment.';
    throw new Error(reason);
  }

  return {
    usedChapa: true,
    checkoutUrl: decoded?.data?.checkout_url || null,
    referenceNumber: decoded?.data?.reference || decoded?.data?.tx_ref || txRef,
    providerMessage: decoded?.message || 'Chapa sandbox initialized.',
  };
}

const LOGIN_ROLE_PRIORITY = [
  'SUPER_ADMIN',
  'SUBCITY_ADMIN',
  'SUBCITY_BILLING_OFFICER',
  'SUBCITY_COMPLAINT_OFFICER',
  'WOREDA_ADMINS',
  'WOREDA_ADMIN',
  'WOREDA_BILLING_OFFICER',
  'WOREDA_COMPLAINT_OFFICER',
  'FIELD_OFFICER',
  'CUSTOMER',
];

function getLoginRolePriority(role) {
  const normalizedRole = String(role || '')
    .trim()
    .toUpperCase();
  const index = LOGIN_ROLE_PRIORITY.indexOf(normalizedRole);
  return index === -1 ? LOGIN_ROLE_PRIORITY.length : index;
}

const WEEK_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const DAY_AMHARIC_MAP = {
  MONDAY: 'ሰኞ',
  TUESDAY: 'ማክሰኞ',
  WEDNESDAY: 'ረቡዕ',
  THURSDAY: 'ሐሙስ',
  FRIDAY: 'ዓርብ',
  SATURDAY: 'ቅዳሜ',
  SUNDAY: 'እሑድ',
};

const COMPLAINT_CATEGORY_MAP = {
  METER: 'METER_DAMAGE',
  METER_PROBLEM: 'METER_DAMAGE',
  PIPE: 'PIPE_DAMAGE',
  TAP: 'TAP_DAMAGE',
};

const VALID_COMPLAINT_CATEGORIES = new Set([
  'BILLING',
  'WATER_SUPPLY',
  'NO_WATER',
  'LOW_PRESSURE',
  'LEAKAGE',
  'PIPE_DAMAGE',
  'TAP_DAMAGE',
  'POLLUTED_WATER',
  'METER_DAMAGE',
  'OTHER',
]);

function normalizeComplaintCategory(input) {
  const normalized = String(input || '')
    .trim()
    .toUpperCase();
  const mapped = COMPLAINT_CATEGORY_MAP[normalized] || normalized;
  return VALID_COMPLAINT_CATEGORIES.has(mapped) ? mapped : 'OTHER';
}

function toTimeHHMM(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function toTime12(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (hours === 0) {
    hours = 12;
  }

  return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
}

function normalizeDayName(dayValue, dateValue) {
  const fromValue = String(dayValue || '')
    .trim()
    .toUpperCase();
  if (WEEK_DAYS.includes(fromValue)) {
    return fromValue;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return WEEK_DAYS[date.getDay()] || '';
}

async function verifyGoogleToken(providerToken) {
  if (!providerToken) {
    return null;
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(providerToken)}`
  );

  if (!response.ok) {
    throw new Error('Google sign-in could not be verified.');
  }

  return response.json();
}

async function verifyFacebookToken(providerToken) {
  if (!providerToken) {
    return null;
  }

  const response = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(
      providerToken
    )}`
  );

  if (!response.ok) {
    throw new Error('Facebook sign-in could not be verified.');
  }

  return response.json();
}

function getOtpRequestKey(purpose, normalizedEmail) {
  return `${purpose}:${normalizedEmail}`;
}

function getCooldownRemainingSeconds(purpose, normalizedEmail) {
  const key = getOtpRequestKey(purpose, normalizedEmail);
  const unlockAt = otpRequestLocks.get(key);

  if (!unlockAt) {
    return 0;
  }

  const remainingMs = unlockAt - Date.now();
  if (remainingMs <= 0) {
    otpRequestLocks.delete(key);
    return 0;
  }

  return Math.ceil(remainingMs / 1000);
}

function applyOtpCooldown(purpose, normalizedEmail) {
  const key = getOtpRequestKey(purpose, normalizedEmail);
  const unlockAt = Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000;
  otpRequestLocks.set(key, unlockAt);
}

function throwOtpRateLimit(remainingSeconds) {
  const error = new Error(`OTP sent. You can request again in ${remainingSeconds}s.`);
  error.code = 'OTP_RATE_LIMIT';
  error.retryAfterSeconds = remainingSeconds;
  throw error;
}

function isSeededSuperAdmin(user) {
  if (!user || user.role !== 'SUPER_ADMIN') {
    return false;
  }

  const seededPhone = process.env.SEED_SUPER_ADMIN_PHONE || '+251900000000';
  const seededEmail = String(process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@citywater.local')
    .trim()
    .toLowerCase();

  return (
    user.phoneE164 === seededPhone ||
    String(user.email || '')
      .trim()
      .toLowerCase() === seededEmail
  );
}

class AuthService {
  _toNotificationFeedItem(notification) {
    const title = notification?.title?.en || notification?.title?.am || '';
    const message = notification?.message?.en || notification?.message?.am || '';

    return {
      id: notification.id,
      title,
      message,
      titleLocalized: notification.title,
      messageLocalized: notification.message,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
      type: notification.type,
      data: notification.data || null,
    };
  }

  _toAnnouncementFeedItem(announcement, userId) {
    const title = announcement?.title?.en || announcement?.title?.am || '';
    const message = announcement?.message?.en || announcement?.message?.am || '';

    return {
      id: announcement.id,
      title,
      message,
      titleLocalized: announcement.title,
      messageLocalized: announcement.message,
      createdAt: announcement.createdAt,
      isRead: announcement.reads.some((read) => read.userId === userId),
    };
  }

  async getAnnouncementsForUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ isBroadcast: true }, { targetUserIds: { has: userId } }],
      },
      include: {
        reads: {
          where: { userId },
          select: { userId: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const items = announcements.map((announcement) =>
      this._toAnnouncementFeedItem(announcement, userId)
    );
    const unreadCount = items.filter((item) => !item.isRead).length;

    return {
      unreadCount,
      items,
    };
  }

  async getScheduleNotificationsForUser(userId) {
    return this.getNotificationsForUser(userId, ['SCHEDULE_CHANGE']);
  }

  async getNotificationsForUser(userId, types = []) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(Array.isArray(types) && types.length ? { type: { in: types } } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const items = notifications.map((notification) => this._toNotificationFeedItem(notification));
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    return {
      unreadCount,
      items,
    };
  }

  async getSchedulesForUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        subCityId: true,
        woredaId: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    const schedules = await prisma.waterSchedule.findMany({
      where: {
        deletedAt: null,
        ...(user.subCityId ? { subCityId: user.subCityId } : {}),
        ...(user.woredaId ? { woredaId: user.woredaId } : {}),
      },
      include: {
        woreda: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startAt: 'asc' }],
    });

    return {
      items: schedules.map((schedule) => ({
        ...(function buildScheduleEntry() {
          const day = normalizeDayName(schedule.dayOfWeek, schedule.startAt);
          const dayLabel = day ? `${day.charAt(0)}${day.slice(1).toLowerCase()}` : '';
          const dayAm = DAY_AMHARIC_MAP[day] || '';
          const startTime = toTimeHHMM(schedule.startAt);
          const endTime = toTimeHHMM(schedule.endAt);
          const startTime12 = toTime12(schedule.startAt);
          const endTime12 = toTime12(schedule.endAt);
          const noteText =
            typeof schedule.note === 'string'
              ? schedule.note
              : schedule.note?.en || schedule.note?.am || '';

          return {
            id: schedule.id,
            day,
            dayLabel,
            dayAm,
            startTime,
            endTime,
            startTime12,
            endTime12,
            note: noteText,
            messageGregorian: `${dayLabel} from ${startTime12} to ${endTime12}`.trim(),
            messageEthiopian: `${dayAm} ከ ${startTime12} እስከ ${endTime12}`.trim(),
            woreda: schedule.woreda,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
          };
        })(),
      })),
    };
  }

  async markAnnouncementAsRead(userId, announcementId) {
    const normalizedAnnouncementId = String(announcementId || '').trim();
    if (!normalizedAnnouncementId) {
      throw new Error('Announcement id is required');
    }

    const target = await prisma.announcement.findFirst({
      where: {
        id: normalizedAnnouncementId,
        isActive: true,
        OR: [{ isBroadcast: true }, { targetUserIds: { has: userId } }],
      },
      select: {
        id: true,
      },
    });

    if (!target) {
      throw new Error('Announcement not found for this user');
    }

    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: target.id,
          userId,
        },
      },
      create: {
        announcementId: target.id,
        userId,
      },
      update: {
        readAt: new Date(),
      },
    });

    await prisma.notification.updateMany({
      where: {
        userId,
        type: 'SYSTEM_ANNOUNCEMENT',
        OR: [{ data: { path: ['announcementId'], equals: target.id } }],
      },
      data: {
        isRead: true,
      },
    });

    const unreadCount = await prisma.announcement.count({
      where: {
        isActive: true,
        OR: [{ isBroadcast: true }, { targetUserIds: { has: userId } }],
        reads: {
          none: { userId },
        },
      },
    });

    return {
      announcementId: target.id,
      unreadCount,
    };
  }

  async markNotificationAsRead(userId, notificationId) {
    const normalizedNotificationId = String(notificationId || '').trim();
    if (!normalizedNotificationId) {
      throw new Error('Notification id is required');
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: normalizedNotificationId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      throw new Error('Notification not found for this user');
    }

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      notificationId: notification.id,
      unreadCount,
    };
  }

  async registerUser(data) {
    const { fullName, phoneE164, email, password, nationalId, meterNumber, subCityId, woredaId } =
      data;

    if (
      !fullName ||
      !phoneE164 ||
      !email ||
      !password ||
      !nationalId ||
      !meterNumber ||
      !subCityId ||
      !woredaId
    ) {
      throw new Error('All registration fields are required');
    }

    const normalizedEmail = normalizeEmail(email);

    const [
      existingUserByEmail,
      existingUserByPhone,
      existingUserByNationalId,
      pendingByEmail,
      pendingByPhone,
      pendingByNationalId,
      pendingByMeter,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      prisma.user.findUnique({ where: { phoneE164 } }),
      prisma.user.findUnique({ where: { nationalId } }),
      prisma.pendingRegistration.findUnique({ where: { email: normalizedEmail } }),
      prisma.pendingRegistration.findUnique({ where: { phoneE164 } }),
      prisma.pendingRegistration.findUnique({ where: { nationalId } }),
      prisma.pendingRegistration.findUnique({ where: { meterNumber } }),
    ]);

    if (existingUserByPhone && existingUserByPhone.email !== normalizedEmail) {
      throw new Error('Phone number is already associated with another account.');
    }

    if (existingUserByNationalId && existingUserByNationalId.email !== normalizedEmail) {
      throw new Error('National ID is already associated with another account.');
    }

    if (pendingByPhone && pendingByPhone.email !== normalizedEmail) {
      throw new Error('Phone number is already associated with another pending registration.');
    }

    if (pendingByNationalId && pendingByNationalId.email !== normalizedEmail) {
      throw new Error('National ID is already associated with another pending registration.');
    }

    if (pendingByMeter && pendingByMeter.email !== normalizedEmail) {
      throw new Error('Meter number is already associated with another pending registration.');
    }

    const existingUser = existingUserByEmail;

    if (existingUser) {
      if (existingUser.emailVerified) {
        throw new Error('User already exists');
      }

      if (existingUser.phoneE164 !== phoneE164) {
        throw new Error('This email is already associated with a different phone number.');
      }

      if (existingUser.nationalId !== nationalId) {
        throw new Error('This email is already associated with a different national ID.');
      }

      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          otp: otpHash,
          otpExpiry,
        },
      });

      await sendOtp(existingUser.email, otp);

      return {
        message: 'OTP sent to your email. Please verify to complete registration.',
        email: existingUser.email,
      };
    }

    const existingMeter = await prisma.meter.findUnique({
      where: { meterNumber },
      select: {
        id: true,
        customerId: true,
        subCityId: true,
        woredaId: true,
        status: true,
      },
    });

    if (existingMeter?.customerId) {
      throw new Error('Meter number already registered');
    }

    if (existingMeter) {
      if (existingMeter.subCityId !== subCityId) {
        throw new Error('Meter number belongs to a different subcity');
      }

      if (existingMeter.woredaId && existingMeter.woredaId !== woredaId) {
        throw new Error('Meter number belongs to a different woreda');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

    if (pendingByEmail) {
      if (pendingByEmail.phoneE164 !== phoneE164) {
        throw new Error('This email is already associated with a different phone number.');
      }

      if (pendingByEmail.nationalId !== nationalId) {
        throw new Error('This email is already associated with a different national ID.');
      }

      if (pendingByEmail.meterNumber !== meterNumber) {
        throw new Error('This email is already associated with a different meter number.');
      }

      await prisma.pendingRegistration.update({
        where: { id: pendingByEmail.id },
        data: {
          fullName,
          phoneE164,
          email: normalizedEmail,
          nationalId,
          passwordHash,
          meterNumber,
          subCityId,
          woredaId,
          otp: otpHash,
          otpExpiry,
        },
      });
    } else {
      await prisma.pendingRegistration.create({
        data: {
          fullName,
          phoneE164,
          email: normalizedEmail,
          nationalId,
          passwordHash,
          meterNumber,
          subCityId,
          woredaId,
          otp: otpHash,
          otpExpiry,
        },
      });
    }

    await sendOtp(normalizedEmail, otp);

    return {
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: normalizedEmail,
    };
  }

  async loginUser({ emailOrPhone, phoneE164, password }) {
    const identifier = emailOrPhone || phoneE164;

    if (!identifier || !password) {
      throw new Error('Identifier and password are required');
    }

    const candidates = await prisma.user.findMany({
      where: {
        OR: [{ email: identifier }, { phoneE164: identifier }],
        deletedAt: null,
      },
    });

    const user = candidates
      .slice()
      .sort((left, right) => getLoginRolePriority(left.role) - getLoginRolePriority(right.role))[0];

    if (!user || user.deletedAt) {
      throw new Error('Invalid credentials');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Your account has been suspended. Please contact our support team.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Invalid credentials');
    }

    if (!user.emailVerified && !isSeededSuperAdmin(user)) {
      const error = new Error('Email not verified. Please verify your email before logging in.');
      error.code = 'EMAIL_NOT_VERIFIED';
      error.email = user.email;
      throw error;
    }

    const match = await comparePassword(password, user.passwordHash);

    if (!match) {
      throw new Error('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        description: 'User logged in',
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { accessToken, refreshToken, fullName: user.fullName };
  }

  async socialLogin({ provider, email, providerToken }) {
    const normalizedProvider = normalizeProvider(provider);

    if (!normalizedProvider) {
      throw new Error('Provider is required');
    }

    if (!email) {
      throw new Error('Email is required');
    }

    const normalizedEmail = normalizeEmail(email);
    let verifiedEmail = normalizedEmail;

    if (normalizedProvider === 'google') {
      const tokenInfo = await verifyGoogleToken(providerToken);
      if (tokenInfo?.email) {
        verifiedEmail = normalizeEmail(tokenInfo.email);
      }
    } else if (normalizedProvider === 'facebook') {
      const profile = await verifyFacebookToken(providerToken);
      if (profile?.email) {
        verifiedEmail = normalizeEmail(profile.email);
      }
    } else {
      throw new Error('Unsupported social provider');
    }

    if (verifiedEmail !== normalizedEmail) {
      throw new Error('Social account email does not match the requested email.');
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.deletedAt) {
      throw new Error('No registered account found for this email.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Your account has been suspended. Please contact our support team.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Invalid credentials');
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        description: `User logged in with ${normalizedProvider} sign-in`,
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  async validateOtp(email, otp) {
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      if (user.emailVerified) {
        throw new Error('Email already verified');
      }
      if (!user.otp || !user.otpExpiry) {
        throw new Error('No OTP found, request a new one');
      }
      if (user.otpExpiry < new Date()) {
        throw new Error('OTP expired');
      }

      const isValid = await bcrypt.compare(otp, user.otp);
      if (!isValid) {
        throw new Error('Invalid OTP');
      }

      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: true, otp: null, otpExpiry: null },
      });

      return { message: 'Email verified successfully' };
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pending) {
      throw new Error('No pending registration found');
    }

    if (pending.otpExpiry < new Date()) {
      throw new Error('OTP expired');
    }

    const isValid = await bcrypt.compare(otp, pending.otp);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    await prisma.$transaction(async (tx) => {
      const duplicateUser = await tx.user.findFirst({
        where: {
          OR: [
            { email: pending.email },
            { phoneE164: pending.phoneE164 },
            { nationalId: pending.nationalId },
          ],
        },
      });

      if (duplicateUser) {
        throw new Error('User already exists');
      }

      const duplicateMeter = await tx.meter.findUnique({
        where: { meterNumber: pending.meterNumber },
        select: {
          id: true,
          customerId: true,
          subCityId: true,
          woredaId: true,
        },
      });

      if (duplicateMeter?.customerId) {
        throw new Error('Meter number already registered');
      }

      if (duplicateMeter) {
        if (duplicateMeter.subCityId !== pending.subCityId) {
          throw new Error('Meter number belongs to a different subcity');
        }

        if (
          duplicateMeter.woredaId &&
          pending.woredaId &&
          duplicateMeter.woredaId !== pending.woredaId
        ) {
          throw new Error('Meter number belongs to a different woreda');
        }
      }

      const createdUser = await tx.user.create({
        data: {
          fullName: pending.fullName,
          phoneE164: pending.phoneE164,
          email: pending.email,
          nationalId: pending.nationalId,
          passwordHash: pending.passwordHash,
          subCityId: pending.subCityId,
          woredaId: pending.woredaId,
          role: 'CUSTOMER',
          emailVerified: true,
          otp: null,
          otpExpiry: null,
          preference: {
            create: {},
          },
        },
      });

      if (duplicateMeter) {
        await tx.meter.update({
          where: { id: duplicateMeter.id },
          data: {
            customerId: createdUser.id,
            subCityId: pending.subCityId,
            woredaId: pending.woredaId,
            registeredNationalId: pending.nationalId,
            registeredFullName: pending.fullName,
            registeredAt: new Date(),
            registeredById: createdUser.id,
            status: 'ACTIVE',
          },
        });
      } else {
        await tx.meter.create({
          data: {
            meterNumber: pending.meterNumber,
            customerId: createdUser.id,
            subCityId: pending.subCityId,
            woredaId: pending.woredaId,
            registeredNationalId: pending.nationalId,
            registeredFullName: pending.fullName,
            registeredAt: new Date(),
            registeredById: createdUser.id,
          },
        });
      }

      await tx.pendingRegistration.delete({
        where: { id: pending.id },
      });
    });

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email) {
    const normalizedEmail = normalizeEmail(email);

    const cooldownRemaining = getCooldownRemainingSeconds('verify', normalizedEmail);
    if (cooldownRemaining > 0) {
      throwOtpRateLimit(cooldownRemaining);
    }

    applyOtpCooldown('verify', normalizedEmail);

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (pending) {
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { otp: otpHash, otpExpiry },
      });

      await sendOtp(normalizedEmail, otp);

      return {
        message: `OTP sent. You can request again in ${OTP_RESEND_COOLDOWN_SECONDS}s.`,
        cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      };
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return {
        message: `If an unverified account exists, a new OTP has been sent. You can request again in ${OTP_RESEND_COOLDOWN_SECONDS}s.`,
        cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      };
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified. OTP resend is not allowed.');
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { otp: otpHash, otpExpiry },
    });

    if (user.role === 'SUPER_ADMIN') {
      await sendSuperAdminVerificationOtp(normalizedEmail, {
        otp,
        fullName: user.fullName,
        email: user.email,
        phoneE164: user.phoneE164,
        nationalId: user.nationalId,
        createdAt: user.createdAt,
      });
    } else {
      await sendOtp(normalizedEmail, otp);
    }

    return {
      message: `OTP sent. You can request again in ${OTP_RESEND_COOLDOWN_SECONDS}s.`,
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  async forgotPassword(email) {
    const normalizedEmail = normalizeEmail(email);

    const cooldownRemaining = getCooldownRemainingSeconds('reset', normalizedEmail);
    if (cooldownRemaining > 0) {
      throwOtpRateLimit(cooldownRemaining);
    }

    applyOtpCooldown('reset', normalizedEmail);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.emailVerified) {
      return {
        message: `If an eligible account exists, a reset OTP has been sent. You can request again in ${OTP_RESEND_COOLDOWN_SECONDS}s.`,
        cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      };
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { otp: otpHash, otpExpiry },
    });

    await sendPasswordResetOtp(normalizedEmail, otp);

    return {
      message: `Reset OTP sent. You can request again in ${OTP_RESEND_COOLDOWN_SECONDS}s.`,
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  async validateResetOtp({ email, otp }) {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.otp || !user.otpExpiry) {
      throw new Error('No OTP found, request a new one');
    }

    if (user.otpExpiry < new Date()) {
      throw new Error('OTP expired');
    }

    const isValid = await bcrypt.compare(otp, user.otp);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    return { message: 'OTP verified. Continue to set a new password.' };
  }

  async resetPassword({ email, otp, newPassword }) {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      throw new Error('User not found');
    }
    if (!user.otp || !user.otpExpiry) {
      throw new Error('No OTP found, request a new one');
    }
    if (user.otpExpiry < new Date()) {
      throw new Error('OTP expired');
    }

    const isValid = await bcrypt.compare(otp, user.otp);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        passwordHash,
        otp: null,
        otpExpiry: null,
      },
    });

    return { message: 'Password reset successfully.' };
  }

  async getNewToken(refreshToken) {
    let payload;

    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (_error) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async getMe(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phoneE164: true,
        email: true,
        nationalId: true,
        role: true,
        status: true,
        subCityId: true,
        woredaId: true,
        meters: {
          select: {
            id: true,
            meterNumber: true,
            status: true,
          },
        },
        preference: true,
      },
    });
  }

  async getOwnershipHistoryForWoreda(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
        woredaId: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    if (!['WOREDA_ADMIN', 'WOREDA_ADMINS'].includes(user.role)) {
      throw new Error('Only woreda admins can access ownership history');
    }

    if (!user.woredaId) {
      throw new Error('Your profile is missing woreda assignment');
    }

    const history = await prisma.meterOwnershipHistory.findMany({
      where: {
        meter: {
          woredaId: user.woredaId,
          deletedAt: null,
        },
      },
      include: {
        meter: {
          select: {
            id: true,
            meterNumber: true,
            registeredFullName: true,
            registeredNationalId: true,
            woredaId: true,
            subCityId: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true,
            nationalId: true,
          },
        },
      },
      orderBy: [{ startDate: 'desc' }],
      take: 100,
    });

    return {
      items: history.map((item) => ({
        id: item.id,
        meterId: item.meterId,
        meterNumber: item.meter?.meterNumber || '',
        registeredFullName: item.meter?.registeredFullName || '',
        registeredNationalId: item.meter?.registeredNationalId || '',
        woredaId: item.meter?.woredaId || '',
        subCityId: item.meter?.subCityId || '',
        userId: item.userId,
        ownerFullName: item.user?.fullName || '',
        ownerEmail: item.user?.email || '',
        ownerPhone: item.user?.phoneE164 || '',
        ownerNationalId: item.user?.nationalId || '',
        startDate: item.startDate,
        endDate: item.endDate,
        isCurrent: item.endDate == null,
      })),
    };
  }

  async createComplaint(userId, payload) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
        subCityId: true,
        woredaId: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    if (user.role !== 'CUSTOMER') {
      throw new Error('Only customers can submit complaints');
    }

    if (!user.subCityId || !user.woredaId) {
      throw new Error('Your profile is missing sub city or woreda assignment');
    }

    const title = String(payload?.title || '').trim();
    const description = String(payload?.description || '').trim();
    const category = normalizeComplaintCategory(payload?.category);
    const location = String(payload?.location || '').trim();

    if (!title || !description) {
      throw new Error('Complaint title and description are required');
    }

    const woredaOfficerAssignment = await prisma.complaintOfficerAssignment.findFirst({
      where: {
        subCityId: user.subCityId,
        woredaId: user.woredaId,
        isActive: true,
        officer: {
          role: 'WOREDA_COMPLAINT_OFFICER',
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        officerId: true,
      },
    });

    const subCityOfficerAssignment = woredaOfficerAssignment
      ? null
      : await prisma.complaintOfficerAssignment.findFirst({
          where: {
            subCityId: user.subCityId,
            isActive: true,
            OR: [{ woredaId: null }, { isSubCityLevel: true }],
            officer: {
              role: 'SUBCITY_COMPLAINT_OFFICER',
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          select: {
            officerId: true,
          },
        });

    const assignedToId =
      woredaOfficerAssignment?.officerId || subCityOfficerAssignment?.officerId || null;

    const createdComplaint = await prisma.complaint.create({
      data: {
        customerId: user.id,
        subCityId: user.subCityId,
        woredaId: user.woredaId,
        assignedToId,
        category,
        title: { en: title, am: title },
        description: { en: description, am: description },
        ...(location ? { location } : {}),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      id: createdComplaint.id,
      status: createdComplaint.status,
      category: createdComplaint.category,
      assignedTo: createdComplaint.assignedTo,
      assignmentScope: woredaOfficerAssignment
        ? 'WOREDA'
        : subCityOfficerAssignment
        ? 'SUBCITY'
        : 'UNASSIGNED',
      createdAt: createdComplaint.createdAt,
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Old password is incorrect');
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        description: 'Password changed',
      },
    });
  }

  async updateLocation(userId, data, password) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Password is incorrect');
    }

    const woreda = await prisma.woreda.findUnique({
      where: { id: data.woredaId },
      select: { subCityId: true },
    });

    if (!woreda || woreda.subCityId !== data.subCityId) {
      throw new Error('Invalid Woreda for the selected SubCity');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subCityId: data.subCityId,
        woredaId: data.woredaId,
      },
      select: {
        id: true,
        fullName: true,
        phoneE164: true,
        subCityId: true,
        woredaId: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        description: `User location updated to subCity: ${data.subCityId}, woreda: ${data.woredaId}`,
      },
    });

    return updatedUser;
  }

  async transferMeterOwnership(currentUserId, payload) {
    const currentOwnerEmail = normalizeEmail(String(payload?.currentOwnerEmail || '').trim());
    const meterNumber = String(payload?.meterNumber || '').trim();
    const newOwnerEmail = normalizeEmail(String(payload?.newOwnerEmail || '').trim());
    const newOwnerNationalId = String(payload?.newOwnerNationalId || '').trim();
    const newOwnerPhoneE164 = String(payload?.newOwnerPhoneE164 || '').trim();
    const newOwnerFullName = String(payload?.newOwnerFullName || '').trim();
    const newOwnerPassword = String(payload?.newOwnerPassword || '').trim();

    if (
      !currentOwnerEmail ||
      !meterNumber ||
      !newOwnerEmail ||
      !newOwnerNationalId ||
      !newOwnerPhoneE164 ||
      !newOwnerFullName ||
      !newOwnerPassword
    ) {
      throw new Error('All ownership-change fields are required.');
    }

    if (!newOwnerEmail.includes('@')) {
      throw new Error('A valid new owner email is required.');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        email: true,
        fullName: true,
        subCityId: true,
        woredaId: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!currentUser || currentUser.deletedAt || currentUser.status !== 'ACTIVE') {
      throw new Error('Current user not found or inactive.');
    }

    if (normalizeEmail(currentUser.email) !== currentOwnerEmail) {
      throw new Error('Current owner email does not match your account.');
    }

    const meter = await prisma.meter.findFirst({
      where: {
        meterNumber,
        deletedAt: null,
      },
      select: {
        id: true,
        meterNumber: true,
        customerId: true,
        subCityId: true,
        woredaId: true,
      },
    });

    if (!meter) {
      throw new Error('Meter not found.');
    }

    if (meter.customerId !== currentUserId) {
      throw new Error('You are not the current owner of this meter.');
    }

    const [userByEmail, userByPhone, userByNationalId] = await Promise.all([
      prisma.user.findUnique({ where: { email: newOwnerEmail } }),
      prisma.user.findUnique({ where: { phoneE164: newOwnerPhoneE164 } }),
      prisma.user.findUnique({ where: { nationalId: newOwnerNationalId } }),
    ]);

    if (userByPhone && normalizeEmail(userByPhone.email) !== newOwnerEmail) {
      throw new Error('Phone number is already used by a different account.');
    }

    if (userByNationalId && normalizeEmail(userByNationalId.email) !== newOwnerEmail) {
      throw new Error('National ID is already used by a different account.');
    }

    let nextOwnerUser = userByEmail;
    const passwordHash = await hashPassword(newOwnerPassword);

    if (nextOwnerUser) {
      if (nextOwnerUser.role !== 'CUSTOMER') {
        throw new Error('The provided email belongs to a non-customer account.');
      }

      if (nextOwnerUser.deletedAt) {
        throw new Error('The provided new owner account is inactive.');
      }

      if (nextOwnerUser.phoneE164 !== newOwnerPhoneE164) {
        throw new Error('The new owner phone number does not match this email account.');
      }

      if (nextOwnerUser.nationalId !== newOwnerNationalId) {
        throw new Error('The new owner national ID does not match this email account.');
      }

      nextOwnerUser = await prisma.user.update({
        where: { id: nextOwnerUser.id },
        data: {
          fullName: newOwnerFullName,
          passwordHash,
          status: 'ACTIVE',
          emailVerified: true,
          deletedAt: null,
          subCityId: meter.subCityId,
          woredaId: meter.woredaId,
        },
      });
    } else {
      nextOwnerUser = await prisma.user.create({
        data: {
          fullName: newOwnerFullName,
          email: newOwnerEmail,
          phoneE164: newOwnerPhoneE164,
          nationalId: newOwnerNationalId,
          passwordHash,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: true,
          subCityId: meter.subCityId,
          woredaId: meter.woredaId,
        },
      });
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.meter.update({
        where: { id: meter.id },
        data: {
          customerId: nextOwnerUser.id,
          registeredNationalId: newOwnerNationalId,
          registeredFullName: newOwnerFullName,
        },
      }),
      prisma.meterOwnershipHistory.updateMany({
        where: {
          meterId: meter.id,
          endDate: null,
        },
        data: {
          endDate: now,
        },
      }),
      prisma.meterOwnershipHistory.create({
        data: {
          meterId: meter.id,
          userId: nextOwnerUser.id,
          startDate: now,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'UPDATE',
          entity: 'Meter',
          entityId: meter.id,
          description: `Meter ${meter.meterNumber} ownership transferred to ${newOwnerEmail}`,
        },
      }),
    ]);

    await sendOwnershipTransferNotice(newOwnerEmail, {
      meterNumber: meter.meterNumber,
      previousOwnerName: currentUser.fullName,
      previousOwnerEmail: currentUser.email,
      newOwnerName: nextOwnerUser.fullName,
      newOwnerEmail,
    });

    return {
      meterNumber: meter.meterNumber,
      previousOwnerEmail: currentUser.email,
      newOwnerEmail,
      newOwnerUserId: nextOwnerUser.id,
    };
  }

  async getCurrentCustomerBill(userId) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!profile || profile.deletedAt || profile.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    if (profile.role !== 'CUSTOMER') {
      throw new Error('Only customers can access billing.');
    }

    const { month, year } = currentCycle();

    const bill = await prisma.bill.findFirst({
      where: {
        customerId: userId,
        billMonth: month,
        billYear: year,
      },
      include: {
        meter: {
          select: {
            id: true,
            meterNumber: true,
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true,
          },
        },
        reading: {
          select: {
            id: true,
            readingValue: true,
            source: true,
          },
        },
        tariff: {
          include: {
            blocks: {
              orderBy: {
                fromM3: 'asc',
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bill ? buildMobileBillView(bill) : null;
  }

  async submitCustomerReadingAndGenerateBill(userId, payload) {
    const meterNumber = normalizeMeterNumber(payload?.meterNumber);
    const readingValue = Number(payload?.readingValue);
    const providedPreviousReadingValue =
      payload?.previousReadingValue === null ||
      payload?.previousReadingValue === undefined ||
      payload?.previousReadingValue === ''
        ? null
        : Number(payload.previousReadingValue);
    const customerType = normalizeCustomerType(payload?.customerType);
    const sourceRaw = String(payload?.source || 'MANUAL')
      .trim()
      .toUpperCase();
    const source = sourceRaw === 'OCR' ? 'OCR' : 'MANUAL';
    const ocrConfidence = payload?.ocrConfidence == null ? null : Number(payload?.ocrConfidence);

    if (!meterNumber) {
      throw new Error('Meter number is required.');
    }

    if (!Number.isInteger(readingValue) || readingValue < 0) {
      throw new Error('Reading value must be a non-negative integer.');
    }

    if (!customerType) {
      throw new Error('Customer type is required.');
    }

    if (
      providedPreviousReadingValue !== null &&
      (!Number.isInteger(providedPreviousReadingValue) || providedPreviousReadingValue < 0)
    ) {
      throw new Error('Previous month reading must be a non-negative integer.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        role: true,
        status: true,
        deletedAt: true,
        subCityId: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    if (user.role !== 'CUSTOMER') {
      throw new Error('Only customers can submit meter readings.');
    }

    const meter = await prisma.meter.findUnique({
      where: { meterNumber },
      select: {
        id: true,
        meterNumber: true,
        customerId: true,
        subCityId: true,
        woredaId: true,
        lastReading: true,
      },
    });

    if (!meter) {
      throw new Error('Meter number not found.');
    }

    if (meter.customerId !== user.id) {
      throw new Error('This meter number is not linked to the signed-in account.');
    }

    const { month, year } = currentCycle();

    const existingMonthlyReading = await prisma.meterReading.findFirst({
      where: {
        meterId: meter.id,
        readingMonth: month,
        readingYear: year,
      },
      select: {
        id: true,
      },
    });

    if (existingMonthlyReading) {
      throw new Error('A reading was already submitted for this billing cycle.');
    }

    let hasRegularOcrAccess = false;
    let hasLateOcrAccess = false;

    if (source === 'OCR') {
      if (!user.subCityId) {
        throw new Error('Customer account is not assigned to a subcity for OCR access.');
      }

      const now = new Date();
      const windows = await prisma.oCRWindow.findMany({
        where: {
          subCityId: user.subCityId,
          month,
          year,
          isActive: true,
        },
        select: {
          isLateWindow: true,
          openDate: true,
          closeDate: true,
        },
      });

      for (const windowRecord of windows) {
        const start = new Date(windowRecord.openDate);
        const close = new Date(windowRecord.closeDate);
        const isOpen = now >= start && now <= close;

        if (!isOpen) {
          continue;
        }

        if (windowRecord.isLateWindow) {
          hasLateOcrAccess = true;
        } else {
          hasRegularOcrAccess = true;
        }
      }

      if (!hasRegularOcrAccess && !hasLateOcrAccess) {
        throw new Error(
          'OCR window is closed. Please apply for late OCR access before submitting your scan.'
        );
      }
    }

    const activeTariff = await prisma.tariff.findFirst({
      where: {
        isActive: true,
        customerType,
        effectiveFrom: {
          lte: new Date(),
        },
      },
      include: {
        blocks: {
          orderBy: {
            fromM3: 'asc',
          },
        },
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (!activeTariff) {
      throw new Error(`No active tariff is configured yet for ${customerType.toLowerCase()}.`);
    }

    const normalizedBlocks = normalizeTariffBlocks(activeTariff.blocks);
    validateTariffBlocksOrThrow(normalizedBlocks);

    const previousReading = await prisma.meterReading.findFirst({
      where: {
        meterId: meter.id,
      },
      orderBy: [{ readingYear: 'desc' }, { readingMonth: 'desc' }, { createdAt: 'desc' }],
      select: {
        readingValue: true,
      },
    });

    const previousValue =
      previousReading?.readingValue ?? meter.lastReading ?? providedPreviousReadingValue;

    if (previousValue === null || previousValue === undefined) {
      throw new Error(
        'Previous month reading is required when no prior reading is available for this meter.'
      );
    }

    if (readingValue < previousValue) {
      throw new Error('The submitted reading must not be lower than the previous reading.');
    }

    const consumption = readingValue - previousValue;
    const amount = calculateTieredAmount(consumption, normalizedBlocks);
    const penaltyRatePercent =
      hasLateOcrAccess && !hasRegularOcrAccess
        ? Number(activeTariff.latePenaltyPerDayPercent || 0)
        : 0;
    const penaltyRate = Math.max(0, penaltyRatePercent) / 100;
    const latePenaltyAmount = Number((amount * penaltyRate).toFixed(2));
    const totalAmount = Number((amount + latePenaltyAmount).toFixed(2));
    const dueDate = new Date(year, month, 1);
    const billNumber = buildBillNumber({ meterNumber: meter.meterNumber, month, year });

    const createdBill = await prisma.$transaction(async (tx) => {
      const reading = await tx.meterReading.create({
        data: {
          meterId: meter.id,
          readingValue,
          readingMonth: month,
          readingYear: year,
          source,
          submittedById: user.id,
          userId: user.id,
          detectedMeterNumber: meter.meterNumber,
          detectedReading: readingValue,
          meterMatched: true,
          ocrMeterNumberText: meter.meterNumber,
          ocrReadingText: String(readingValue),
          ocrConfidence: Number.isFinite(ocrConfidence) ? ocrConfidence : null,
        },
      });

      const bill = await tx.bill.create({
        data: {
          billNumber,
          meterId: meter.id,
          readingId: reading.id,
          customerId: user.id,
          subCityId: meter.subCityId,
          customerType,
          billMonth: month,
          billYear: year,
          billingDate: new Date(),
          previousValue,
          currentValue: readingValue,
          consumption,
          tariffId: activeTariff.id,
          amount,
          totalAmount,
          latePenaltyAmount,
          dueDate,
          status: 'UNPAID',
        },
        include: {
          meter: {
            select: {
              id: true,
              meterNumber: true,
            },
          },
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneE164: true,
            },
          },
          reading: {
            select: {
              id: true,
              readingValue: true,
              source: true,
            },
          },
          tariff: {
            include: {
              blocks: {
                orderBy: {
                  fromM3: 'asc',
                },
              },
            },
          },
          payments: {
            take: 1,
          },
        },
      });

      await tx.meterReading.update({
        where: {
          id: reading.id,
        },
        data: {
          isBilled: true,
          billedAt: new Date(),
        },
      });

      await tx.meter.update({
        where: {
          id: meter.id,
        },
        data: {
          lastReading: readingValue,
          lastReadingDate: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'BILL_GENERATED',
          title: {
            en: 'Monthly bill generated',
            am: 'ወርሃዊ ቢል ተፈጥሯል',
          },
          message: {
            en: `Your bill for ${year}-${String(month).padStart(
              2,
              '0'
            )} is ready: ${totalAmount.toFixed(2)} ETB.`,
            am: `የ${year}-${String(month).padStart(2, '0')} ቢልዎ ዝግጁ ነው፡ ${totalAmount.toFixed(
              2
            )} ብር።`,
          },
          data: {
            billId: bill.id,
            meterNumber: meter.meterNumber,
            penaltyAmount: latePenaltyAmount,
            penaltyRatePercent,
          },
          isSent: true,
          sentVia: ['IN_APP'],
        },
      });

      return bill;
    });

    const billingCycleKey = `${year}-${String(month).padStart(2, '0')}`;
    const customerEmail = String(user.email || createdBill?.customer?.email || '').trim();
    if (customerEmail) {
      try {
        await sendBillingGeneratedNotice(customerEmail, {
          customerName: user.fullName,
          cycleKey: billingCycleKey,
          amountDue: totalAmount,
          consumption,
          currentReading: readingValue,
          billGeneratedDate: createdBill?.billingDate || createdBill?.createdAt || new Date(),
          dueDate: createdBill?.dueDate || null,
        });
      } catch (error) {
        console.error('Failed to send bill generated email notification:', error?.message || error);
      }
    }

    return buildMobileBillView(createdBill);
  }

  async requestLatePaymentOcrAccess(userId, payload = {}) {
    const customerType = normalizeCustomerType(payload?.customerType);
    if (!customerType) {
      throw new Error('Customer type is required for late OCR access.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
        subCityId: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    if (user.role !== 'CUSTOMER') {
      throw new Error('Only customers can request late OCR access.');
    }

    if (!user.subCityId) {
      throw new Error('Customer account is not assigned to a subcity.');
    }

    const now = new Date();
    const { month, year } = currentCycle(now);

    const regularWindow = await prisma.oCRWindow.findFirst({
      where: {
        subCityId: user.subCityId,
        month,
        year,
        isLateWindow: false,
      },
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        isActive: true,
        openDate: true,
        closeDate: true,
      },
    });

    if (regularWindow) {
      const regularStart = new Date(regularWindow.openDate);
      const regularClose = new Date(regularWindow.closeDate);
      const regularOpen =
        Boolean(regularWindow.isActive) && now >= regularStart && now <= regularClose;
      const regularScheduled = Boolean(regularWindow.isActive) && now < regularStart;

      if (regularOpen) {
        return {
          message: 'OCR window is already open. You can submit your scan now.',
          window: {
            isLateWindow: false,
            startDate: regularStart.toISOString(),
            closeDate: regularClose.toISOString(),
            month,
            year,
          },
          penaltyRatePercent: 0,
          penaltyFormula: 'Penalty = BillAmount x PenaltyRate',
        };
      }

      if (regularScheduled) {
        throw new Error(
          'OCR window is scheduled but not open yet. Please submit during the scheduled dates.'
        );
      }
    }

    const activeTariff = await prisma.tariff.findFirst({
      where: {
        isActive: true,
        customerType,
        effectiveFrom: {
          lte: now,
        },
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
      select: {
        latePenaltyPerDayPercent: true,
      },
    });

    if (!activeTariff) {
      throw new Error(`No active tariff is configured yet for ${customerType.toLowerCase()}.`);
    }

    const closeDate = new Date(now);
    closeDate.setDate(closeDate.getDate() + Math.max(1, LATE_OCR_WINDOW_DURATION_DAYS));

    const lateWindow = await prisma.$transaction(async (tx) => {
      const upserted = await tx.oCRWindow.upsert({
        where: {
          subCityId_month_year_isLateWindow: {
            subCityId: user.subCityId,
            month,
            year,
            isLateWindow: true,
          },
        },
        update: {
          openDate: now,
          closeDate,
          isActive: true,
          openedById: user.id,
        },
        create: {
          subCityId: user.subCityId,
          month,
          year,
          openDate: now,
          closeDate,
          isLateWindow: true,
          isActive: true,
          openedById: user.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'OCR_WINDOW_OPEN',
          title: {
            en: 'Late OCR Access Granted',
            am: 'የዘገየ OCR ፍቃድ ተሰጥቷል',
          },
          message: {
            en: 'Late OCR access has been opened for your account. A late-payment penalty will be applied to this bill.',
            am: 'የዘገየ OCR ፍቃድ ለመለያዎ ተከፍቷል። በዚህ ቢል ላይ የዘገየ ክፍያ ቅጣት ይተገበራል።',
          },
          data: {
            month,
            year,
            closeDate: closeDate.toISOString(),
            penaltyRatePercent: Number(activeTariff.latePenaltyPerDayPercent || 0),
          },
          isSent: true,
          sentVia: ['IN_APP'],
        },
      });

      return upserted;
    });

    return {
      message: 'Late OCR access granted successfully.',
      window: {
        isLateWindow: true,
        startDate: new Date(lateWindow.openDate).toISOString(),
        closeDate: new Date(lateWindow.closeDate).toISOString(),
        month,
        year,
      },
      penaltyRatePercent: Number(activeTariff.latePenaltyPerDayPercent || 0),
      penaltyFormula: 'Penalty = BillAmount x PenaltyRate',
    };
  }

  async payCurrentCycleBillWithMockChapa(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    if (user.role !== 'CUSTOMER') {
      throw new Error('Only customers can pay bills.');
    }

    const { month, year } = currentCycle();

    const bill = await prisma.bill.findFirst({
      where: {
        customerId: user.id,
        billMonth: month,
        billYear: year,
      },
      include: {
        meter: {
          select: {
            id: true,
            meterNumber: true,
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true,
          },
        },
        reading: {
          select: {
            id: true,
            readingValue: true,
            source: true,
          },
        },
        tariff: {
          include: {
            blocks: {
              orderBy: {
                fromM3: 'asc',
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!bill) {
      throw new Error('No generated bill was found for the current cycle.');
    }

    if (bill.status === 'PAID') {
      return {
        bill: buildMobileBillView(bill),
        payment: {
          status: 'SUCCESS',
          message: 'Bill is already paid.',
          usedChapa: true,
        },
      };
    }

    const amount = toNumber(bill.totalAmount);
    const txRef = `CHAPA-MOCK-${bill.id}-${Date.now()}`;

    const chapaInit = await initializeChapaSandbox({
      amount,
      email: user.email,
      fullName: user.fullName,
      phoneE164: user.phoneE164,
      txRef,
    });

    const settled = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          billId: bill.id,
          customerId: user.id,
          subCityId: bill.subCityId,
          amount,
          method: 'CHAPA',
          status: 'SUCCESS',
          transactionId: txRef,
          referenceNumber: chapaInit.checkoutUrl || chapaInit.referenceNumber || txRef,
          initiatedAt: new Date(),
          paidAt: new Date(),
        },
      });

      const updatedBill = await tx.bill.update({
        where: {
          id: bill.id,
        },
        data: {
          status: 'PAID',
          paidAmount: amount,
        },
        include: {
          meter: {
            select: {
              id: true,
              meterNumber: true,
            },
          },
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneE164: true,
            },
          },
          reading: {
            select: {
              id: true,
              readingValue: true,
              source: true,
            },
          },
          tariff: {
            include: {
              blocks: {
                orderBy: {
                  fromM3: 'asc',
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'PAYMENT_CONFIRMATION',
          title: {
            en: 'Payment successful',
            am: 'ክፍያ ተሳክቷል',
          },
          message: {
            en: `Payment of ${amount.toFixed(2)} ETB was recorded for your current bill.`,
            am: `የ${amount.toFixed(2)} ብር ክፍያ ለዚህ ወር ቢል ተመዝግቧል።`,
          },
          data: {
            billId: updatedBill.id,
            transactionId: payment.transactionId,
          },
          isSent: true,
          sentVia: ['IN_APP'],
        },
      });

      return {
        updatedBill,
        payment,
      };
    });

    const billingCycleKey = `${year}-${String(month).padStart(2, '0')}`;
    const customerEmail = String(user.email || settled?.updatedBill?.customer?.email || '').trim();
    if (customerEmail) {
      try {
        await sendBillingPaymentThankYouNotice(customerEmail, {
          customerName: user.fullName,
          cycleKey: billingCycleKey,
          amountPaid: amount,
          consumption: toNumber(settled?.updatedBill?.consumption),
          currentReading: Number(settled?.updatedBill?.currentValue || 0),
          billGeneratedDate:
            settled?.updatedBill?.billingDate || settled?.updatedBill?.createdAt || null,
          paymentDate: settled?.payment?.paidAt || new Date(),
        });
      } catch (error) {
        console.error(
          'Failed to send payment success email notification:',
          error?.message || error
        );
      }
    }

    return {
      bill: buildMobileBillView(settled.updatedBill),
      payment: {
        id: settled.payment.id,
        status: settled.payment.status,
        transactionId: settled.payment.transactionId,
        checkoutUrl: chapaInit.checkoutUrl,
        usedChapa: chapaInit.usedChapa,
        message: chapaInit.providerMessage,
      },
    };
  }

  async getOcrWindowStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subCityId: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const { month, year } = currentCycle(now);

    await prisma.oCRWindow.updateMany({
      where: {
        isActive: true,
        closeDate: { lt: now },
      },
      data: {
        isActive: false,
      },
    });

    const where = {
      ...(user.subCityId ? { subCityId: user.subCityId } : {}),
      month,
      year,
    };

    const cycleWindows = await prisma.oCRWindow.findMany({
      where,
      orderBy: [{ isLateWindow: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        isActive: true,
        isLateWindow: true,
        openDate: true,
        closeDate: true,
        month: true,
        year: true,
      },
    });

    const regularWindow = cycleWindows.find((item) => !item.isLateWindow) || null;
    const lateWindow = cycleWindows.find((item) => item.isLateWindow) || null;

    const isWindowOpen = (windowRecord) => {
      if (!windowRecord) {
        return false;
      }
      const start = new Date(windowRecord.openDate);
      const close = new Date(windowRecord.closeDate);
      return Boolean(windowRecord.isActive) && now >= start && now <= close;
    };

    const regularOpen = isWindowOpen(regularWindow);
    const lateOpen = isWindowOpen(lateWindow);

    const regularScheduled =
      regularWindow && Boolean(regularWindow.isActive) && now < new Date(regularWindow.openDate);

    const activeWindow = regularOpen
      ? regularWindow
      : lateOpen
      ? lateWindow
      : regularScheduled
      ? regularWindow
      : regularWindow || lateWindow;

    if (!activeWindow) {
      return {
        isConfigured: false,
        isOpen: false,
        isScheduled: false,
        isClosed: true,
        isLateWindow: false,
        startDate: null,
        closeDate: null,
        month: null,
        year: null,
      };
    }

    const start = new Date(activeWindow.openDate);
    const close = new Date(activeWindow.closeDate);
    const isOpen = regularOpen || lateOpen;
    const isScheduled = Boolean(regularScheduled) && !isOpen;

    return {
      isConfigured: true,
      isOpen,
      isScheduled,
      isClosed: !isOpen && !isScheduled,
      isLateWindow: lateOpen,
      startDate: start.toISOString(),
      closeDate: close.toISOString(),
      month: activeWindow.month,
      year: activeWindow.year,
    };
  }
}

export default new AuthService();
