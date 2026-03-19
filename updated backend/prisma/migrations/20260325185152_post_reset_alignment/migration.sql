-- CreateEnum
CREATE TYPE "FieldOfficerType" AS ENUM ('MANUAL_METER_READER', 'PLUMBER', 'TECHNICIAN', 'MAINTENANCE', 'INSPECTOR');

-- AlterEnum
ALTER TYPE "AnnouncementAudience" ADD VALUE 'WOREDA_ADMINS';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'WOREDA_ADMINS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fieldOfficerType" "FieldOfficerType";
