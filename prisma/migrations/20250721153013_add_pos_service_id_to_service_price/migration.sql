/*
  Warnings:

  - You are about to drop the column `posServiceId` on the `Service` table. All the data in the column will be lost.
  - Added the required column `posServiceId` to the `ServicePrice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "posServiceId";

-- AlterTable
ALTER TABLE "ServicePrice" ADD COLUMN     "posServiceId" INTEGER NOT NULL;
