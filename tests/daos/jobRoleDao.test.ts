import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRoleWithRelations } from "../../src/daos/jobRoleDao.js";

const mocks = vi.hoisted(() => ({
	findMany: vi.fn(),
	findUnique: vi.fn(),
	jobRoleCreate: vi.fn(),
	create: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		jobRole: {
			findMany: mocks.findMany,
			findUnique: mocks.findUnique,
			create: mocks.jobRoleCreate,
		},
		application: {
			create: mocks.create,
		},
	},
}));

import { JobRoleDao } from "../../src/daos/jobRoleDao.js";
import {
	JobRoleApplicationStatusDto,
	JobRoleStatusDto,
} from "../../src/dtos/jobRoleDto.js";

describe("JobRoleDao", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return all job roles with relations", async () => {
		const dbRows = [
			{
				id: 1,
				roleName: "Backend Engineer",
				location: "Dublin",
				capabilityId: 10,
				bandId: 3,
				closingDate: new Date("2026-08-31"),
				status: "Open",
				capability: { capabilityId: 10, capabilityName: "Engineering" },
				band: { bandId: 3, bandName: "Band 3" },
			},
		] as unknown as JobRoleWithRelations[];

		mocks.findMany.mockResolvedValueOnce(dbRows);

		const dao = new JobRoleDao();
		const result = await dao.findAllJobRoles();

		expect(mocks.findMany).toHaveBeenCalledTimes(1);
		expect(mocks.findMany).toHaveBeenCalledWith({
			include: {
				capability: true,
				band: true,
			},
		});
		expect(result).toEqual(dbRows);
	});

	it("should return all capabilities ordered by name", async () => {
		mocks.capabilityFindMany.mockResolvedValueOnce([
			{ capabilityId: 1, capabilityName: "Engineering" },
		]);

		const dao = new JobRoleDao();
		const result = await dao.findAllCapabilities();

		expect(mocks.capabilityFindMany).toHaveBeenCalledWith({
			orderBy: {
				capabilityName: "asc",
			},
		});
		expect(result).toEqual([
			{ capabilityId: 1, capabilityName: "Engineering" },
		]);
	});

	it("should return all bands ordered by name", async () => {
		mocks.bandFindMany.mockResolvedValueOnce([
			{ bandId: 1, bandName: "Band 1" },
		]);

		const dao = new JobRoleDao();
		const result = await dao.findAllBands();

		expect(mocks.bandFindMany).toHaveBeenCalledWith({
			orderBy: {
				bandName: "asc",
			},
		});
		expect(result).toEqual([{ bandId: 1, bandName: "Band 1" }]);
	});

	it("should return one job role by id with relations", async () => {
		const dbRow = {
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
			capability: { capabilityId: 10, capabilityName: "Engineering" },
			band: { bandId: 3, bandName: "Band 3" },
		} as unknown as JobRoleWithRelations;

		mocks.findUnique.mockResolvedValueOnce(dbRow);

		const dao = new JobRoleDao();
		const result = await dao.findJobRoleById(1);

		expect(mocks.findUnique).toHaveBeenCalledWith({
			where: { id: 1 },
			include: {
				capability: true,
				band: true,
			},
		});
		expect(result).toEqual(dbRow);
	});

	it("should create a job role with open status and relations included", async () => {
		const createdJobRole = {
			id: 2,
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capabilityId: 1,
			bandId: 2,
			closingDate: new Date("2026-08-31"),
			status: JobRoleStatusDto.Open,
			description: "Own backend services and integrations.",
			responsibilities: "Build APIs, review code, support delivery.",
			sharepointUrl: "https://example.sharepoint.com/job-role",
			numberOfOpenPositions: 2,
			capability: { capabilityId: 1, capabilityName: "Engineering" },
			band: { bandId: 2, bandName: "Band 2" },
		} as unknown as JobRoleWithRelations;

		mocks.jobRoleCreate.mockResolvedValueOnce(createdJobRole);

		const dao = new JobRoleDao();
		const input = {
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capabilityId: 1,
			bandId: 2,
			closingDate: new Date("2026-08-31"),
			description: "Own backend services and integrations.",
			responsibilities: "Build APIs, review code, support delivery.",
			sharepointUrl: "https://example.sharepoint.com/job-role",
			numberOfOpenPositions: 2,
		};

		const result = await dao.createJobRole(input);

		expect(mocks.jobRoleCreate).toHaveBeenCalledWith({
			data: {
				...input,
				status: JobRoleStatusDto.Open,
			},
			include: {
				capability: true,
				band: true,
			},
		});
		expect(result).toEqual(createdJobRole);
	});

	it("should create an application with in progress status", async () => {
		mocks.create.mockResolvedValueOnce({
			id: 1,
			userId: 7,
			jobRoleId: 2,
			cvUrl: "job-applications/2/7/123-cv.pdf",
			status: JobRoleApplicationStatusDto.InProgress,
		});

		const dao = new JobRoleDao();
		await dao.createApplication(7, 2, "job-applications/2/7/123-cv.pdf");

		expect(mocks.create).toHaveBeenCalledWith({
			data: {
				userId: 7,
				jobRoleId: 2,
				cvUrl: "job-applications/2/7/123-cv.pdf",
				status: JobRoleApplicationStatusDto.InProgress,
			},
		});
	});

	it("should throw when createApplication fails", async () => {
		mocks.create.mockRejectedValueOnce(new Error("db down"));

		const dao = new JobRoleDao();

		await expect(
			dao.createApplication(7, 2, "job-applications/2/7/123-cv.pdf"),
		).rejects.toThrow("db down");
	});
});
