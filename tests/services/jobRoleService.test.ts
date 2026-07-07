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
};

const mockMapper = {
	toResponse: vi.fn(),
};

describe("JobRoleService", () => {
	let service: JobRoleService;
	let jobRoleDao: Pick<JobRoleDao, "findAllJobRoles">;
	let jobRoleMapper: Pick<JobRoleMapper, "toResponse">;

	beforeEach(() => {
		vi.clearAllMocks();

		jobRoleDao = {
			findAllJobRoles: mockDao.findAllJobRoles,
		};

		jobRoleMapper = {
			toResponse: mockMapper.toResponse,
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
				closingDate: new Date("2026-08-31T00:00:00.000Z"),
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
				closingDate: "2026-08-31T00:00:00.000Z",
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
});
