import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
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

	await prisma.user.upsert({
		where: { email: "test@example.com" },
		update: {
			passwordHash: await argon2.hash("TestPassword123"),
		},
		create: {
			email: "test@example.com",
			passwordHash: await argon2.hash("TestPassword123"),
		},
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
				description:
					"Responsible for server-side web application logic and integration of the work front-end developers do.",
				responsibilities:
					"Design and implement backend services, APIs, and databases.",
				sharepointUrl: "https://example.com/backend-engineer",
				numberOfOpenPositions: 3,
			},
			{
				roleName: "Frontend Engineer",
				location: "Belfast",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
				description:
					"Responsible for client-side web application logic and integration with backend services.",
				responsibilities:
					"Design and implement frontend components, user interfaces, and user experiences.",
				sharepointUrl: "https://example.com/frontend-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Principal Architect",
				location: "London",
				capabilityId: engineering.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
				description:
					"Responsible for the overall architecture and design of the system.",
				responsibilities:
					"Design and implement system architecture, review code, and mentor team members.",
				sharepointUrl: "https://example.com/principal-architect",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Operations Manager",
				location: "Seattle",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
				description:
					"Responsible for overseeing operations and ensuring efficient processes.",
				responsibilities:
					"Manage operations team, optimize workflows, and implement best practices.",
				sharepointUrl: "https://example.com/operations-manager",
				numberOfOpenPositions: 1,
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
