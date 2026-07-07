-- CreateTable
CREATE TABLE "Capability" (
    "capabilityId" SERIAL NOT NULL,
    "capabilityName" TEXT NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("capabilityId")
);

-- CreateTable
CREATE TABLE "Band" (
    "nameId" SERIAL NOT NULL,
    "bandName" TEXT NOT NULL,

    CONSTRAINT "Band_pkey" PRIMARY KEY ("nameId")
);
