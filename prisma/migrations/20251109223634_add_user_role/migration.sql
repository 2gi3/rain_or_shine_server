-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CUSTOMER', 'EMPLOYEE', 'MANAGER', 'OWNER');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'CUSTOMER';
