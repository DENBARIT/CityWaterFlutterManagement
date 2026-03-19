-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'GOVERNMENTAL');

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'RESIDENTIAL';

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'RESIDENTIAL';

-- CreateIndex
CREATE INDEX "Bill_customerType_idx" ON "Bill"("customerType");

-- CreateIndex
CREATE INDEX "Tariff_customerType_isActive_idx" ON "Tariff"("customerType", "isActive");
