import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	mockFindAllJobRoles: vi.fn(),
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
