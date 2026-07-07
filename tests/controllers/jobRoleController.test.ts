import type { JobRole } from "@prisma/client";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockService = {
	findAllJobRoles: vi.fn(),
};

const mockMapper = {
	toResponseList: vi.fn(),
};

vi.mock("../../src/services/jobRoleService.js", () => ({
	JobRoleService: vi.fn(function JobRoleServiceMock() {
		return mockService;
	}),
}));

vi.mock("../../src/mappers/jobRoleMapper.js", () => ({
	JobRoleMapper: vi.fn(function JobRoleMapperMock() {
		return mockMapper;
	}),
}));

import { JobRoleController } from "../../src/controllers/jobRoleController.js";
import type { JobRoleMapper } from "../../src/mappers/jobRoleMapper.js";
import type { JobRoleService } from "../../src/services/jobRoleService.js";

describe("JobRoleController", () => {
	let controller: JobRoleController;
	let jobRoleService: Pick<JobRoleService, "findAllJobRoles">;
	let jobRoleMapper: Pick<JobRoleMapper, "toResponseList">;
	let req: Request;
	let res: Response;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleService = {
			findAllJobRoles: mockService.findAllJobRoles,
		};

		jobRoleMapper = {
			toResponseList: mockMapper.toResponseList,
		};

		controller = new JobRoleController(
			jobRoleService as JobRoleService,
			jobRoleMapper as JobRoleMapper
		);

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
				status: "Open" as const,
			},
		];

		vi.mocked(jobRoleService.findAllJobRoles).mockResolvedValueOnce(jobRoles);
		vi.mocked(jobRoleMapper.toResponseList).mockReturnValueOnce(mappedResponse);

		await controller.getAllJobRoles(req, res);

		expect(jobRoleService.findAllJobRoles).toHaveBeenCalledTimes(1);
		expect(jobRoleMapper.toResponseList).toHaveBeenCalledWith(jobRoles);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mappedResponse);
	});

	it("should return 500 when service throws", async () => {
		vi.mocked(jobRoleService.findAllJobRoles).mockRejectedValueOnce(new Error("db down"));

		await controller.getAllJobRoles(req, res);

		expect(jobRoleMapper.toResponseList).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});
});
