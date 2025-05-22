-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "technicianId" TEXT;

-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "fName" TEXT NOT NULL,
    "lName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Technician_workId_key" ON "Technician"("workId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;
