/*
  Warnings:

  - You are about to drop the column `workId` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `_TechnicianToTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionStage" AS ENUM ('scheduled', 'stageOne', 'stageTwo', 'stageThree', 'completed', 'cancelled');

-- DropForeignKey
ALTER TABLE "_TechnicianToTransaction" DROP CONSTRAINT "_TechnicianToTransaction_A_fkey";

-- DropForeignKey
ALTER TABLE "_TechnicianToTransaction" DROP CONSTRAINT "_TechnicianToTransaction_B_fkey";

-- DropIndex
DROP INDEX "Technician_workId_key";

-- AlterTable
ALTER TABLE "AddOn" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "stage" "TransactionStage";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Model" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Technician" DROP COLUMN "workId",
ADD COLUMN     "endBreak" TIMESTAMP(3),
ADD COLUMN     "endShift" TIMESTAMP(3),
ADD COLUMN     "startBreak" TIMESTAMP(3),
ADD COLUMN     "startShift" TIMESTAMP(3),
ALTER COLUMN "mobileNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "status",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "stage" "TransactionStage" NOT NULL DEFAULT 'scheduled',
ADD COLUMN     "supervisorCommission" DOUBLE PRECISION,
ADD COLUMN     "supervisorId" TEXT;

-- DropTable
DROP TABLE "_TechnicianToTransaction";

-- DropEnum
DROP TYPE "TransactionStatus";

-- CreateTable
CREATE TABLE "_TransactionTechnicians" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TransactionTechnicians_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TransactionTechnicians_B_index" ON "_TransactionTechnicians"("B");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TransactionTechnicians" ADD CONSTRAINT "_TransactionTechnicians_A_fkey" FOREIGN KEY ("A") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TransactionTechnicians" ADD CONSTRAINT "_TransactionTechnicians_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
