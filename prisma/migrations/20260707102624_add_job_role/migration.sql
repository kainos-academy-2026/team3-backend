-- CreateTable
CREATE TABLE "JobRole" (
    "id" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "band" INTEGER NOT NULL,
    "closingDate" DATE NOT NULL,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);
