import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { JobRoleStatusDto } from "../src/dtos/jobRoleDto.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
	const engineering = await prisma.capability.upsert({
		where: { capabilityId: 1 },
		update: {},
		create: { capabilityName: "Engineering" },
	});

	const operations = await prisma.capability.upsert({
		where: { capabilityId: 2 },
		update: {},
		create: { capabilityName: "Operations" },
	});

	const bandAssociate = await prisma.band.upsert({
		where: { bandId: 1 },
		update: {},
		create: { bandName: "Associate" },
	});

	const bandSenior = await prisma.band.upsert({
		where: { bandId: 2 },
		update: {},
		create: { bandName: "Senior" },
	});

	const bandPrincipal = await prisma.band.upsert({
		where: { bandId: 3 },
		update: {},
		create: { bandName: "Principal" },
	});

	await prisma.jobRole.createMany({
		data: [
			{
				roleName: "Backend Engineer",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
			},
			{
				roleName: "Frontend Engineer",
				location: "Belfast",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
			},
			{
				roleName: "Principal Architect",
				location: "London",
				capabilityId: engineering.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
			},
			{
				roleName: "Operations Manager",
				location: "Seattle",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
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
