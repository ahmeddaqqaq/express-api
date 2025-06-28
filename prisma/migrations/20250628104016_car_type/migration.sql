/*
  Warnings:

  - You are about to drop the column `price` on the `Service` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('Bike', 'Sedan', 'Crossover', 'SUV', 'VAN');

-- DropForeignKey
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_imageId_fkey";

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "type" "CarType" NOT NULL DEFAULT 'Sedan';

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "price";

-- CreateTable
CREATE TABLE "ServicePrice" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "carType" "CarType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_serviceId_carType_key" ON "ServicePrice"("serviceId", "carType");

-- AddForeignKey
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
