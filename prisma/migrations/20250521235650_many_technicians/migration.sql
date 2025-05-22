/*
  Warnings:

  - You are about to drop the column `technicianId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_technicianId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "technicianId";

-- CreateTable
CREATE TABLE "_TechnicianToTransaction" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TechnicianToTransaction_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TechnicianToTransaction_B_index" ON "_TechnicianToTransaction"("B");

-- AddForeignKey
ALTER TABLE "_TechnicianToTransaction" ADD CONSTRAINT "_TechnicianToTransaction_A_fkey" FOREIGN KEY ("A") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TechnicianToTransaction" ADD CONSTRAINT "_TechnicianToTransaction_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
