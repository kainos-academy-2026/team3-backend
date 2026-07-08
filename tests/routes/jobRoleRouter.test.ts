import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    mockFindAllJobRoles: vi.fn(),
    mockFindJobRoleById: vi.fn(),
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
		findJobRoleById = mocks.mockFindJobRoleById;
	},
}));

import app from "../../src/app.js";

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

    it("should return 200 with a detailed job role", async () => {
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

        const response = await request(app).get("/api/job-roles/1");

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
        mocks.mockFindJobRoleById.mockResolvedValueOnce(null);

        const response = await request(app).get("/api/job-roles/999");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Job role not found" });
    });

    it("should return 400 when the job role id is invalid", async () => {
        const response = await request(app).get("/api/job-roles/not-a-number");

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
        mocks.mockFindJobRoleById.mockRejectedValueOnce(new Error("db down"));

        const response = await request(app).get("/api/job-roles/1");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
    });
});
