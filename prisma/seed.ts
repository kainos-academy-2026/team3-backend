import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
    await prisma.jobRole.createMany({
        data: [
            {
                id: 1,
                roleName: "Backend Engineer",
                location: "Dublin",
                capability: "Engineering",
                band: 3,
                closingDate: new Date("2026-08-31"),
            },
            {
                id: 2,
                roleName: "Frontend Engineer",
                location: "Belfast",
                capability: "Engineering",
                band: 3,
                closingDate: new Date("2026-08-31"),
            },
            {
                id: 3,
                roleName: "Principle Architect",
                location: "London",
                capability: "Engineering",
                band: 4,
                closingDate: new Date("2026-08-31"),
            },
            {
                id: 4,
                roleName: "Operations Manager",
                location: "Seattle",
                capability: "Operations",
                band: 5,
                closingDate: new Date("2026-08-31"),
            },
        ],
        skipDuplicates: true,
    });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
