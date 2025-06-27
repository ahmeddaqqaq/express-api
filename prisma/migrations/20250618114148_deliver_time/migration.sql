-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "color" TEXT,
ALTER COLUMN "year" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "deliverTime" TIMESTAMP(3);
