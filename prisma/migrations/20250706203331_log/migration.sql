/*
  Warnings:

  - You are about to drop the column `endBreak` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `endShift` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `startBreak` on the `Technician` table. All the data in the column will be lost.
  - You are about to drop the column `startShift` on the `Technician` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('REGULAR', 'WEEKEND', 'HOLIDAY', 'OVERTIME');

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

-- CreateIndex
CREATE UNIQUE INDEX "Shift_technicianId_date_key" ON "Shift"("technicianId", "date");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
