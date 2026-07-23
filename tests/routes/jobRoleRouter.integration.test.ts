import { UserRole } from "@prisma/client";
import type { Application } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";

type PrismaClientInstance = typeof import("../../src/prismaClient.js").default;

let app: Application;
let prisma: PrismaClientInstance;

let createdApplicationIds: number[] = [];
let createdJobRoleIds: number[] = [];
let createdUserIds: number[] = [];
let createdCapabilityIds: number[] = [];
let createdBandIds: number[] = [];

function createAuthToken(userId: number, email: string, role: UserRole): string {
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		throw new Error("JWT_SECRET is not set");
	}

	return jwt.sign({ userId, email, role }, secret, { expiresIn: "1h" });
}

function uniqueValue(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function createUser(role: UserRole): Promise<{
	id: number;
	email: string;
	token: string;
}> {
	const email = `${uniqueValue(role.toLowerCase())}@example.com`;
	const user = await prisma.user.create({
		data: {
			email,
			passwordHash: "integration-test-hash",
			role,
		},
	});

	createdUserIds.push(user.id);

	return {
		id: user.id,
		email: user.email,
		token: createAuthToken(user.id, user.email, user.role),
	};
}

async function createJobRoleFixture(): Promise<{ jobRoleId: number }> {
	const capability = await prisma.capability.create({
		data: {
			capabilityName: uniqueValue("integration-capability"),
		},
	});
	createdCapabilityIds.push(capability.capabilityId);

	const band = await prisma.band.create({
		data: {
			bandName: uniqueValue("integration-band"),
		},
	});
	createdBandIds.push(band.bandId);

	const jobRole = await prisma.jobRole.create({
		data: {
			roleName: uniqueValue("integration-job-role"),
			location: "Belfast",
			capabilityId: capability.capabilityId,
			bandId: band.bandId,
			closingDate: new Date("2026-12-31"),
			status: "Open",
			description: "Integration test job role",
			responsibilities: "Verify delete endpoint behavior",
			sharepointUrl: "https://example.com/integration-job-role",
			numberOfOpenPositions: 1,
		},
	});

	createdJobRoleIds.push(jobRole.id);

	return { jobRoleId: jobRole.id };
}

async function createApplicationFixture(jobRoleId: number): Promise<void> {
	const applicant = await createUser(UserRole.USER);
	const application = await prisma.application.create({
		data: {
			userId: applicant.id,
			jobRoleId,
			cvUrl: uniqueValue("integration-cv"),
			status: "InProgress",
		},
	});

	createdApplicationIds.push(application.id);
}

beforeAll(async () => {
	process.env.DATABASE_URL =
		"postgresql://postgres:password@127.0.0.1:5432/team3";
	process.env.JWT_SECRET = "integration-test-secret";
	process.env.AWS_REGION = "eu-west-1";
	process.env.S3_BUCKET_NAME = "integration-test-bucket";

	const [{ default: loadedApp }, { default: loadedPrisma }] = await Promise.all([
		import("../../src/app.js"),
		import("../../src/prismaClient.js"),
	]);

	app = loadedApp;
	prisma = loadedPrisma;
	await prisma.$connect();
});

beforeEach(() => {
	createdApplicationIds = [];
	createdJobRoleIds = [];
	createdUserIds = [];
	createdCapabilityIds = [];
	createdBandIds = [];
});

afterEach(async () => {
	await prisma.application.deleteMany({
		where: {
			OR: [
				{ id: { in: createdApplicationIds } },
				{ jobRoleId: { in: createdJobRoleIds } },
				{ userId: { in: createdUserIds } },
			],
		},
	});
	await prisma.jobRole.deleteMany({
		where: { id: { in: createdJobRoleIds } },
	});
	await prisma.user.deleteMany({
		where: { id: { in: createdUserIds } },
	});
	await prisma.capability.deleteMany({
		where: { capabilityId: { in: createdCapabilityIds } },
	});
	await prisma.band.deleteMany({
		where: { bandId: { in: createdBandIds } },
	});
	createdApplicationIds = [];
	createdJobRoleIds = [];
	createdUserIds = [];
	createdCapabilityIds = [];
	createdBandIds = [];
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe("DELETE /api/job-roles/:id integration", () => {
	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app).delete("/api/job-roles/1");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
	});

	it("should return 403 for an authenticated non-admin user", async () => {
		const user = await createUser(UserRole.USER);

		const response = await request(app)
			.delete("/api/job-roles/1")
			.set("Authorization", `Bearer ${user.token}`);

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
	});

	it("should return 401 when the token is invalid", async () => {
		const response = await request(app)
			.delete("/api/job-roles/1")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Invalid or expired token" });
	});

	it("should return 400 when the route id is invalid", async () => {
		const admin = await createUser(UserRole.ADMIN);

		const response = await request(app)
			.delete("/api/job-roles/not-a-number")
			.set("Authorization", `Bearer ${admin.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			errors: [
				{
					field: "id",
					message: "Invalid input: expected number, received NaN",
				},
			],
		});
	});

	it("should return 404 when the target job role does not exist", async () => {
		const admin = await createUser(UserRole.ADMIN);

		const response = await request(app)
			.delete("/api/job-roles/999999")
			.set("Authorization", `Bearer ${admin.token}`);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: "Job role with id 999999 was not found",
		});
	});

	it("should return 409 when the target job role has existing applications", async () => {
		const admin = await createUser(UserRole.ADMIN);
		const { jobRoleId } = await createJobRoleFixture();
		await createApplicationFixture(jobRoleId);

		const response = await request(app)
			.delete(`/api/job-roles/${jobRoleId}`)
			.set("Authorization", `Bearer ${admin.token}`);

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: `Job role with id ${jobRoleId} cannot be deleted because it has 1 existing application(s)`,
		});

		const persistedJobRole = await prisma.jobRole.findUnique({
			where: { id: jobRoleId },
		});
		expect(persistedJobRole).not.toBeNull();
	});

	it("should return 204 and delete the job role for an admin user", async () => {
		const admin = await createUser(UserRole.ADMIN);
		const { jobRoleId } = await createJobRoleFixture();

		const response = await request(app)
			.delete(`/api/job-roles/${jobRoleId}`)
			.set("Authorization", `Bearer ${admin.token}`);

		expect(response.status).toBe(204);
		expect(response.text).toBe("");

		const deletedJobRole = await prisma.jobRole.findUnique({
			where: { id: jobRoleId },
		});
		expect(deletedJobRole).toBeNull();
	});

	it("should delete only the targeted job role and leave other roles untouched", async () => {
		const admin = await createUser(UserRole.ADMIN);
		const { jobRoleId: jobRoleIdToDelete } = await createJobRoleFixture();
		const { jobRoleId: otherJobRoleId } = await createJobRoleFixture();

		const response = await request(app)
			.delete(`/api/job-roles/${jobRoleIdToDelete}`)
			.set("Authorization", `Bearer ${admin.token}`);

		expect(response.status).toBe(204);

		const [deletedJobRole, otherJobRole] = await Promise.all([
			prisma.jobRole.findUnique({
				where: { id: jobRoleIdToDelete },
			}),
			prisma.jobRole.findUnique({
				where: { id: otherJobRoleId },
			}),
		]);

		expect(deletedJobRole).toBeNull();
		expect(otherJobRole).not.toBeNull();
		expect(otherJobRole?.id).toBe(otherJobRoleId);
	});
});