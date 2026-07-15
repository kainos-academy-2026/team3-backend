import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	JobRoleDao,
	JobRoleWithRelations,
} from "../../src/daos/jobRoleDao.js";
import {
	type JobRoleResponseDto,
	JobRoleStatusDto,
} from "../../src/dtos/jobRoleDto.js";
import type { JobRoleMapper } from "../../src/mappers/jobRoleMapper.js";
import { JobRoleService } from "../../src/services/jobRoleService.js";
import type { S3Service } from "../../src/services/s3Service.js";

const mockDao = {
	findAllJobRoles: vi.fn(),
	findJobRoleById: vi.fn(),
	createApplication: vi.fn(),
};

const mockMapper = {
	toResponse: vi.fn(),
	toDetailedResponse: vi.fn(),
};

const mockS3Service = {
	getPresignedUploadUrl: vi.fn(),
};

describe("JobRoleService", () => {
	let service: JobRoleService;
	let jobRoleDao: Pick<
		JobRoleDao,
		"findAllJobRoles" | "findJobRoleById" | "createApplication"
	>;
	let jobRoleMapper: Pick<JobRoleMapper, "toResponse" | "toDetailedResponse">;
	let s3Service: Pick<S3Service, "getPresignedUploadUrl">;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleDao = {
			findAllJobRoles: mockDao.findAllJobRoles,
			findJobRoleById: mockDao.findJobRoleById,
			createApplication: mockDao.createApplication,
		};

		jobRoleMapper = {
			toResponse: mockMapper.toResponse,
			toDetailedResponse: mockMapper.toDetailedResponse,
		};

		s3Service = {
			getPresignedUploadUrl: mockS3Service.getPresignedUploadUrl,
		};

		service = new JobRoleService(
			jobRoleDao as JobRoleDao,
			jobRoleMapper as JobRoleMapper,
			s3Service as S3Service,
		);
	});

	it("should return mapped job roles from dao data", async () => {
		const daoJobRoles = [
			{
				id: 1,
				roleName: "Backend Engineer",
				location: "Dublin",
				capabilityId: 10,
				bandId: 3,
				closingDate: new Date("2026-08-31"),
				status: "Open",
				capability: {
					capabilityId: 10,
					capabilityName: "Engineering",
				},
				band: {
					bandId: 3,
					bandName: "Band 3",
				},
			},
		] as JobRoleWithRelations[];

		const mappedJobRoles: JobRoleResponseDto[] = [
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
				status: JobRoleStatusDto.Open,
			},
		];

		vi.mocked(jobRoleDao.findAllJobRoles).mockResolvedValueOnce(daoJobRoles);
		vi.mocked(jobRoleMapper.toResponse).mockReturnValueOnce(mappedJobRoles[0]);

		const result = await service.findAllJobRoles();

		expect(jobRoleDao.findAllJobRoles).toHaveBeenCalledTimes(1);
		expect(jobRoleMapper.toResponse).toHaveBeenCalledTimes(1);
		expect(jobRoleMapper.toResponse).toHaveBeenCalledWith(daoJobRoles[0]);
		expect(result).toEqual(mappedJobRoles);
	});

	it("should throw when dao fails", async () => {
		vi.mocked(jobRoleDao.findAllJobRoles).mockRejectedValueOnce(
			new Error("db down"),
		);

		await expect(service.findAllJobRoles()).rejects.toThrow("db down");
		expect(jobRoleDao.findAllJobRoles).toHaveBeenCalledTimes(1);
		expect(jobRoleMapper.toResponse).not.toHaveBeenCalled();
	});

	it("should generate a csv report with all job role information", async () => {
		const daoJobRoles = [
			{
				id: 1,
				roleName: 'Backend "Engineer"',
				location: "Dublin, Ireland",
				capabilityId: 10,
				bandId: 3,
				closingDate: new Date("2026-08-31"),
				status: "Open",
				description: "Build backend services",
				responsibilities: "Build APIs",
				sharepointUrl: "https://example.com/backend",
				numberOfOpenPositions: 2,
				capability: {
					capabilityId: 10,
					capabilityName: "Engineering",
				},
				band: {
					bandId: 3,
					bandName: "Band 3",
				},
			},
		] as JobRoleWithRelations[];

		vi.mocked(jobRoleDao.findAllJobRoles).mockResolvedValueOnce(daoJobRoles);

		const report = await service.generateJobRolesCsvReport();

		expect(report).toContain(
			"id,roleName,location,capability,band,closingDate,status,description,responsibilities,sharepointUrl,numberOfOpenPositions",
		);
		expect(report).toContain(
			'"1","Backend ""Engineer""","Dublin, Ireland","Engineering","Band 3","2026-08-31","Open","Build backend services","Build APIs","https://example.com/backend","2"',
		);
	});

	it("should return mapped detailed job role from dao data", async () => {
		const daoJobRole = {
			id: 1,
			roleName: "Backend Engineer",
			location: "Dublin",
			capabilityId: 10,
			bandId: 3,
			closingDate: new Date("2026-08-31"),
			status: "Open",
			description: "Backend role description",
			responsibilities: "Build APIs",
			sharepointUrl: "https://example.com/backend",
			numberOfOpenPositions: 3,
			capability: {
				capabilityId: 10,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 3,
				bandName: "Band 3",
			},
		} as JobRoleWithRelations;

		const mappedJobRole = {
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
			status: JobRoleStatusDto.Open,
			description: "Backend role description",
			responsibilities: "Build APIs",
			sharepointUrl: "https://example.com/backend",
			numberOfOpenPositions: 3,
		};

		vi.mocked(jobRoleDao.findJobRoleById).mockResolvedValueOnce(daoJobRole);
		vi.mocked(jobRoleMapper.toDetailedResponse).mockReturnValueOnce(
			mappedJobRole,
		);

		const result = await service.findJobRoleById(1);

		expect(jobRoleDao.findJobRoleById).toHaveBeenCalledWith(1);
		expect(jobRoleMapper.toDetailedResponse).toHaveBeenCalledWith(daoJobRole);
		expect(result).toEqual(mappedJobRole);
	});

	it("should return null when dao returns null", async () => {
		vi.mocked(jobRoleDao.findJobRoleById).mockResolvedValueOnce(null);

		const result = await service.findJobRoleById(999);

		expect(result).toBeNull();
		expect(jobRoleMapper.toDetailedResponse).not.toHaveBeenCalled();
	});

	it("should return presigned upload data and create an application", async () => {
		vi.mocked(s3Service.getPresignedUploadUrl).mockResolvedValueOnce({
			uploadUrl: "https://example.com/upload",
			key: "job-applications/2/7/123-cv.pdf",
		});
		vi.mocked(jobRoleDao.createApplication).mockResolvedValueOnce(undefined);

		const result = await service.applyForJobRole(
			7,
			2,
			"cv.pdf",
			"application/pdf",
		);

		expect(s3Service.getPresignedUploadUrl).toHaveBeenCalledWith(
			7,
			2,
			"cv.pdf",
			"application/pdf",
		);
		expect(jobRoleDao.createApplication).toHaveBeenCalledWith(
			7,
			2,
			"job-applications/2/7/123-cv.pdf",
		);
		expect(result).toEqual({
			uploadUrl: "https://example.com/upload",
			key: "job-applications/2/7/123-cv.pdf",
		});
	});

	it("should throw when presigned url generation fails", async () => {
		vi.mocked(s3Service.getPresignedUploadUrl).mockRejectedValueOnce(
			new Error("s3 down"),
		);

		await expect(
			service.applyForJobRole(7, 2, "cv.pdf", "application/pdf"),
		).rejects.toThrow("s3 down");
	});
});
