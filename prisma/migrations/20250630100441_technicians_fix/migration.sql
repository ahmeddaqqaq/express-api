/*
  Warnings:

  - You are about to drop the column `mobileNumber` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `workId` on the `Technician` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Technician_workId_key";

-- AlterTable
ALTER TABLE "Technician" DROP COLUMN "mobileNumber",
DROP COLUMN "workId";
