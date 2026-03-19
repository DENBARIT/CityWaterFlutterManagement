-- AlterTable
ALTER TABLE "Meter" ADD COLUMN     "woredaId" TEXT;

-- CreateIndex
CREATE INDEX "Meter_woredaId_idx" ON "Meter"("woredaId");

-- AddForeignKey
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
