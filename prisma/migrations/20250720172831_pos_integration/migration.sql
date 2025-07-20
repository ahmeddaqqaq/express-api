/*
  Warnings:

  - You are about to drop the column `supervisorId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `posServiceId` to the `AddOn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `posServiceId` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_supervisorId_fkey";

-- AlterTable
ALTER TABLE "AddOn" ADD COLUMN     "posServiceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "posServiceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "supervisorId",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PosOrder" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosOrder_transactionId_key" ON "PosOrder"("transactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Supervisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
