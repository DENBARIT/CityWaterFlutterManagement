/*
  Warnings:

  - You are about to alter the column `amount` on the `Bill` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `latePenaltyAmount` on the `Bill` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `totalAmount` on the `Bill` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `paidAmount` on the `Bill` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to drop the column `subCityId` on the `Tariff` table. All the data in the column will be lost.
  - You are about to alter the column `pricePerM3` on the `TariffBlock` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to drop the column `kebele` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNational` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[version]` on the table `Tariff` will be added. If there are existing duplicate values, this will fail.
  - Made the column `subCityId` on table `Bill` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subCityId` on table `Complaint` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subCityId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `effectiveFrom` to the `Tariff` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fullName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nationalId` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subCityId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ReadingMode" AS ENUM ('OCR', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReadingSource" AS ENUM ('OCR', 'MANUAL');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MANUAL_METER_READER';

-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_readingId_fkey";

-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_subCityId_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_subCityId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_subCityId_fkey";

-- DropForeignKey
ALTER TABLE "Tariff" DROP CONSTRAINT "Tariff_subCityId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_subCityId_fkey";

-- DropIndex
DROP INDEX "Meter_customerId_key";

-- DropIndex
DROP INDEX "Tariff_subCityId_idx";

-- DropIndex
DROP INDEX "User_phoneNational_key";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Bill" ALTER COLUMN "subCityId" SET NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "latePenaltyAmount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Complaint" ALTER COLUMN "subCityId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Meter" ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "registeredById" TEXT,
ADD COLUMN     "registeredFullName" TEXT,
ADD COLUMN     "registeredHouseNumber" TEXT,
ADD COLUMN     "registeredNationalId" TEXT;

-- AlterTable
ALTER TABLE "MeterReading" ADD COLUMN     "enteredByManualReaderId" TEXT,
ADD COLUMN     "source" "ReadingSource" NOT NULL DEFAULT 'OCR',
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "subCityId" SET NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "SubCity" ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "readingMode" "ReadingMode" NOT NULL DEFAULT 'OCR';

-- AlterTable
ALTER TABLE "Tariff" DROP COLUMN "subCityId",
ADD COLUMN     "effectiveFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "effectiveTo" TIMESTAMP(3),
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "TariffBlock" ALTER COLUMN "pricePerM3" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "kebele",
DROP COLUMN "phoneNational",
DROP COLUMN "username",
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "nationalId" SET NOT NULL,
ALTER COLUMN "subCityId" SET NOT NULL;

-- CreateTable
CREATE TABLE "ManualMeterReaderAssignment" (
    "id" TEXT NOT NULL,
    "subCityId" TEXT NOT NULL,
    "woredaId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualMeterReaderAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterOwnershipHistory" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "MeterOwnershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualMeterReaderAssignment_subCityId_idx" ON "ManualMeterReaderAssignment"("subCityId");

-- CreateIndex
CREATE INDEX "ManualMeterReaderAssignment_woredaId_idx" ON "ManualMeterReaderAssignment"("woredaId");

-- CreateIndex
CREATE INDEX "ManualMeterReaderAssignment_readerId_idx" ON "ManualMeterReaderAssignment"("readerId");

-- CreateIndex
CREATE UNIQUE INDEX "ManualMeterReaderAssignment_woredaId_readerId_key" ON "ManualMeterReaderAssignment"("woredaId", "readerId");

-- CreateIndex
CREATE INDEX "MeterOwnershipHistory_meterId_idx" ON "MeterOwnershipHistory"("meterId");

-- CreateIndex
CREATE INDEX "MeterOwnershipHistory_userId_idx" ON "MeterOwnershipHistory"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_tokenHash_idx" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "Meter_registeredNationalId_idx" ON "Meter"("registeredNationalId");

-- CreateIndex
CREATE INDEX "Meter_customerId_idx" ON "Meter"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_version_key" ON "Tariff"("version");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "MeterReading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualMeterReaderAssignment" ADD CONSTRAINT "ManualMeterReaderAssignment_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualMeterReaderAssignment" ADD CONSTRAINT "ManualMeterReaderAssignment_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualMeterReaderAssignment" ADD CONSTRAINT "ManualMeterReaderAssignment_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualMeterReaderAssignment" ADD CONSTRAINT "ManualMeterReaderAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterOwnershipHistory" ADD CONSTRAINT "MeterOwnershipHistory_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterOwnershipHistory" ADD CONSTRAINT "MeterOwnershipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_enteredByManualReaderId_fkey" FOREIGN KEY ("enteredByManualReaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subCityId_fkey" FOREIGN KEY ("subCityId") REFERENCES "SubCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
