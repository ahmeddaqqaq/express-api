-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('SHIFT_STARTED', 'SHIFT_ENDED', 'BREAK_STARTED', 'BREAK_ENDED', 'OVERTIME_STARTED', 'OVERTIME_ENDED', 'TRANSACTION_ASSIGNED', 'TRANSACTION_STARTED', 'TRANSACTION_COMPLETED', 'PHASE_TRANSITION', 'TECHNICIAN_CHANGED');

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

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "phase" "TransactionStatus",
ADD COLUMN     "transactionId" TEXT,
ALTER COLUMN "action" SET DATA TYPE "AuditAction";

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianAssignment_technicianId_transactionId_phase_key" ON "TechnicianAssignment"("technicianId", "transactionId", "phase");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianAssignment" ADD CONSTRAINT "TechnicianAssignment_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianAssignment" ADD CONSTRAINT "TechnicianAssignment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;