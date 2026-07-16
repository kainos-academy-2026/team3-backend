import type { Application } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidJobRoleReferenceError } from "../../src/errors/InvalidJobRoleReferenceError.js";
import { JobRoleNotFoundError } from "../../src/errors/JobRoleNotFoundError.js";

const mocks = vi.hoisted(() => ({
	mockFindAllJobRoles: vi.fn(),
	mockGetJobRoleMetadata: vi.fn(),
	mockGenerateJobRolesCsvReport: vi.fn(),
	mockFindJobRoleById: vi.fn(),
	mockCreateJobRole: vi.fn(),
	mockApplyForJobRole: vi.fn(),
	mockUpdateJobRole: vi.fn(),
	mockGetJobRoleApplicationsForAdmin: vi.fn(),
	mockHireApplicant: vi.fn(),
	mockRejectApplicant: vi.fn(),
	mockVerifyToken: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		jobRole: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("../../src/daos/jobRoleDao.js", () => ({
	JobRoleDao: class JobRoleDao {},
}));

vi.mock("../../src/mappers/jobRoleMapper.js", () => ({
	JobRoleMapper: class JobRoleMapper {},
}));

vi.mock("../../src/services/jobRoleService.js", () => ({
	JobRoleService: class JobRoleService {
		findAllJobRoles = mocks.mockFindAllJobRoles;
		getJobRoleMetadata = mocks.mockGetJobRoleMetadata;
		generateJobRolesCsvReport = mocks.mockGenerateJobRolesCsvReport;
		findJobRoleById = mocks.mockFindJobRoleById;
		createJobRole = mocks.mockCreateJobRole;
		applyForJobRole = mocks.mockApplyForJobRole;
		updateJobRole = mocks.mockUpdateJobRole;
		getJobRoleApplicationsForAdmin = mocks.mockGetJobRoleApplicationsForAdmin;
		hireApplicant = mocks.mockHireApplicant;
		rejectApplicant = mocks.mockRejectApplicant;
	},
}));

vi.mock("../../src/services/jwtTokenService.js", () => ({
	JwtTokenService: class JwtTokenService {
		verify = mocks.mockVerifyToken;
	},
}));

let app: Application;

beforeAll(async () => {
	process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
	process.env.JWT_SECRET = "test-secret";
	process.env.AWS_REGION = "eu-west-1";
	process.env.S3_BUCKET_NAME = "test-bucket";
	app = (await import("../../src/app.js")).default;
});

describe("GET /api/job-roles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 200 with a list of job roles", async () => {
		mocks.mockFindAllJobRoles.mockResolvedValueOnce([
			{
				id: 1,
				roleName: "Backend Engineer",
				location: "Dublin",
				capability: {
					capabilityId: 10,
					capabilityName: "Engineering",
				},
				band: {
					bandId: 3,
					bandName: "Band 3",
				},
				closingDate: "2026-08-31",
				status: "Open",
			},
		]);

		const response = await request(app).get("/api/job-roles");

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(1);
		expect(response.body[0]).toMatchObject({
			id: 1,
			roleName: "Backend Engineer",
			location: "Dublin",
			capability: {
				capabilityId: 10,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 3,
				bandName: "Band 3",
			},
			closingDate: "2026-08-31",
			status: "Open",
		});
	});

	it("should return 500 when the service throws", async () => {
		mocks.mockFindAllJobRoles.mockRejectedValueOnce(new Error("db down"));

		const response = await request(app).get("/api/job-roles");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Internal server error" });
	});
});

describe("GET /api/job-roles/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app).get("/api/job-roles/1");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
	});

	it("should return 200 with a detailed job role", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});
		mocks.mockFindJobRoleById.mockResolvedValueOnce({
			id: 1,
			roleName: "Backend Engineer",
			location: "Dublin",
			capability: {
				capabilityId: 10,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 3,
				bandName: "Band 3",
			},
			closingDate: "2026-08-31",
			status: "Open",
			description: "Backend role description",
			responsibilities: "Design and implement backend services",
			sharepointUrl: "https://example.com/backend-engineer",
			numberOfOpenPositions: 3,
		});

		const response = await request(app)
			.get("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			id: 1,
			roleName: "Backend Engineer",
			description: "Backend role description",
			responsibilities: "Design and implement backend services",
			sharepointUrl: "https://example.com/backend-engineer",
			numberOfOpenPositions: 3,
		});
	});

	it("should return 404 when the job role does not exist", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});
		mocks.mockFindJobRoleById.mockResolvedValueOnce(null);

		const response = await request(app)
			.get("/api/job-roles/999")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Job role not found" });
	});

	it("should return 400 when the job role id is invalid", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});

		const response = await request(app)
			.get("/api/job-roles/not-a-number")
			.set("Authorization", "Bearer valid-token");

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

	it("should return 500 when the service throws", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});
		mocks.mockFindJobRoleById.mockRejectedValueOnce(new Error("db down"));

		const response = await request(app)
			.get("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Internal server error" });
	});
});

