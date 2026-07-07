import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/prismaClient.js";

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		jobRole: {
			findMany: vi.fn(),
		},
	},
}));

describe("GET /api/job-roles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 200 with a list of job roles", async () => {
		vi.mocked(prisma.jobRole.findMany).mockResolvedValueOnce([
			{
				id: 1,
				roleName: "Backend Engineer",
				location: "Dublin",
				capability: "Engineering",
				band: 3,
				closingDate: new Date("2026-08-31"),
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
			capability: "Engineering",
			band: 3,
			status: "Open",
		});
	});

	it("should return 500 when the service throws", async () => {
		vi.mocked(prisma.jobRole.findMany).mockRejectedValueOnce(new Error("db down"));

		const response = await request(app).get("/api/job-roles");

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: "Internal server error" });
	});
});
