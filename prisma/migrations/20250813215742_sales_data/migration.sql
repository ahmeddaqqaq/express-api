/*
  Warnings:

  - You are about to drop the column `createdById` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Supervisor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionAddonSales` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('SERVICE', 'ADDON');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_createdById_fkey";

-- DropForeignKey
ALTER TABLE "TransactionAddonSales" DROP CONSTRAINT "TransactionAddonSales_salesId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionAddonSales" DROP CONSTRAINT "TransactionAddonSales_transactionId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "createdById";

-- DropTable
DROP TABLE "Supervisor";

-- DropTable
DROP TABLE "TransactionAddonSales";

-- CreateTable
CREATE TABLE "SalesRecord" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "sellerId" TEXT,
    "salesPersonId" TEXT,
    "saleType" "SaleType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesRecord_transactionId_idx" ON "SalesRecord"("transactionId");

-- CreateIndex
CREATE INDEX "SalesRecord_sellerId_soldAt_idx" ON "SalesRecord"("sellerId", "soldAt");

-- CreateIndex
CREATE INDEX "SalesRecord_salesPersonId_soldAt_idx" ON "SalesRecord"("salesPersonId", "soldAt");

-- CreateIndex
CREATE INDEX "SalesRecord_saleType_soldAt_idx" ON "SalesRecord"("saleType", "soldAt");

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "Sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