describe("GET /api/job-roles/report", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app).get("/api/job-roles/report");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
	});

	it("should return 403 when authenticated user is not admin", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});

		const response = await request(app)
			.get("/api/job-roles/report")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
	});

	it("should return 200 with csv report when user is admin", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockGenerateJobRolesCsvReport.mockResolvedValueOnce(
			"id,roleName\n1,Backend Engineer",
		);

		const response = await request(app)
			.get("/api/job-roles/report")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(200);
		expect(response.text).toContain("id,roleName");
		expect(response.headers["content-type"]).toContain("text/csv");
		expect(response.headers["content-disposition"]).toContain(
			'attachment; filename="job-roles-report-',
		);
	});

	it("should return 500 when service throws", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockGenerateJobRolesCsvReport.mockRejectedValueOnce(
			new Error("db down"),
		);

		const response = await request(app)
			.get("/api/job-roles/report")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Internal server error" });
	});
});

describe("POST /api/job-roles/:id/apply", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app)
			.post("/api/job-roles/2/apply")
			.send({ fileName: "cv.pdf", contentType: "application/pdf" });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
		expect(mocks.mockApplyForJobRole).not.toHaveBeenCalled();
	});

	it("should return 401 when token is invalid", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce(null);

		const response = await request(app)
			.post("/api/job-roles/2/apply")
			.set("Authorization", "Bearer invalid-token")
			.send({ fileName: "cv.pdf", contentType: "application/pdf" });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Invalid or expired token" });
		expect(mocks.mockApplyForJobRole).not.toHaveBeenCalled();
	});

	it("should return 200 and apply with authenticated user id", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});
		mocks.mockApplyForJobRole.mockResolvedValueOnce({
			uploadUrl: "https://example.com/upload",
			key: "job-applications/2/7/123-cv.pdf",
		});

		const response = await request(app)
			.post("/api/job-roles/2/apply")
			.set("Authorization", "Bearer valid-token")
			.send({ fileName: "cv.pdf", contentType: "application/pdf" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			uploadUrl: "https://example.com/upload",
			key: "job-applications/2/7/123-cv.pdf",
		});
		expect(mocks.mockApplyForJobRole).toHaveBeenCalledWith(
			7,
			2,
			"cv.pdf",
			"application/pdf",
		);
	});
});

describe("GET /api/job-roles/:id/applications", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app).get("/api/job-roles/1/applications");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
		expect(mocks.mockGetJobRoleApplicationsForAdmin).not.toHaveBeenCalled();
	});

	it("should return 403 for authenticated non-admin user", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});

		const response = await request(app)
			.get("/api/job-roles/1/applications")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(mocks.mockGetJobRoleApplicationsForAdmin).not.toHaveBeenCalled();
	});

	it("should return 200 for admin application list", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockGetJobRoleApplicationsForAdmin.mockResolvedValueOnce({
			jobRoleId: 1,
			roleName: "Backend Engineer",
			numberOfOpenPositions: 2,
			applicants: [],
		});

		const response = await request(app)
			.get("/api/job-roles/1/applications")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			jobRoleId: 1,
			roleName: "Backend Engineer",
			numberOfOpenPositions: 2,
			applicants: [],
		});
		expect(mocks.mockGetJobRoleApplicationsForAdmin).toHaveBeenCalledWith(1);
	});
});

