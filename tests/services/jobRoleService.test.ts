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

const mockDao = {
    findAllJobRoles: vi.fn(),
    findJobRoleById: vi.fn(),
};

const mockMapper = {
    toResponse: vi.fn(),
    toDetailedResponse: vi.fn(),
};

describe("JobRoleService", () => {
	let service: JobRoleService;
	let jobRoleDao: Pick<JobRoleDao, "findAllJobRoles" | "findJobRoleById">;
	let jobRoleMapper: Pick<JobRoleMapper, "toResponse" | "toDetailedResponse">;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleDao = {
			findAllJobRoles: mockDao.findAllJobRoles,
			findJobRoleById: mockDao.findJobRoleById,
		};

		jobRoleMapper = {
			toResponse: mockMapper.toResponse,
			toDetailedResponse: mockMapper.toDetailedResponse,
		};

		service = new JobRoleService(
			jobRoleDao as JobRoleDao,
			jobRoleMapper as JobRoleMapper,
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
    vi.mocked(jobRoleMapper.toDetailedResponse).mockReturnValueOnce(mappedJobRole);

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
});
