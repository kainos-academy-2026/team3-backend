import type { JobRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleService } from "../../src/services/jobRoleService";
import prisma from "../../src/prismaClient.js";

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		jobRole: {
			findMany: vi.fn(),
		},
	},
}));

describe("JobRoleService", () => {
	const service = new JobRoleService();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return all job roles from prisma", async () => {
		const jobRoles: JobRole[] = [
			{
				id: 1,
				roleName: "Backend Engineer",
				location: "Dublin",
				capability: "Engineering",
				band: 3,
				closingDate: new Date("2026-08-31"),
				status: "Open",
			},
		];

		vi.mocked(prisma.jobRole.findMany).mockResolvedValueOnce(jobRoles);

		const result = await service.findAllJobRoles();

		expect(prisma.jobRole.findMany).toHaveBeenCalledTimes(1);
		expect(result).toEqual(jobRoles);
	});

	it("should throw when prisma fails", async () => {
		vi.mocked(prisma.jobRole.findMany).mockRejectedValueOnce(new Error("db down"));

		await expect(service.findAllJobRoles()).rejects.toThrow("db down");
		expect(prisma.jobRole.findMany).toHaveBeenCalledTimes(1);
	});
});
