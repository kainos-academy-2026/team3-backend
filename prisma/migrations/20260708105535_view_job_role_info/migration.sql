/*
  Warnings:

  - Added the required column `description` to the `JobRole` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberOfOpenPositions` to the `JobRole` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsibilities` to the `JobRole` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sharepointUrl` to the `JobRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobRole" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "numberOfOpenPositions" INTEGER NOT NULL,
ADD COLUMN     "responsibilities" TEXT NOT NULL,
ADD COLUMN     "sharepointUrl" TEXT NOT NULL;
