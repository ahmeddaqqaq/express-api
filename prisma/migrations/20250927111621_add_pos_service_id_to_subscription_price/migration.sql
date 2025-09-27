/*
  Warnings:

  - Added the required column `posServiceId` to the `SubscriptionPrice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionPrice" ADD COLUMN     "posServiceId" INTEGER NOT NULL;