describe("PATCH /api/job-roles/:id/applications/:applicationId/hire", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app).patch(
			"/api/job-roles/1/applications/101/hire",
		);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
		expect(mocks.mockHireApplicant).not.toHaveBeenCalled();
	});

	it("should return 403 for authenticated non-admin user", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});

		const response = await request(app)
			.patch("/api/job-roles/1/applications/101/hire")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(mocks.mockHireApplicant).not.toHaveBeenCalled();
	});

	it("should return 200 for admin hire action", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockHireApplicant.mockResolvedValueOnce({
			application: {
				applicationId: 101,
				userId: 7,
				username: "candidate@example.com",
				status: "Hired",
				appliedAt: "2026-07-01T12:00:00.000Z",
				cvDownloadUrl: "https://example.com/download",
			},
			numberOfOpenPositions: 1,
		});

		const response = await request(app)
			.patch("/api/job-roles/1/applications/101/hire")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			application: {
				applicationId: 101,
				status: "Hired",
			},
			numberOfOpenPositions: 1,
		});
		expect(mocks.mockHireApplicant).toHaveBeenCalledWith(1, 101);
	});
});

describe("PATCH /api/job-roles/:id/applications/:applicationId/reject", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 403 for authenticated non-admin user", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});

		const response = await request(app)
			.patch("/api/job-roles/1/applications/101/reject")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(mocks.mockRejectApplicant).not.toHaveBeenCalled();
	});

	it("should return 400 for invalid params", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});

		const response = await request(app)
			.patch("/api/job-roles/not-a-number/applications/101/reject")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(400);
		expect(response.body.errors[0]).toMatchObject({ field: "id" });
		expect(mocks.mockRejectApplicant).not.toHaveBeenCalled();
	});

	it("should return 200 for admin reject action", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockRejectApplicant.mockResolvedValueOnce({
			application: {
				applicationId: 101,
				userId: 7,
				username: "candidate@example.com",
				status: "Rejected",
				appliedAt: "2026-07-01T12:00:00.000Z",
				cvDownloadUrl: "https://example.com/download",
			},
		});

		const response = await request(app)
			.patch("/api/job-roles/1/applications/101/reject")
			.set("Authorization", "Bearer valid-token");

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			application: {
				applicationId: 101,
				status: "Rejected",
			},
		});
		expect(mocks.mockRejectApplicant).toHaveBeenCalledWith(1, 101);
	});
});

describe("POST /api/job-roles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const validPayload = {
		roleName: "Senior Backend Engineer",
		location: "Dublin",
		capabilityId: 1,
		bandId: 2,
		closingDate: "2026-08-31",
		description: "Own backend services and integrations.",
		responsibilities: "Build APIs, review code, support delivery.",
		sharepointUrl: "https://example.sharepoint.com/job-role",
		numberOfOpenPositions: 2,
	};

	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app)
			.post("/api/job-roles")
			.send(validPayload);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
		expect(mocks.mockCreateJobRole).not.toHaveBeenCalled();
	});

	it("should return 403 for authenticated non-admin user", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});

		const response = await request(app)
			.post("/api/job-roles")
			.set("Authorization", "Bearer valid-token")
			.send(validPayload);

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(mocks.mockCreateJobRole).not.toHaveBeenCalled();
	});

	it("should return 400 when body validation fails", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});

		const response = await request(app)
			.post("/api/job-roles")
			.set("Authorization", "Bearer valid-token")
			.send({ ...validPayload, roleName: "" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			errors: [{ field: "roleName", message: "Role name is required" }],
		});
		expect(mocks.mockCreateJobRole).not.toHaveBeenCalled();
	});

	it("should return 201 for authenticated admin with valid payload", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockCreateJobRole.mockResolvedValueOnce({
			id: 10,
			...validPayload,
			capability: {
				capabilityId: 1,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 2,
				bandName: "Band 2",
			},
			status: "Open",
		});

		const response = await request(app)
			.post("/api/job-roles")
			.set("Authorization", "Bearer valid-token")
			.send(validPayload);

		expect(response.status).toBe(201);
		expect(response.body).toMatchObject({
			id: 10,
			roleName: "Senior Backend Engineer",
			status: "Open",
		});
		expect(mocks.mockCreateJobRole).toHaveBeenCalledWith(validPayload);
	});
});

