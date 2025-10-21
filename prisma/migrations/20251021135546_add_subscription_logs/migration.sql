-- CreateEnum
CREATE TYPE "SubscriptionAction" AS ENUM ('PURCHASED', 'ACTIVATED');

-- CreateTable
CREATE TABLE "SubscriptionLog" (
    "id" TEXT NOT NULL,
    "customerSubscriptionId" TEXT NOT NULL,
    "action" "SubscriptionAction" NOT NULL,
    "purchasedById" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "activatedById" TEXT,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionLog_customerSubscriptionId_idx" ON "SubscriptionLog"("customerSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionLog_action_idx" ON "SubscriptionLog"("action");

-- AddForeignKey
ALTER TABLE "SubscriptionLog" ADD CONSTRAINT "SubscriptionLog_customerSubscriptionId_fkey" FOREIGN KEY ("customerSubscriptionId") REFERENCES "CustomerSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionLog" ADD CONSTRAINT "SubscriptionLog_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionLog" ADD CONSTRAINT "SubscriptionLog_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
