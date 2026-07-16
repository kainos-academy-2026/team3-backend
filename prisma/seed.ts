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

	const testUser = await prisma.user.upsert({
		where: { email: "test@example.com" },
		update: {
			passwordHash: await argon2.hash("TestPassword123"),
			// no role here if you want to preserve manual role changes
		},
		create: {
			email: "test@example.com",
			passwordHash: await argon2.hash("TestPassword123"),
			role: "USER",
		},
	});

	await prisma.user.upsert({
		where: { email: "admin@example.com" },
		update: {
			passwordHash: await argon2.hash("AdminPassword123"),
			role: "ADMIN",
		},
		create: {
			email: "admin@example.com",
			passwordHash: await argon2.hash("AdminPassword123"),
			role: "ADMIN",
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
			{
				roleName: "Platform Engineer",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-02"),
				status: JobRoleStatusDto.Open,
				description: "Builds shared platform services for product teams.",
				responsibilities:
					"Maintain CI pipelines, container platforms, and observability tools.",
				sharepointUrl: "https://example.com/platform-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Cloud Engineer",
				location: "London",
				capabilityId: engineering.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-03"),
				status: JobRoleStatusDto.Open,
				description: "Designs and supports cloud-native infrastructure.",
				responsibilities:
					"Provision cloud resources, enforce security baselines, and tune costs.",
				sharepointUrl: "https://example.com/cloud-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Data Engineer",
				location: "Belfast",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-04"),
				status: JobRoleStatusDto.Open,
				description: "Creates pipelines for reliable analytics datasets.",
				responsibilities:
					"Build ETL jobs, maintain data quality checks, and optimize warehouse models.",
				sharepointUrl: "https://example.com/data-engineer",
				numberOfOpenPositions: 3,
			},
			{
				roleName: "DevOps Engineer",
				location: "Seattle",
				capabilityId: operations.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-05"),
				status: JobRoleStatusDto.Open,
				description: "Automates build and release processes for teams.",
				responsibilities:
					"Improve deployment automation, monitor releases, and reduce change failure rate.",
				sharepointUrl: "https://example.com/devops-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "QA Engineer",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-06"),
				status: JobRoleStatusDto.Open,
				description: "Ensures product quality through automated and manual testing.",
				responsibilities:
					"Create test plans, automate critical paths, and report release quality.",
				sharepointUrl: "https://example.com/qa-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Site Reliability Engineer",
				location: "London",
				capabilityId: operations.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-09-07"),
				status: JobRoleStatusDto.Open,
				description: "Drives reliability goals across critical services.",
				responsibilities:
					"Define SLOs, improve incident response, and reduce toil with automation.",
				sharepointUrl: "https://example.com/site-reliability-engineer",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Security Engineer",
				location: "Belfast",
				capabilityId: engineering.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-08"),
				status: JobRoleStatusDto.Open,
				description: "Improves application and infrastructure security posture.",
				responsibilities:
					"Run threat modeling, implement controls, and support vulnerability remediation.",
				sharepointUrl: "https://example.com/security-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Mobile Engineer",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-09"),
				status: JobRoleStatusDto.Open,
				description: "Builds performant mobile features for iOS and Android.",
				responsibilities:
					"Implement app features, improve performance, and integrate backend APIs.",
				sharepointUrl: "https://example.com/mobile-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Staff Backend Engineer",
				location: "London",
				capabilityId: engineering.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-09-10"),
				status: JobRoleStatusDto.Open,
				description: "Leads backend architecture and high-impact initiatives.",
				responsibilities:
					"Drive technical direction, mentor engineers, and deliver scalable APIs.",
				sharepointUrl: "https://example.com/staff-backend-engineer",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Integration Engineer",
				location: "Seattle",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-11"),
				status: JobRoleStatusDto.Open,
				description: "Builds integrations between internal and external systems.",
				responsibilities:
					"Develop connectors, manage data contracts, and monitor integration health.",
				sharepointUrl: "https://example.com/integration-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Business Analyst",
				location: "Dublin",
				capabilityId: operations.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-12"),
				status: JobRoleStatusDto.Open,
				description: "Translates business goals into delivery-ready requirements.",
				responsibilities:
					"Gather requirements, map workflows, and support sprint planning.",
				sharepointUrl: "https://example.com/business-analyst",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Product Manager",
				location: "London",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-13"),
				status: JobRoleStatusDto.Open,
				description: "Owns roadmap outcomes and prioritization.",
				responsibilities:
					"Define product goals, prioritize backlog, and coordinate cross-functional delivery.",
				sharepointUrl: "https://example.com/product-manager",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Scrum Master",
				location: "Belfast",
				capabilityId: operations.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-14"),
				status: JobRoleStatusDto.Open,
				description: "Facilitates agile ceremonies and team effectiveness.",
				responsibilities:
					"Remove blockers, coach agile practices, and improve delivery flow.",
				sharepointUrl: "https://example.com/scrum-master",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "UX Designer",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-15"),
				status: JobRoleStatusDto.Open,
				description: "Designs intuitive user journeys and interface patterns.",
				responsibilities:
					"Create wireframes, run usability tests, and collaborate with engineers.",
				sharepointUrl: "https://example.com/ux-designer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Technical Writer",
				location: "Seattle",
				capabilityId: operations.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-16"),
				status: JobRoleStatusDto.Open,
				description: "Produces clear technical documentation for products.",
				responsibilities:
					"Write guides, maintain API docs, and improve developer onboarding.",
				sharepointUrl: "https://example.com/technical-writer",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Release Manager",
				location: "London",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-17"),
				status: JobRoleStatusDto.Open,
				description: "Coordinates safe and predictable production releases.",
				responsibilities:
					"Plan release windows, manage risks, and communicate deployment status.",
				sharepointUrl: "https://example.com/release-manager",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Support Engineer",
				location: "Belfast",
				capabilityId: operations.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-18"),
				status: JobRoleStatusDto.Open,
				description: "Resolves customer issues and escalates product defects.",
				responsibilities:
					"Handle tickets, diagnose incidents, and document recurring problems.",
				sharepointUrl: "https://example.com/support-engineer",
				numberOfOpenPositions: 3,
			},
			{
				roleName: "Network Engineer",
				location: "Seattle",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-19"),
				status: JobRoleStatusDto.Open,
				description: "Maintains secure and resilient network connectivity.",
				responsibilities:
					"Manage network changes, monitor performance, and troubleshoot outages.",
				sharepointUrl: "https://example.com/network-engineer",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Systems Engineer",
				location: "Dublin",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-20"),
				status: JobRoleStatusDto.Open,
				description: "Operates and improves enterprise systems and tooling.",
				responsibilities:
					"Maintain core systems, automate maintenance, and support capacity planning.",
				sharepointUrl: "https://example.com/systems-engineer",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Machine Learning Engineer",
				location: "London",
				capabilityId: engineering.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-09-21"),
				status: JobRoleStatusDto.Open,
				description: "Productionizes machine learning models and pipelines.",
				responsibilities:
					"Build model services, automate retraining, and monitor model quality.",
				sharepointUrl: "https://example.com/machine-learning-engineer",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Data Analyst",
				location: "Belfast",
				capabilityId: operations.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-09-22"),
				status: JobRoleStatusDto.Open,
				description: "Provides actionable insights from product and operational data.",
				responsibilities:
					"Create dashboards, analyze trends, and support decision making.",
				sharepointUrl: "https://example.com/data-analyst",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Engineering Manager",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-09-23"),
				status: JobRoleStatusDto.Open,
				description: "Leads engineering teams and delivery outcomes.",
				responsibilities:
					"Coach engineers, align roadmap execution, and manage team health.",
				sharepointUrl: "https://example.com/engineering-manager",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Program Manager",
				location: "Seattle",
				capabilityId: operations.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-09-24"),
				status: JobRoleStatusDto.Open,
				description: "Coordinates complex cross-team programs.",
				responsibilities:
					"Track milestones, manage dependencies, and report program status.",
				sharepointUrl: "https://example.com/program-manager",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Compliance Specialist",
				location: "London",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-25"),
				status: JobRoleStatusDto.Open,
				description: "Supports regulatory and policy compliance activities.",
				responsibilities:
					"Maintain controls evidence, coordinate audits, and update compliance docs.",
				sharepointUrl: "https://example.com/compliance-specialist",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Infrastructure Architect",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-09-26"),
				status: JobRoleStatusDto.Open,
				description: "Defines long-term infrastructure architecture strategy.",
				responsibilities:
					"Design target state architecture and guide major platform decisions.",
				sharepointUrl: "https://example.com/infrastructure-architect",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Database Administrator",
				location: "Belfast",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-27"),
				status: JobRoleStatusDto.Open,
				description: "Ensures database reliability, performance, and backup readiness.",
				responsibilities:
					"Tune queries, manage backups, and support schema changes.",
				sharepointUrl: "https://example.com/database-administrator",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Solutions Architect",
				location: "Seattle",
				capabilityId: engineering.capabilityId,
				bandId: bandPrincipal.bandId,
				closingDate: new Date("2026-09-28"),
				status: JobRoleStatusDto.Open,
				description: "Designs end-to-end solutions for strategic initiatives.",
				responsibilities:
					"Create solution designs, evaluate tradeoffs, and support implementation.",
				sharepointUrl: "https://example.com/solutions-architect",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Technical Project Manager",
				location: "London",
				capabilityId: operations.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-29"),
				status: JobRoleStatusDto.Open,
				description: "Delivers technical projects across multiple teams.",
				responsibilities:
					"Plan timelines, mitigate risks, and align technical dependencies.",
				sharepointUrl: "https://example.com/technical-project-manager",
				numberOfOpenPositions: 1,
			},
			{
				roleName: "Observability Engineer",
				location: "Dublin",
				capabilityId: engineering.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-09-30"),
				status: JobRoleStatusDto.Open,
				description: "Builds logging, metrics, and tracing capabilities.",
				responsibilities:
					"Instrument services, improve alert quality, and maintain dashboards.",
				sharepointUrl: "https://example.com/observability-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "API Engineer",
				location: "Belfast",
				capabilityId: engineering.capabilityId,
				bandId: bandAssociate.bandId,
				closingDate: new Date("2026-10-01"),
				status: JobRoleStatusDto.Open,
				description: "Builds and maintains external and internal APIs.",
				responsibilities:
					"Design contracts, implement endpoints, and maintain API performance.",
				sharepointUrl: "https://example.com/api-engineer",
				numberOfOpenPositions: 2,
			},
			{
				roleName: "Performance Engineer",
				location: "Seattle",
				capabilityId: engineering.capabilityId,
				bandId: bandSenior.bandId,
				closingDate: new Date("2026-10-02"),
				status: JobRoleStatusDto.Open,
				description: "Optimizes system performance under real-world load.",
				responsibilities:
					"Run load tests, identify bottlenecks, and implement tuning improvements.",
				sharepointUrl: "https://example.com/performance-engineer",
				numberOfOpenPositions: 1,
			},
		],
		skipDuplicates: true,
	});

	await prisma.application.create({
		data: {
			userId: testUser.id,
			jobRoleId: 1,
			status: "In Progress",
			cvUrl: "https://example.com/cv/test-user-cv.pdf",
			appliedAt: new Date("2026-08-21"),
		},
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
