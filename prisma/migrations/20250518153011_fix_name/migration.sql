/*
  Warnings:

  - The `permissions` column on the `Role` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Permissions" AS ENUM ('showEditCustomers', 'showEditSchedules', 'showEditSettings', 'showDashboard');

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "permissions",
ADD COLUMN     "permissions" "Permissions"[];

-- DropEnum
DROP TYPE "Permission";
