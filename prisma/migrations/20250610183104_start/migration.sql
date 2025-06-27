/*
  Warnings:

  - You are about to drop the column `stage` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `endBreak` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `endShift` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `startBreak` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `startShift` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorCommission` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `_TransactionTechnicians` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[workId]` on the table `Technician` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workId` to the `Technician` table without a default value. This is not possible if the table is not empty.
  - Made the column `mobileNumber` on table `Technician` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('scheduled', 'stageOne', 'stageTwo', 'completed', 'cancelled');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "_TransactionTechnicians" DROP CONSTRAINT "_TransactionTechnicians_A_fkey";

-- DropForeignKey
ALTER TABLE "_TransactionTechnicians" DROP CONSTRAINT "_TransactionTechnicians_B_fkey";

-- AlterTable
ALTER TABLE "AddOn" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "stage";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Model" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Technician" DROP COLUMN "endBreak",
DROP COLUMN "endShift",
DROP COLUMN "startBreak",
DROP COLUMN "startShift",
ADD COLUMN     "workId" TEXT NOT NULL,
ALTER COLUMN "mobileNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "notes",
DROP COLUMN "stage",
DROP COLUMN "supervisorCommission",
DROP COLUMN "supervisorId",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'scheduled';

-- DropTable
DROP TABLE "_TransactionTechnicians";

-- DropEnum
DROP TYPE "TransactionStage";

-- CreateTable
CREATE TABLE "_TechnicianToTransaction" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TechnicianToTransaction_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TechnicianToTransaction_B_index" ON "_TechnicianToTransaction"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_workId_key" ON "Technician"("workId");

-- AddForeignKey
ALTER TABLE "_TechnicianToTransaction" ADD CONSTRAINT "_TechnicianToTransaction_A_fkey" FOREIGN KEY ("A") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TechnicianToTransaction" ADD CONSTRAINT "_TechnicianToTransaction_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
