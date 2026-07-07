-- CreateEnum
CREATE TYPE "JobRoleStatus" AS ENUM ('Open', 'Closed');

-- AlterTable
ALTER TABLE "JobRole" ADD COLUMN     "status" "JobRoleStatus" NOT NULL DEFAULT 'Open';
