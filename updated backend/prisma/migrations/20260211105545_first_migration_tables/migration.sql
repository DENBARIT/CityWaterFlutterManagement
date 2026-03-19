-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SUBCITY_ADMIN', 'SUBCITY_BILLING_OFFICER', 'SUBCITY_COMPLAINT_OFFICER', 'WOREDA_BILLING_OFFICER', 'WOREDA_COMPLAINT_OFFICER', 'FIELD_OFFICER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MeterStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'OVERDUE', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CHAPA', 'TELEBIRR', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('BILLING', 'WATER_SUPPLY', 'NO_WATER', 'LOW_PRESSURE', 'LEAKAGE', 'PIPE_DAMAGE', 'TAP_DAMAGE', 'POLLUTED_WATER', 'METER_DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BILL_GENERATED', 'PAYMENT_CONFIRMATION', 'PAYMENT_REMINDER', 'COMPLAINT_UPDATE', 'SCHEDULE_CHANGE', 'OUTAGE_ALERT', 'MAINTENANCE_NOTICE', 'OCR_WINDOW_OPEN', 'OCR_WINDOW_CLOSED', 'SYSTEM_ANNOUNCEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'OCR_WINDOW_OPENED', 'OCR_WINDOW_CLOSED', 'OCR_SCAN', 'COMPLAINT_CREATE', 'COMPLAINT_UPDATE', 'COMPLAINT_ESCALATE', 'BILL_GENERATE', 'SCHEDULE_UPDATE', 'TARIFF_UPDATE', 'USER_REGISTRATION', 'ROLE_CHANGE');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL', 'EMERGENCY', 'OUTAGE', 'MAINTENANCE', 'BILLING');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('REVENUE', 'CONSUMPTION', 'COMPLAINTS', 'COLLECTION', 'DISCONNECTIONS');

-- CreateEnum
CREATE TYPE "ReportPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "DisconnectionStatus" AS ENUM ('PENDING', 'DISCONNECTED', 'RECONNECTED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('VIDEO', 'PDF', 'LINK', 'CSV', 'EXCEL');

-- CreateEnum
CREATE TYPE "ResourceAudience" AS ENUM ('CUSTOMER', 'OFFICERS', 'ALL');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'CUSTOMERS', 'FIELD_OFFICERS', 'SUBCITY_ADMINS', 'SUBCITY_BILLING_OFFICERS', 'SUBCITY_COMPLAINT_OFFICERS', 'WOREDA_BILLING_OFFICERS', 'WOREDA_COMPLAINT_OFFICERS');

