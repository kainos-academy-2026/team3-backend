import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleController } from "../../src/controllers/jobRoleController.js";
import {
	type JobRoleResponseDto,
	JobRoleStatusDto,
	type UpdateJobRoleRequestDto,
} from "../../src/dtos/jobRoleDto.js";
import type { JobRoleMetadataResponseDto } from "../../src/dtos/jobRoleMetadataDto.js";
import { InvalidJobRoleReferenceError } from "../../src/errors/InvalidJobRoleReferenceError.js";
import { JobRoleNotFoundError } from "../../src/errors/JobRoleNotFoundError.js";
import type { JobRoleService } from "../../src/services/jobRoleService.js";

const mockService = {
	findAllJobRoles: vi.fn(),
	getJobRoleMetadata: vi.fn(),
	generateJobRolesCsvReport: vi.fn(),
	findJobRoleById: vi.fn(),
	createJobRole: vi.fn(),
	applyForJobRole: vi.fn(),
	updateJobRole: vi.fn(),
};

describe("JobRoleController", () => {
	let controller: JobRoleController;
	let jobRoleService: Pick<
		JobRoleService,
		| "findAllJobRoles"
		| "getJobRoleMetadata"
		| "findJobRoleById"
		| "createJobRole"
		| "updateJobRole"
		| "generateJobRolesCsvReport"
		| "applyForJobRole"
	>;
	let req: Request;
	let res: Response;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleService = {
			findAllJobRoles: mockService.findAllJobRoles,
			getJobRoleMetadata: mockService.getJobRoleMetadata,
			generateJobRolesCsvReport: mockService.generateJobRolesCsvReport,
			findJobRoleById: mockService.findJobRoleById,
			createJobRole: mockService.createJobRole,
			applyForJobRole: mockService.applyForJobRole,
			updateJobRole: mockService.updateJobRole,
		};

		controller = new JobRoleController(jobRoleService as JobRoleService);

		req = {} as Request;
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
			setHeader: vi.fn(),
			send: vi.fn(),
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

	it("should return 200 with metadata", async () => {
		const metadata: JobRoleMetadataResponseDto = {
			capabilities: [{ capabilityId: 1, capabilityName: "Engineering" }],
			bands: [{ bandId: 2, bandName: "Band 2" }],
		};

		vi.mocked(jobRoleService.getJobRoleMetadata).mockResolvedValueOnce(
			metadata,
		);

		await controller.getJobRoleMetadata(req, res);

		expect(jobRoleService.getJobRoleMetadata).toHaveBeenCalledTimes(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(metadata);
	});

	it("should return 500 when getJobRoleMetadata throws", async () => {
		vi.mocked(jobRoleService.getJobRoleMetadata).mockRejectedValueOnce(
			new Error("db down"),
		);

		await controller.getJobRoleMetadata(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});

	it("should return csv report with file download headers", async () => {
		vi.mocked(jobRoleService.generateJobRolesCsvReport).mockResolvedValueOnce(
			"id,roleName\n1,Backend Engineer",
		);

		await controller.downloadJobRolesReport(req, res);

		expect(jobRoleService.generateJobRolesCsvReport).toHaveBeenCalledTimes(1);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"text/csv; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Disposition",
			expect.stringContaining('attachment; filename="job-roles-report-'),
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith("id,roleName\n1,Backend Engineer");
	});

	it("should return 500 when csv report generation throws", async () => {
		vi.mocked(jobRoleService.generateJobRolesCsvReport).mockRejectedValueOnce(
			new Error("db down"),
		);

		await controller.downloadJobRolesReport(req, res);

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
			user: { userId: 7, email: "user@example.com", role: "USER" },
			body: {
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

	it("should return 401 when applyForJobRole has no authenticated user", async () => {
		req = {
			params: { id: "2" },
			body: {
				fileName: "cv.pdf",
				contentType: "application/pdf",
			},
		} as unknown as Request;

		await controller.applyForJobRole(req, res);

		expect(jobRoleService.applyForJobRole).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Authentication required",
		});
	});

	it("should return 400 when applyForJobRole is missing required fields", async () => {
		req = {
			params: { id: "2" },
			user: { userId: 7, email: "user@example.com", role: "USER" },
			body: {
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
			user: { userId: 7, email: "user@example.com", role: "USER" },
			body: {
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

	it("should return 201 when createJobRole succeeds", async () => {
        const payload = {
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
 
        const createdJobRole = {
            id: 10,
            ...payload,
            capability: {
                capabilityId: 1,
                capabilityName: "Engineering",
            },
            band: {
                bandId: 2,
                bandName: "Band 2",
            },
            status: JobRoleStatusDto.Open,
        };
 
        req = { body: payload } as Request;
        vi.mocked(jobRoleService.createJobRole).mockResolvedValueOnce(
            createdJobRole,
        );
 
        await controller.createJobRole(req, res);
 
        expect(jobRoleService.createJobRole).toHaveBeenCalledWith(payload);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createdJobRole);
    });


	it("should return 200 with updated job role", async () => {
		const updatePayload: UpdateJobRoleRequestDto = {
			roleName: "Senior Backend Engineer",
			status: JobRoleStatusDto.Closed,
		};
		const updatedJobRole = {
			id: 1,
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capability: {
				capabilityId: 1,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 1,
				bandName: "Band 1",
			},
			closingDate: "2026-08-31",
			status: JobRoleStatusDto.Closed,
			description: "Backend role description",
			responsibilities: "Build APIs",
			sharepointUrl: "https://example.com/backend",
			numberOfOpenPositions: 2,
		};

		req = {
			params: { id: "1" },
			body: updatePayload,
		} as unknown as Request;

		vi.mocked(jobRoleService.updateJobRole).mockResolvedValueOnce(
			updatedJobRole,
		);

		await controller.updateJobRole(req, res);

		expect(jobRoleService.updateJobRole).toHaveBeenCalledWith(1, updatePayload);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(updatedJobRole);
	});

	it("should return 404 when update target job role is not found", async () => {
		req = {
			params: { id: "999" },
			body: { roleName: "Updated" },
		} as unknown as Request;

		vi.mocked(jobRoleService.updateJobRole).mockRejectedValueOnce(
			new JobRoleNotFoundError(999),
		);

		await controller.updateJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			error: "Job role with id 999 was not found",
		});
	});

	it("should return 404 when update references are invalid", async () => {
		req = {
			params: { id: "1" },
			body: { capabilityId: 999 },
		} as unknown as Request;

		vi.mocked(jobRoleService.updateJobRole).mockRejectedValueOnce(
			new InvalidJobRoleReferenceError("Capability with id 999 was not found"),
		);

		await controller.updateJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			error: "Capability with id 999 was not found",
		});
	});

	it("should return 500 when updateJobRole throws an unexpected error", async () => {
		req = {
			params: { id: "1" },
			body: { roleName: "Updated" },
		} as unknown as Request;

		vi.mocked(jobRoleService.updateJobRole).mockRejectedValueOnce(
			new Error("db down"),
		);

		await controller.updateJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});
});
