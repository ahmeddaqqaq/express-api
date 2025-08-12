-- CreateTable
CREATE TABLE "Sales" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionAddonSales" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "salesId" TEXT NOT NULL,
    "addOnNames" TEXT[],
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionAddonSales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sales_mobileNumber_key" ON "Sales"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAddonSales_transactionId_salesId_key" ON "TransactionAddonSales"("transactionId", "salesId");

-- AddForeignKey
ALTER TABLE "TransactionAddonSales" ADD CONSTRAINT "TransactionAddonSales_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionAddonSales" ADD CONSTRAINT "TransactionAddonSales_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
