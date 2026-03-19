-- Merge migration for Flutter OTP registration flow and pending registrations.

ALTER TABLE "User"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "otp" TEXT,
ADD COLUMN "otpExpiry" TIMESTAMP(3);

CREATE TABLE "PendingRegistration" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "nationalId" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "meterNumber" TEXT NOT NULL,
  "subCityId" TEXT NOT NULL,
  "woredaId" TEXT,
  "otp" TEXT NOT NULL,
  "otpExpiry" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingRegistration_phoneE164_key" ON "PendingRegistration"("phoneE164");
CREATE UNIQUE INDEX "PendingRegistration_email_key" ON "PendingRegistration"("email");
CREATE UNIQUE INDEX "PendingRegistration_nationalId_key" ON "PendingRegistration"("nationalId");
CREATE UNIQUE INDEX "PendingRegistration_meterNumber_key" ON "PendingRegistration"("meterNumber");
CREATE INDEX "PendingRegistration_subCityId_idx" ON "PendingRegistration"("subCityId");
CREATE INDEX "PendingRegistration_woredaId_idx" ON "PendingRegistration"("woredaId");

ALTER TABLE "PendingRegistration"
ADD CONSTRAINT "PendingRegistration_subCityId_fkey"
FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PendingRegistration"
ADD CONSTRAINT "PendingRegistration_woredaId_fkey"
FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
