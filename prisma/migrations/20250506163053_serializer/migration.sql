/*
  Warnings:

  - A unique constraint covering the columns `[logoId,name]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Brand_logoId_name_key" ON "Brand"("logoId", "name");
