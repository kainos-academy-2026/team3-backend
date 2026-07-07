import type { JobRole } from "@prisma/client";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleStatusDto } from "../../src/dtos/jobRoleDto.js";
import { JobRoleController } from "../../src/controllers/jobRoleController.js";
import type { JobRoleService } from "../../src/services/jobRoleService.js";

const mockService = {
	findAllJobRoles: vi.fn(),
};

describe("JobRoleController", () => {
	let controller: JobRoleController;
	let jobRoleService: Pick<JobRoleService, "findAllJobRoles">;
	let req: Request;
	let res: Response;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleService = {
			findAllJobRoles: mockService.findAllJobRoles,
		};

		controller = new JobRoleController(jobRoleService as JobRoleService);

		req = {} as Request;
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as unknown as Response;
	});

	it("should return 200 with mapped job roles", async () => {
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

		const mappedResponse = [
			{
				id: 1,
				roleName: "Backend Engineer",
				location: "Dublin",
				capability: "Engineering",
				band: 3,
				closingDate: new Date("2026-08-31"),
				status: JobRoleStatusDto.Open,
			},
		];

		vi.mocked(jobRoleService.findAllJobRoles).mockResolvedValueOnce(jobRoles);

		await controller.getAllJobRoles(req, res);

		expect(jobRoleService.findAllJobRoles).toHaveBeenCalledTimes(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mappedResponse);
	});

	it("should return 500 when service throws", async () => {
		vi.mocked(jobRoleService.findAllJobRoles).mockRejectedValueOnce(new Error("db down"));

		await controller.getAllJobRoles(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});
});
