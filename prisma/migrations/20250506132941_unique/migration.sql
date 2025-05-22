/*
  Warnings:

  - Made the column `mobileNumber` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "mobileNumber" SET NOT NULL;
