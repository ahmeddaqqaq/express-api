/*
  Warnings:

  - You are about to drop the column `logoId` on the `Brand` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[imageId]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Brand_logoId_name_key";

-- DropIndex
DROP INDEX "Model_name_key";

-- AlterTable
ALTER TABLE "Brand" DROP COLUMN "logoId",
ADD COLUMN     "imageId" TEXT;

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TransactionImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TransactionImages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_key_key" ON "Image"("key");

-- CreateIndex
CREATE INDEX "_TransactionImages_B_index" ON "_TransactionImages"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_imageId_key" ON "Brand"("imageId");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TransactionImages" ADD CONSTRAINT "_TransactionImages_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TransactionImages" ADD CONSTRAINT "_TransactionImages_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