describe("PATCH /api/job-roles/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when authorization header is missing", async () => {
		const response = await request(app)
			.patch("/api/job-roles/1")
			.send({ roleName: "Updated Role" });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Missing or invalid authorization header",
		});
		expect(mocks.mockUpdateJobRole).not.toHaveBeenCalled();
	});

	it("should return 403 for authenticated non-admin user", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 7,
			email: "user@example.com",
			role: "USER",
		});

		const response = await request(app)
			.patch("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token")
			.send({ roleName: "Updated Role" });

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(mocks.mockUpdateJobRole).not.toHaveBeenCalled();
	});

	it("should return 400 for invalid route id", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});

		const response = await request(app)
			.patch("/api/job-roles/not-a-number")
			.set("Authorization", "Bearer valid-token")
			.send({ roleName: "Updated Role" });

		expect(response.status).toBe(400);
		expect(response.body.errors).toHaveLength(1);
		expect(response.body.errors[0]).toMatchObject({ field: "id" });
		expect(mocks.mockUpdateJobRole).not.toHaveBeenCalled();
	});

	it("should return 400 for an empty body", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});

		const response = await request(app)
			.patch("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token")
			.send({});

		expect(response.status).toBe(400);
		expect(response.body.errors[0]).toMatchObject({
			message: "At least one editable field must be provided",
		});
		expect(mocks.mockUpdateJobRole).not.toHaveBeenCalled();
	});

	it("should return 400 for invalid body fields", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});

		const response = await request(app)
			.patch("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token")
			.send({ status: "Paused", sharepointUrl: "not-a-url" });

		expect(response.status).toBe(400);
		expect(response.body.errors.length).toBeGreaterThan(0);
		expect(mocks.mockUpdateJobRole).not.toHaveBeenCalled();
	});

	it("should return 404 when the target job role does not exist", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockUpdateJobRole.mockRejectedValueOnce(new JobRoleNotFoundError(1));

		const response = await request(app)
			.patch("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token")
			.send({ roleName: "Updated Role" });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: "Job role with id 1 was not found",
		});
	});

	it("should return 404 when capability or band references are invalid", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockUpdateJobRole.mockRejectedValueOnce(
			new InvalidJobRoleReferenceError("Capability with id 999 was not found"),
		);

		const response = await request(app)
			.patch("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token")
			.send({ capabilityId: 999 });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: "Capability with id 999 was not found",
		});
	});

	it("should return 200 for admin happy path", async () => {
		mocks.mockVerifyToken.mockResolvedValueOnce({
			userId: 1,
			email: "admin@example.com",
			role: "ADMIN",
		});
		mocks.mockUpdateJobRole.mockResolvedValueOnce({
			id: 1,
			roleName: "Updated Senior Backend Engineer",
			location: "Dublin",
			capability: {
				capabilityId: 10,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 3,
				bandName: "Band 3",
			},
			closingDate: "2026-08-31",
			status: "Closed",
			description: "Backend role description",
			responsibilities: "Build APIs",
			sharepointUrl: "https://example.com/backend",
			numberOfOpenPositions: 1,
		});

		const response = await request(app)
			.patch("/api/job-roles/1")
			.set("Authorization", "Bearer valid-token")
			.send({ roleName: "Updated Senior Backend Engineer", status: "Closed" });

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			id: 1,
			roleName: "Updated Senior Backend Engineer",
			status: "Closed",
		});
		expect(mocks.mockUpdateJobRole).toHaveBeenCalledWith(1, {
			roleName: "Updated Senior Backend Engineer",
			status: "Closed",
		});
	});
});
