/*
  Warnings:

  - You are about to drop the column `endBreak` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `endShift` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `startBreak` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `startShift` on the `Technician` table. All the data in the column will be lost.
  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('REGULAR', 'WEEKEND', 'HOLIDAY', 'OVERTIME');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('SHIFT_STARTED', 'SHIFT_ENDED', 'BREAK_STARTED', 'BREAK_ENDED', 'OVERTIME_STARTED', 'OVERTIME_ENDED', 'TRANSACTION_ASSIGNED', 'TRANSACTION_STARTED', 'TRANSACTION_COMPLETED', 'PHASE_TRANSITION', 'TECHNICIAN_CHANGED');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "phase" "TransactionStatus",
ADD COLUMN     "transactionId" TEXT,
DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL;

-- AlterTable
ALTER TABLE "Technician" DROP COLUMN "endBreak",
DROP COLUMN "endShift",
DROP COLUMN "startBreak",
DROP COLUMN "startShift";

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "breakStart" TIMESTAMP(3),
    "breakEnd" TIMESTAMP(3),
    "overtimeStart" TIMESTAMP(3),
    "overtimeEnd" TIMESTAMP(3),
    "shiftType" "ShiftType" NOT NULL DEFAULT 'REGULAR',
    "hourlyRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianAssignment" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "phase" "TransactionStatus" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shift_technicianId_date_key" ON "Shift"("technicianId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianAssignment_technicianId_transactionId_phase_key" ON "TechnicianAssignment"("technicianId", "transactionId", "phase");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianAssignment" ADD CONSTRAINT "TechnicianAssignment_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianAssignment" ADD CONSTRAINT "TechnicianAssignment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
