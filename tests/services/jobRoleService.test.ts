import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BandDao } from "../../src/daos/bandDao.js";
import type { CapabilityDao } from "../../src/daos/capabilityDao.js";
import type {
	JobRoleDao,
	JobRoleWithRelations,
} from "../../src/daos/jobRoleDao.js";
import type { CreateJobRoleRequestDto } from "../../src/dtos/createJobRoleDto.js";
import {
	type JobRoleResponseDto,
	JobRoleStatusDto,
} from "../../src/dtos/jobRoleDto.js";
import { InvalidJobRoleReferenceError } from "../../src/errors/InvalidJobRoleReferenceError.js";
import type { JobRoleMapper } from "../../src/mappers/jobRoleMapper.js";
import { JobRoleService } from "../../src/services/jobRoleService.js";
import type { S3Service } from "../../src/services/s3Service.js";

const mockJobRoleDao = {
	findAllJobRoles: vi.fn(),
	findJobRoleById: vi.fn(),
	createJobRole: vi.fn(),
	createApplication: vi.fn(),
};

const mockCapabilityDao = {
	findAllCapabilities: vi.fn(),
	findCapabilityById: vi.fn(),
};

const mockBandDao = {
	findAllBands: vi.fn(),
	findBandById: vi.fn(),
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
		| "findAllJobRoles"
		| "findJobRoleById"
		| "createJobRole"
		| "createApplication"
	>;
	let capabilityDao: Pick<
		CapabilityDao,
		"findAllCapabilities" | "findCapabilityById"
	>;
	let bandDao: Pick<BandDao, "findAllBands" | "findBandById">;
	let jobRoleMapper: Pick<JobRoleMapper, "toResponse" | "toDetailedResponse">;
	let s3Service: Pick<S3Service, "getPresignedUploadUrl">;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleDao = {
			findAllJobRoles: mockJobRoleDao.findAllJobRoles,
			findJobRoleById: mockJobRoleDao.findJobRoleById,
			createJobRole: mockJobRoleDao.createJobRole,
			createApplication: mockJobRoleDao.createApplication,
		};

		capabilityDao = {
			findAllCapabilities: mockCapabilityDao.findAllCapabilities,
			findCapabilityById: mockCapabilityDao.findCapabilityById,
		};

		bandDao = {
			findAllBands: mockBandDao.findAllBands,
			findBandById: mockBandDao.findBandById,
		};

		capabilityDao = {
			findAllCapabilities: mockCapabilityDao.findAllCapabilities,
			findCapabilityById: mockCapabilityDao.findCapabilityById,
		};

		bandDao = {
			findAllBands: mockBandDao.findAllBands,
			findBandById: mockBandDao.findBandById,
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
			capabilityDao as CapabilityDao,
			bandDao as BandDao,
			jobRoleMapper as JobRoleMapper,
			s3Service as S3Service,
		);
	});

	it("should return mapped metadata from dao data", async () => {
		vi.mocked(capabilityDao.findAllCapabilities).mockResolvedValueOnce([
			{ capabilityId: 2, capabilityName: "Engineering" },
		]);
		vi.mocked(bandDao.findAllBands).mockResolvedValueOnce([
			{ bandId: 5, bandName: "Band 5" },
		]);

		const result = await service.getJobRoleMetadata();

		expect(capabilityDao.findAllCapabilities).toHaveBeenCalledTimes(1);
		expect(bandDao.findAllBands).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			capabilities: [{ capabilityId: 2, capabilityName: "Engineering" }],
			bands: [{ bandId: 5, bandName: "Band 5" }],
		});
	});

	it("should throw when metadata dao calls fail", async () => {
		vi.mocked(capabilityDao.findAllCapabilities).mockRejectedValueOnce(
			new Error("db down"),
		);

		await expect(service.getJobRoleMetadata()).rejects.toThrow("db down");
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

	it("should create a job role after validating references", async () => {
		const requestData: CreateJobRoleRequestDto = {
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
			roleName: requestData.roleName,
			location: requestData.location,
			capabilityId: requestData.capabilityId,
			bandId: requestData.bandId,
			closingDate: new Date("2026-08-31"),
			status: JobRoleStatusDto.Open,
			description: requestData.description,
			responsibilities: requestData.responsibilities,
			sharepointUrl: requestData.sharepointUrl,
			numberOfOpenPositions: requestData.numberOfOpenPositions,
			capability: {
				capabilityId: requestData.capabilityId,
				capabilityName: "Engineering",
			},
			band: {
				bandId: requestData.bandId,
				bandName: "Band 2",
			},
		} as JobRoleWithRelations;

		const mappedCreatedJobRole = {
			id: 10,
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capability: {
				capabilityId: 1,
				capabilityName: "Engineering",
			},
			band: {
				bandId: 2,
				bandName: "Band 2",
			},
			closingDate: "2026-08-31",
			status: JobRoleStatusDto.Open,
			description: "Own backend services and integrations.",
			responsibilities: "Build APIs, review code, support delivery.",
			sharepointUrl: "https://example.sharepoint.com/job-role",
			numberOfOpenPositions: 2,
		};

		vi.mocked(capabilityDao.findCapabilityById).mockResolvedValueOnce({
			capabilityId: 1,
			capabilityName: "Engineering",
		});
		vi.mocked(bandDao.findBandById).mockResolvedValueOnce({
			bandId: 2,
			bandName: "Band 2",
		});
		vi.mocked(jobRoleDao.createJobRole).mockResolvedValueOnce(createdJobRole);
		vi.mocked(jobRoleMapper.toDetailedResponse).mockReturnValueOnce(
			mappedCreatedJobRole,
		);

		const result = await service.createJobRole(requestData);

		expect(capabilityDao.findCapabilityById).toHaveBeenCalledWith(1);
		expect(bandDao.findBandById).toHaveBeenCalledWith(2);
		expect(jobRoleDao.createJobRole).toHaveBeenCalledWith({
			roleName: requestData.roleName,
			location: requestData.location,
			capabilityId: requestData.capabilityId,
			bandId: requestData.bandId,
			closingDate: new Date(requestData.closingDate),
			description: requestData.description,
			responsibilities: requestData.responsibilities,
			sharepointUrl: requestData.sharepointUrl,
			numberOfOpenPositions: requestData.numberOfOpenPositions,
		});
		expect(jobRoleMapper.toDetailedResponse).toHaveBeenCalledWith(
			createdJobRole,
		);
		expect(result).toEqual(mappedCreatedJobRole);
	});

	it("should throw InvalidJobRoleReferenceError when capability is missing", async () => {
		vi.mocked(capabilityDao.findCapabilityById).mockResolvedValueOnce(null);

		await expect(
			service.createJobRole({
				roleName: "Senior Backend Engineer",
				location: "Dublin",
				capabilityId: 999,
				bandId: 2,
				closingDate: "2026-08-31",
				description: "Own backend services and integrations.",
				responsibilities: "Build APIs, review code, support delivery.",
				sharepointUrl: "https://example.sharepoint.com/job-role",
				numberOfOpenPositions: 2,
			}),
		).rejects.toBeInstanceOf(InvalidJobRoleReferenceError);

		expect(bandDao.findBandById).not.toHaveBeenCalled();
		expect(jobRoleDao.createJobRole).not.toHaveBeenCalled();
	});

	it("should throw InvalidJobRoleReferenceError when band is missing", async () => {
		vi.mocked(capabilityDao.findCapabilityById).mockResolvedValueOnce({
			capabilityId: 1,
			capabilityName: "Engineering",
		});
		vi.mocked(bandDao.findBandById).mockResolvedValueOnce(null);

		await expect(
			service.createJobRole({
				roleName: "Senior Backend Engineer",
				location: "Dublin",
				capabilityId: 1,
				bandId: 999,
				closingDate: "2026-08-31",
				description: "Own backend services and integrations.",
				responsibilities: "Build APIs, review code, support delivery.",
				sharepointUrl: "https://example.sharepoint.com/job-role",
				numberOfOpenPositions: 2,
			}),
		).rejects.toBeInstanceOf(InvalidJobRoleReferenceError);

		expect(jobRoleDao.createJobRole).not.toHaveBeenCalled();
	});

	it("should not use status from caller during create", async () => {
		vi.mocked(capabilityDao.findCapabilityById).mockResolvedValueOnce({
			capabilityId: 1,
			capabilityName: "Engineering",
		});
		vi.mocked(bandDao.findBandById).mockResolvedValueOnce({
			bandId: 2,
			bandName: "Band 2",
		});
		vi.mocked(jobRoleDao.createJobRole).mockResolvedValueOnce({
			id: 1,
		} as JobRoleWithRelations);
		vi.mocked(jobRoleMapper.toDetailedResponse).mockReturnValueOnce({
			id: 1,
		} as never);

		await service.createJobRole({
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capabilityId: 1,
			bandId: 2,
			closingDate: "2026-08-31",
			description: "Own backend services and integrations.",
			responsibilities: "Build APIs, review code, support delivery.",
			sharepointUrl: "https://example.sharepoint.com/job-role",
			numberOfOpenPositions: 2,
		} as CreateJobRoleRequestDto & { status: string });

		expect(jobRoleDao.createJobRole).toHaveBeenCalledWith(
			expect.not.objectContaining({
				status: expect.anything(),
			}),
		);
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