-- CreateEnum
CREATE TYPE "InfrastructureImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "InfrastructureProjectType" AS ENUM ('CORRIDOR', 'PIPE_REPLACEMENT', 'ROAD_EXPANSION', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsumptionAnomalyType" AS ENUM ('SPIKE', 'DROP', 'ZERO_USAGE');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- CreateTable
CREATE TABLE "SubCity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SubCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Woreda" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Woreda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "phoneNational" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "fullName" TEXT,
    "nationalId" TEXT,
    "profileImageUrl" TEXT,
    "houseNumber" TEXT,
    "kebele" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "subCityId" TEXT,
    "woredaId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'am',
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "accentColor" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingOfficerAssignment" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT NOT NULL,
    "woredaId" TEXT,
    "officerId" TEXT NOT NULL,
    "isSubCityLevel" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingOfficerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintOfficerAssignment" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT NOT NULL,
    "woredaId" TEXT,
    "officerId" TEXT NOT NULL,
    "isSubCityLevel" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintOfficerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOfficerWoredaAssignment" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldOfficerWoredaAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meter" (
    "id" TEXT NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "status" "MeterStatus" NOT NULL DEFAULT 'ACTIVE',
    "subCityId" TEXT NOT NULL,
    "customerId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lastReading" INTEGER,
    "lastReadingDate" TIMESTAMP(3),
    "meterLabelImageUrl" TEXT,
    "installedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OCRWindow" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "openDate" TIMESTAMP(3) NOT NULL,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "isLateWindow" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "openedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OCRWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "readingValue" INTEGER NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readingMonth" INTEGER NOT NULL,
    "readingYear" INTEGER NOT NULL,
    "ocrReadingText" TEXT,
    "ocrMeterNumberText" TEXT,
    "detectedMeterNumber" TEXT,
    "detectedReading" INTEGER,
    "ocrConfidence" DOUBLE PRECISION,
    "meterMatched" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "isAdjusted" BOOLEAN NOT NULL DEFAULT false,
    "adjustedById" TEXT,
    "adjustedAt" TIMESTAMP(3),
    "isBilled" BOOLEAN NOT NULL DEFAULT false,
    "billedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "latePenaltyPerDayPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedMonthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffBlock" (
    "id" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "fromM3" INTEGER NOT NULL,
    "toM3" INTEGER,
    "pricePerM3" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "customerId" TEXT,
    "subCityId" TEXT,
    "billMonth" INTEGER NOT NULL,
    "billYear" INTEGER NOT NULL,
    "billingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL,
    "consumption" INTEGER NOT NULL,
    "tariffId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "latePenaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "customerId" TEXT,
    "subCityId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "referenceNumber" TEXT,
    "failureReason" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subCityId" TEXT,
    "woredaId" TEXT,
    "assignedToId" TEXT,
    "assignedFieldOfficerId" TEXT,
    "category" "ComplaintCategory" NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "escalatedToId" TEXT,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "location" TEXT,
    "mediaUrls" TEXT[],
    "escalatedById" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "escalationReason" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterSchedule" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT NOT NULL,
    "woredaId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "dayOfWeek" "WeekDay",
    "note" JSONB,
    "createdById" TEXT,
    "infrastructureProjectId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureProject" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "name" TEXT NOT NULL,
    "projectType" "InfrastructureProjectType" NOT NULL,
    "subCityId" TEXT,
    "affectedWoredaIds" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "impactLevel" "InfrastructureImpactLevel" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfrastructureProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT,
    "targetWoredaIds" TEXT[],
    "type" "AnnouncementType" NOT NULL DEFAULT 'GENERAL',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" JSONB NOT NULL,
    "message" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBroadcast" BOOLEAN NOT NULL DEFAULT false,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "targetUserIds" TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" JSONB NOT NULL,
    "message" JSONB NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentVia" "DeliveryChannel"[],
    "providerMessageId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "description" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disconnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "disconnectionDate" TIMESTAMP(3) NOT NULL,
    "expectedReconnectionDate" TIMESTAMP(3),
    "actualReconnectionDate" TIMESTAMP(3),
    "status" "DisconnectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disconnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT,
    "reportType" "ReportType" NOT NULL,
    "periodType" "ReportPeriodType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "summary" JSONB,
    "generatedById" TEXT,
    "availableFormats" "ResourceType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemResource" (
    "id" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "audience" "ResourceAudience" NOT NULL DEFAULT 'ALL',
    "title" JSONB NOT NULL,
    "description" JSONB,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "feedback" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumptionAnomaly" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "anomalyType" "ConsumptionAnomalyType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumptionAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubCity_name_key" ON "SubCity"("name");

-- CreateIndex
CREATE INDEX "SubCity_isActive_idx" ON "SubCity"("isActive");

-- CreateIndex
CREATE INDEX "SubCity_deletedAt_idx" ON "SubCity"("deletedAt");

-- CreateIndex
CREATE INDEX "Woreda_subCityId_idx" ON "Woreda"("subCityId");

-- CreateIndex
CREATE INDEX "Woreda_isActive_idx" ON "Woreda"("isActive");

-- CreateIndex
CREATE INDEX "Woreda_deletedAt_idx" ON "Woreda"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Woreda_subCityId_name_key" ON "Woreda"("subCityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneE164_key" ON "User"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNational_key" ON "User"("phoneNational");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_subCityId_idx" ON "User"("subCityId");

-- CreateIndex
CREATE INDEX "User_woredaId_idx" ON "User"("woredaId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "BillingOfficerAssignment_subCityId_idx" ON "BillingOfficerAssignment"("subCityId");

-- CreateIndex
CREATE INDEX "BillingOfficerAssignment_woredaId_idx" ON "BillingOfficerAssignment"("woredaId");

-- CreateIndex
CREATE INDEX "BillingOfficerAssignment_officerId_idx" ON "BillingOfficerAssignment"("officerId");

-- CreateIndex
CREATE INDEX "BillingOfficerAssignment_isActive_idx" ON "BillingOfficerAssignment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BillingOfficerAssignment_woredaId_officerId_key" ON "BillingOfficerAssignment"("woredaId", "officerId");

-- CreateIndex
CREATE INDEX "ComplaintOfficerAssignment_subCityId_idx" ON "ComplaintOfficerAssignment"("subCityId");

-- CreateIndex
CREATE INDEX "ComplaintOfficerAssignment_woredaId_idx" ON "ComplaintOfficerAssignment"("woredaId");

-- CreateIndex
CREATE INDEX "ComplaintOfficerAssignment_officerId_idx" ON "ComplaintOfficerAssignment"("officerId");

-- CreateIndex
CREATE INDEX "ComplaintOfficerAssignment_isActive_idx" ON "ComplaintOfficerAssignment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintOfficerAssignment_woredaId_officerId_key" ON "ComplaintOfficerAssignment"("woredaId", "officerId");

-- CreateIndex
CREATE INDEX "FieldOfficerWoredaAssignment_subCityId_idx" ON "FieldOfficerWoredaAssignment"("subCityId");

-- CreateIndex
CREATE INDEX "FieldOfficerWoredaAssignment_woredaId_idx" ON "FieldOfficerWoredaAssignment"("woredaId");

-- CreateIndex
CREATE INDEX "FieldOfficerWoredaAssignment_officerId_idx" ON "FieldOfficerWoredaAssignment"("officerId");

-- CreateIndex
CREATE INDEX "FieldOfficerWoredaAssignment_isActive_idx" ON "FieldOfficerWoredaAssignment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FieldOfficerWoredaAssignment_woredaId_officerId_key" ON "FieldOfficerWoredaAssignment"("woredaId", "officerId");

-- CreateIndex
CREATE UNIQUE INDEX "Meter_meterNumber_key" ON "Meter"("meterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Meter_customerId_key" ON "Meter"("customerId");

-- CreateIndex
CREATE INDEX "Meter_subCityId_idx" ON "Meter"("subCityId");

-- CreateIndex
CREATE INDEX "Meter_status_idx" ON "Meter"("status");

-- CreateIndex
CREATE INDEX "Meter_isLocked_idx" ON "Meter"("isLocked");

-- CreateIndex
CREATE INDEX "Meter_deletedAt_idx" ON "Meter"("deletedAt");

-- CreateIndex
CREATE INDEX "OCRWindow_subCityId_idx" ON "OCRWindow"("subCityId");

-- CreateIndex
CREATE INDEX "OCRWindow_year_month_idx" ON "OCRWindow"("year", "month");

-- CreateIndex
CREATE INDEX "OCRWindow_isActive_idx" ON "OCRWindow"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "OCRWindow_subCityId_month_year_isLateWindow_key" ON "OCRWindow"("subCityId", "month", "year", "isLateWindow");

-- CreateIndex
CREATE INDEX "MeterReading_meterId_idx" ON "MeterReading"("meterId");

-- CreateIndex
CREATE INDEX "MeterReading_ocrConfidence_idx" ON "MeterReading"("ocrConfidence");

-- CreateIndex
CREATE INDEX "MeterReading_readingYear_readingMonth_idx" ON "MeterReading"("readingYear", "readingMonth");

-- CreateIndex
CREATE INDEX "MeterReading_isBilled_idx" ON "MeterReading"("isBilled");

-- CreateIndex
CREATE INDEX "MeterReading_meterMatched_idx" ON "MeterReading"("meterMatched");

-- CreateIndex
CREATE INDEX "MeterReading_readingDate_idx" ON "MeterReading"("readingDate");

-- CreateIndex
CREATE UNIQUE INDEX "MeterReading_meterId_readingMonth_readingYear_key" ON "MeterReading"("meterId", "readingMonth", "readingYear");

-- CreateIndex
CREATE INDEX "Tariff_subCityId_idx" ON "Tariff"("subCityId");

-- CreateIndex
CREATE INDEX "Tariff_isActive_idx" ON "Tariff"("isActive");

-- CreateIndex
CREATE INDEX "TariffBlock_tariffId_idx" ON "TariffBlock"("tariffId");

-- CreateIndex
CREATE UNIQUE INDEX "TariffBlock_tariffId_fromM3_key" ON "TariffBlock"("tariffId", "fromM3");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_readingId_key" ON "Bill"("readingId");

-- CreateIndex
CREATE INDEX "Bill_meterId_idx" ON "Bill"("meterId");

-- CreateIndex
CREATE INDEX "Bill_customerId_idx" ON "Bill"("customerId");

-- CreateIndex
CREATE INDEX "Bill_subCityId_idx" ON "Bill"("subCityId");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE INDEX "Bill_billYear_billMonth_idx" ON "Bill"("billYear", "billMonth");

-- CreateIndex
CREATE INDEX "Bill_dueDate_idx" ON "Bill"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_billId_idx" ON "Payment"("billId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "Payment"("method");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_subCityId_idx" ON "Payment"("subCityId");

-- CreateIndex
CREATE INDEX "Payment_initiatedAt_idx" ON "Payment"("initiatedAt");

-- CreateIndex
CREATE INDEX "Complaint_customerId_idx" ON "Complaint"("customerId");

-- CreateIndex
CREATE INDEX "Complaint_assignedToId_idx" ON "Complaint"("assignedToId");

-- CreateIndex
CREATE INDEX "Complaint_assignedFieldOfficerId_idx" ON "Complaint"("assignedFieldOfficerId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");

-- CreateIndex
CREATE INDEX "Complaint_subCityId_idx" ON "Complaint"("subCityId");

-- CreateIndex
CREATE INDEX "Complaint_woredaId_idx" ON "Complaint"("woredaId");

-- CreateIndex
CREATE INDEX "Complaint_escalatedAt_idx" ON "Complaint"("escalatedAt");

-- CreateIndex
CREATE INDEX "Complaint_escalatedToId_idx" ON "Complaint"("escalatedToId");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_deletedAt_idx" ON "Complaint"("deletedAt");

-- CreateIndex
CREATE INDEX "WaterSchedule_subCityId_idx" ON "WaterSchedule"("subCityId");

-- CreateIndex
CREATE INDEX "WaterSchedule_woredaId_idx" ON "WaterSchedule"("woredaId");

-- CreateIndex
CREATE INDEX "WaterSchedule_startAt_idx" ON "WaterSchedule"("startAt");

-- CreateIndex
CREATE INDEX "WaterSchedule_endAt_idx" ON "WaterSchedule"("endAt");

-- CreateIndex
CREATE INDEX "WaterSchedule_isRecurring_idx" ON "WaterSchedule"("isRecurring");

-- CreateIndex
CREATE INDEX "WaterSchedule_dayOfWeek_idx" ON "WaterSchedule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "WaterSchedule_deletedAt_idx" ON "WaterSchedule"("deletedAt");

-- CreateIndex
CREATE INDEX "InfrastructureProject_subCityId_idx" ON "InfrastructureProject"("subCityId");

-- CreateIndex
CREATE INDEX "InfrastructureProject_projectType_idx" ON "InfrastructureProject"("projectType");

-- CreateIndex
CREATE INDEX "InfrastructureProject_impactLevel_idx" ON "InfrastructureProject"("impactLevel");

-- CreateIndex
CREATE INDEX "InfrastructureProject_startDate_endDate_idx" ON "InfrastructureProject"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Announcement_subCityId_idx" ON "Announcement"("subCityId");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement"("isActive");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Announcement_priority_idx" ON "Announcement"("priority");

-- CreateIndex
CREATE INDEX "AnnouncementRead_announcementId_idx" ON "AnnouncementRead"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_isSent_idx" ON "Notification"("isSent");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Disconnection_userId_idx" ON "Disconnection"("userId");

-- CreateIndex
CREATE INDEX "Disconnection_meterId_idx" ON "Disconnection"("meterId");

-- CreateIndex
CREATE INDEX "Disconnection_status_idx" ON "Disconnection"("status");

-- CreateIndex
CREATE INDEX "Report_subCityId_idx" ON "Report"("subCityId");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");

-- CreateIndex
CREATE INDEX "Report_periodType_idx" ON "Report"("periodType");

-- CreateIndex
CREATE INDEX "Report_startDate_endDate_idx" ON "Report"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "SystemResource_type_idx" ON "SystemResource"("type");

-- CreateIndex
CREATE INDEX "SystemResource_audience_idx" ON "SystemResource"("audience");

-- CreateIndex
CREATE INDEX "SystemResource_isActive_idx" ON "SystemResource"("isActive");

-- CreateIndex
CREATE INDEX "TrainingSession_subCityId_idx" ON "TrainingSession"("subCityId");

-- CreateIndex
CREATE INDEX "TrainingSession_date_idx" ON "TrainingSession"("date");

-- CreateIndex
CREATE INDEX "TrainingAttendance_sessionId_idx" ON "TrainingAttendance"("sessionId");

-- CreateIndex
CREATE INDEX "TrainingAttendance_userId_idx" ON "TrainingAttendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_sessionId_userId_key" ON "TrainingAttendance"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "ConsumptionAnomaly_meterId_idx" ON "ConsumptionAnomaly"("meterId");

-- CreateIndex
CREATE INDEX "ConsumptionAnomaly_readingId_idx" ON "ConsumptionAnomaly"("readingId");

-- CreateIndex
CREATE INDEX "ConsumptionAnomaly_reviewed_idx" ON "ConsumptionAnomaly"("reviewed");

-- CreateIndex
CREATE INDEX "ConsumptionAnomaly_createdAt_idx" ON "ConsumptionAnomaly"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsumptionAnomaly_readingId_anomalyType_key" ON "ConsumptionAnomaly"("readingId", "anomalyType");

-- AddForeignKey
ALTER TABLE "SubCity" ADD CONSTRAINT "SubCity_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Woreda" ADD CONSTRAINT "Woreda_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingOfficerAssignment" ADD CONSTRAINT "BillingOfficerAssignment_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingOfficerAssignment" ADD CONSTRAINT "BillingOfficerAssignment_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingOfficerAssignment" ADD CONSTRAINT "BillingOfficerAssignment_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingOfficerAssignment" ADD CONSTRAINT "BillingOfficerAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintOfficerAssignment" ADD CONSTRAINT "ComplaintOfficerAssignment_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintOfficerAssignment" ADD CONSTRAINT "ComplaintOfficerAssignment_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintOfficerAssignment" ADD CONSTRAINT "ComplaintOfficerAssignment_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintOfficerAssignment" ADD CONSTRAINT "ComplaintOfficerAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerWoredaAssignment" ADD CONSTRAINT "FieldOfficerWoredaAssignment_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerWoredaAssignment" ADD CONSTRAINT "FieldOfficerWoredaAssignment_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerWoredaAssignment" ADD CONSTRAINT "FieldOfficerWoredaAssignment_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOfficerWoredaAssignment" ADD CONSTRAINT "FieldOfficerWoredaAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OCRWindow" ADD CONSTRAINT "OCRWindow_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OCRWindow" ADD CONSTRAINT "OCRWindow_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffBlock" ADD CONSTRAINT "TariffBlock_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "MeterReading"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedFieldOfficerId_fkey" FOREIGN KEY ("assignedFieldOfficerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_escalatedById_fkey" FOREIGN KEY ("escalatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_escalatedToId_fkey" FOREIGN KEY ("escalatedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterSchedule" ADD CONSTRAINT "WaterSchedule_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterSchedule" ADD CONSTRAINT "WaterSchedule_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterSchedule" ADD CONSTRAINT "WaterSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterSchedule" ADD CONSTRAINT "WaterSchedule_infrastructureProjectId_fkey" FOREIGN KEY ("infrastructureProjectId") REFERENCES "InfrastructureProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfrastructureProject" ADD CONSTRAINT "InfrastructureProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfrastructureProject" ADD CONSTRAINT "InfrastructureProject_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disconnection" ADD CONSTRAINT "Disconnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disconnection" ADD CONSTRAINT "Disconnection_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemResource" ADD CONSTRAINT "SystemResource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionAnomaly" ADD CONSTRAINT "ConsumptionAnomaly_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionAnomaly" ADD CONSTRAINT "ConsumptionAnomaly_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "MeterReading"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionAnomaly" ADD CONSTRAINT "ConsumptionAnomaly_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
