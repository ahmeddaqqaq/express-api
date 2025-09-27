/*
  Warnings:

  - A unique constraint covering the columns `[customerSubscriptionId]` on the table `PosOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CustomerSubscription" ADD COLUMN     "isPulled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PosOrder" ADD COLUMN     "customerSubscriptionId" TEXT,
ALTER COLUMN "transactionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PosOrder_customerSubscriptionId_key" ON "PosOrder"("customerSubscriptionId");

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_customerSubscriptionId_fkey" FOREIGN KEY ("customerSubscriptionId") REFERENCES "CustomerSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
