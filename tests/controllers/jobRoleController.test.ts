import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleController } from "../../src/controllers/jobRoleController.js";
import {
	type JobRoleResponseDto,
	JobRoleStatusDto,
} from "../../src/dtos/jobRoleDto.js";
import type { JobRoleService } from "../../src/services/jobRoleService.js";

const mockService = {
	findAllJobRoles: vi.fn(),
	findJobRoleById: vi.fn(),
	applyForJobRole: vi.fn(),
};

describe("JobRoleController", () => {
	let controller: JobRoleController;
	let jobRoleService: Pick<
		JobRoleService,
		"findAllJobRoles" | "findJobRoleById" | "applyForJobRole"
	>;
	let req: Request;
	let res: Response;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleService = {
			findAllJobRoles: mockService.findAllJobRoles,
			findJobRoleById: mockService.findJobRoleById,
			applyForJobRole: mockService.applyForJobRole,
		};

		controller = new JobRoleController(jobRoleService as JobRoleService);

		req = {} as Request;
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as unknown as Response;
	});

	it("should return 200 with mapped job roles", async () => {
		const jobRoles: JobRoleResponseDto[] = [
			{
				id: 1,
				roleName: "Backend Engineer",
				location: "Dublin",
				capability: {
					capabilityId: 1,
					capabilityName: "Engineering",
				},
				band: {
					bandId: 1,
					bandName: "Associate",
				},
				closingDate: "2026-08-31",
				status: JobRoleStatusDto.Open,
			},
		];

		vi.mocked(jobRoleService.findAllJobRoles).mockResolvedValueOnce(jobRoles);

		await controller.getAllJobRoles(req, res);

		expect(jobRoleService.findAllJobRoles).toHaveBeenCalledTimes(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(jobRoles);
	});

	it("should return 500 when service throws", async () => {
		vi.mocked(jobRoleService.findAllJobRoles).mockRejectedValueOnce(
			new Error("db down"),
		);

		await controller.getAllJobRoles(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});

	it("should return 200 with a detailed job role", async () => {
		const jobRole = {
			id: 1,
			roleName: "Backend Engineer",
			location: "Dublin",
			capability: {
				capabilityId: 1,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 1,
				bandName: "Associate",
			},
			closingDate: "2026-08-31",
			status: JobRoleStatusDto.Open,
			description: "Backend role description",
			responsibilities: "Build APIs",
			sharepointUrl: "https://example.com/backend",
			numberOfOpenPositions: 3,
		};

		req = {
			params: { id: "1" },
		} as unknown as Request;

		vi.mocked(jobRoleService.findJobRoleById).mockResolvedValueOnce(jobRole);

		await controller.getJobRoleById(req, res);

		expect(jobRoleService.findJobRoleById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(jobRole);
	});

	it("should return 404 when job role is not found", async () => {
		req = {
			params: { id: "999" },
		} as unknown as Request;

		vi.mocked(jobRoleService.findJobRoleById).mockResolvedValueOnce(null);

		await controller.getJobRoleById(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: "Job role not found" });
	});

	it("should return 500 when findJobRoleById throws", async () => {
		req = {
			params: { id: "1" },
		} as unknown as Request;

		vi.mocked(jobRoleService.findJobRoleById).mockRejectedValueOnce(
			new Error("db down"),
		);

		await controller.getJobRoleById(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});

	it("should return 200 with presigned upload data for applyForJobRole", async () => {
		req = {
			params: { id: "2" },
			body: {
				userId: 7,
				fileName: "cv.pdf",
				contentType: "application/pdf",
			},
		} as unknown as Request;

		const presignedUrlData = {
			uploadUrl: "https://example.com/upload",
			key: "job-applications/2/7/123-cv.pdf",
		};

		vi.mocked(jobRoleService.applyForJobRole).mockResolvedValueOnce(
			presignedUrlData,
		);

		await controller.applyForJobRole(req, res);

		expect(jobRoleService.applyForJobRole).toHaveBeenCalledWith(
			7,
			2,
			"cv.pdf",
			"application/pdf",
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(presignedUrlData);
	});

	it("should return 400 when applyForJobRole is missing required fields", async () => {
		req = {
			params: { id: "2" },
			body: {
				userId: 7,
				fileName: "cv.pdf",
			},
		} as unknown as Request;

		await controller.applyForJobRole(req, res);

		expect(jobRoleService.applyForJobRole).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Missing required fields",
		});
	});

	it("should return 500 when applyForJobRole throws", async () => {
		req = {
			params: { id: "2" },
			body: {
				userId: 7,
				fileName: "cv.pdf",
				contentType: "application/pdf",
			},
		} as unknown as Request;

		vi.mocked(jobRoleService.applyForJobRole).mockRejectedValueOnce(
			new Error("db down"),
		);

		await controller.applyForJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});
});
