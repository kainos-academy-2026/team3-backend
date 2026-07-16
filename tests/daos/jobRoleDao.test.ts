import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRoleWithRelations } from "../../src/daos/jobRoleDao.js";

const mocks = vi.hoisted(() => ({
	findMany: vi.fn(),
	count: vi.fn(),
	findUnique: vi.fn(),
	jobRoleCreate: vi.fn(),
	jobRoleUpdateMany: vi.fn(),
	findCapabilityUnique: vi.fn(),
	findBandUnique: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	applicationFindMany: vi.fn(),
	applicationFindUnique: vi.fn(),
	applicationUpdateMany: vi.fn(),
	transaction: vi.fn(),
}));

const transactionMocks = vi.hoisted(() => ({
	jobRoleFindUnique: vi.fn(),
	jobRoleUpdateMany: vi.fn(),
	applicationFindUnique: vi.fn(),
	applicationUpdateMany: vi.fn(),
	applicationFindMany: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		$transaction: mocks.transaction,
		jobRole: {
			findMany: mocks.findMany,
			count: mocks.count,
			findUnique: mocks.findUnique,
			create: mocks.jobRoleCreate,
			update: mocks.update,
			updateMany: mocks.jobRoleUpdateMany,
		},
		capability: {
			findUnique: mocks.findCapabilityUnique,
		},
		band: {
			findUnique: mocks.findBandUnique,
		},
		application: {
			create: mocks.create,
			findMany: mocks.applicationFindMany,
			findUnique: mocks.applicationFindUnique,
			updateMany: mocks.applicationUpdateMany,
		},
	},
}));

import { JobRoleDao } from "../../src/daos/jobRoleDao.js";
import {
	JobRoleApplicationStatusDto,
	JobRoleStatusDto,
} from "../../src/dtos/jobRoleDto.js";
import { InvalidJobRoleApplicationStatusError } from "../../src/errors/InvalidJobRoleApplicationStatusError.js";

describe("JobRoleDao", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.transaction.mockImplementation(async (callback) =>
			callback({
				jobRole: {
					findUnique: transactionMocks.jobRoleFindUnique,
					updateMany: transactionMocks.jobRoleUpdateMany,
				},
				application: {
					findUnique: transactionMocks.applicationFindUnique,
					updateMany: transactionMocks.applicationUpdateMany,
					findMany: transactionMocks.applicationFindMany,
				},
			} as never),
		);
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
			orderBy: {
				id: "desc",
			},
			include: {
				capability: true,
				band: true,
			},
		});
		expect(result).toEqual(dbRows);
	});

	it("should return a paginated list of job roles", async () => {
		const dbRows = [
			{
				id: 3,
				roleName: "Senior Backend Engineer",
				location: "Dublin",
				capabilityId: 10,
				bandId: 3,
				closingDate: new Date("2026-09-01"),
				status: "Open",
				capability: { capabilityId: 10, capabilityName: "Engineering" },
				band: { bandId: 3, bandName: "Band 3" },
			},
		] as unknown as JobRoleWithRelations[];

		mocks.findMany.mockResolvedValueOnce(dbRows);

		const dao = new JobRoleDao();
		const result = await dao.findPaginatedJobRoles(10, 2);

		expect(mocks.findMany).toHaveBeenCalledWith({
			skip: 10,
			take: 10,
			orderBy: {
				id: "desc",
			},
			include: {
				capability: true,
				band: true,
			},
		});
		expect(result).toEqual(dbRows);
	});

	it("should return total count of job roles", async () => {
		mocks.count.mockResolvedValueOnce(37);

		const dao = new JobRoleDao();
		const result = await dao.countJobRoles();

		expect(mocks.count).toHaveBeenCalledTimes(1);
		expect(result).toBe(37);
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

	it("should return one capability by id", async () => {
		const capability = {
			capabilityId: 10,
			capabilityName: "Engineering",
		};

		mocks.findCapabilityUnique.mockResolvedValueOnce(capability);

		const dao = new JobRoleDao();
		const result = await dao.findCapabilityById(10);

		expect(mocks.findCapabilityUnique).toHaveBeenCalledWith({
			where: { capabilityId: 10 },
		});
		expect(result).toEqual(capability);
	});

	it("should return one band by id", async () => {
		const band = {
			bandId: 3,
			bandName: "Band 3",
		};

		mocks.findBandUnique.mockResolvedValueOnce(band);

		const dao = new JobRoleDao();
		const result = await dao.findBandById(3);

		expect(mocks.findBandUnique).toHaveBeenCalledWith({
			where: { bandId: 3 },
		});
		expect(result).toEqual(band);
	});

	it("should update a job role with provided patch fields and include relations", async () => {
		const dbRow = {
			id: 1,
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capabilityId: 10,
			bandId: 3,
			closingDate: new Date("2026-09-15"),
			status: "Open",
			description: "Backend role description",
			responsibilities: "Build APIs",
			sharepointUrl: "https://example.com/backend",
			numberOfOpenPositions: 3,
			capability: { capabilityId: 10, capabilityName: "Engineering" },
			band: { bandId: 3, bandName: "Band 3" },
		} as unknown as JobRoleWithRelations;

		const patchData = {
			roleName: "Senior Backend Engineer",
			status: JobRoleStatusDto.Open,
		};

		mocks.update.mockResolvedValueOnce(dbRow);

		const dao = new JobRoleDao();
		const result = await dao.updateJobRole(1, patchData);

		expect(mocks.update).toHaveBeenCalledWith({
			where: { id: 1 },
			data: patchData,
			include: {
				capability: true,
				band: true,
			},
		});
		expect(result).toEqual(dbRow);
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

	it("should return applications for a job role ordered by most recent first", async () => {
		const rows = [
			{
				id: 2,
				userId: 8,
				jobRoleId: 1,
				cvUrl: "job-applications/1/8/cv.pdf",
				status: JobRoleApplicationStatusDto.InProgress,
				appliedAt: new Date("2026-07-02T12:00:00.000Z"),
				user: { id: 8, email: "second@example.com" },
			},
		];

		mocks.applicationFindMany.mockResolvedValueOnce(rows);

		const dao = new JobRoleDao();
		const result = await dao.findApplicationsByJobRoleId(1);

		expect(mocks.applicationFindMany).toHaveBeenCalledWith({
			where: { jobRoleId: 1 },
			include: {
				user: {
					select: {
						id: true,
						email: true,
					},
				},
			},
			orderBy: {
				appliedAt: "desc",
			},
		});
		expect(result).toEqual(rows);
	});

	it("should hire an application inside a transaction and decrement open positions", async () => {
		transactionMocks.jobRoleFindUnique.mockResolvedValueOnce({
			id: 1,
			numberOfOpenPositions: 2,
		});
		transactionMocks.applicationFindUnique.mockResolvedValueOnce({
			id: 101,
			userId: 7,
			jobRoleId: 1,
			cvUrl: "job-applications/1/7/cv.pdf",
			status: JobRoleApplicationStatusDto.InProgress,
			appliedAt: new Date("2026-07-01T12:00:00.000Z"),
			user: { id: 7, email: "candidate@example.com" },
		});
		transactionMocks.jobRoleUpdateMany.mockResolvedValueOnce({ count: 1 });
		transactionMocks.applicationUpdateMany.mockResolvedValueOnce({ count: 1 });
		transactionMocks.applicationFindUnique.mockResolvedValueOnce({
			id: 101,
			userId: 7,
			jobRoleId: 1,
			cvUrl: "job-applications/1/7/cv.pdf",
			status: JobRoleApplicationStatusDto.Hired,
			appliedAt: new Date("2026-07-01T12:00:00.000Z"),
			user: { id: 7, email: "candidate@example.com" },
		});

		const dao = new JobRoleDao();
		const result = await dao.hireApplication(1, 101);

		expect(mocks.transaction).toHaveBeenCalledTimes(1);
		expect(transactionMocks.jobRoleUpdateMany).toHaveBeenCalledWith({
			where: { id: 1, numberOfOpenPositions: { gt: 0 } },
			data: { numberOfOpenPositions: { decrement: 1 } },
		});
		expect(transactionMocks.applicationUpdateMany).toHaveBeenCalledWith({
			where: {
				id: 101,
				jobRoleId: 1,
				status: JobRoleApplicationStatusDto.InProgress,
			},
			data: { status: JobRoleApplicationStatusDto.Hired },
		});
		expect(result).toEqual({
			application: {
				id: 101,
				userId: 7,
				jobRoleId: 1,
				cvUrl: "job-applications/1/7/cv.pdf",
				status: JobRoleApplicationStatusDto.Hired,
				appliedAt: new Date("2026-07-01T12:00:00.000Z"),
				user: { id: 7, email: "candidate@example.com" },
			},
			numberOfOpenPositions: 1,
		});
	});

	it("should reject a hire when the application is not in progress", async () => {
		transactionMocks.jobRoleFindUnique.mockResolvedValueOnce({
			id: 1,
			numberOfOpenPositions: 2,
		});
		transactionMocks.applicationFindUnique.mockResolvedValueOnce({
			id: 101,
			userId: 7,
			jobRoleId: 1,
			cvUrl: "job-applications/1/7/cv.pdf",
			status: JobRoleApplicationStatusDto.Rejected,
			appliedAt: new Date("2026-07-01T12:00:00.000Z"),
			user: { id: 7, email: "candidate@example.com" },
		});

		const dao = new JobRoleDao();

		await expect(dao.hireApplication(1, 101)).rejects.toBeInstanceOf(
			InvalidJobRoleApplicationStatusError,
		);
		expect(transactionMocks.jobRoleUpdateMany).not.toHaveBeenCalled();
		expect(transactionMocks.applicationUpdateMany).not.toHaveBeenCalled();
	});

	it("should reject an application inside a transaction without changing open positions", async () => {
		transactionMocks.applicationFindUnique.mockResolvedValueOnce({
			id: 101,
			userId: 7,
			jobRoleId: 1,
			cvUrl: "job-applications/1/7/cv.pdf",
			status: JobRoleApplicationStatusDto.InProgress,
			appliedAt: new Date("2026-07-01T12:00:00.000Z"),
			user: { id: 7, email: "candidate@example.com" },
		});
		transactionMocks.applicationUpdateMany.mockResolvedValueOnce({ count: 1 });
		transactionMocks.applicationFindUnique.mockResolvedValueOnce({
			id: 101,
			userId: 7,
			jobRoleId: 1,
			cvUrl: "job-applications/1/7/cv.pdf",
			status: JobRoleApplicationStatusDto.Rejected,
			appliedAt: new Date("2026-07-01T12:00:00.000Z"),
			user: { id: 7, email: "candidate@example.com" },
		});

		const dao = new JobRoleDao();
		const result = await dao.rejectApplication(1, 101);

		expect(transactionMocks.jobRoleUpdateMany).not.toHaveBeenCalled();
		expect(transactionMocks.applicationUpdateMany).toHaveBeenCalledWith({
			where: {
				id: 101,
				jobRoleId: 1,
				status: JobRoleApplicationStatusDto.InProgress,
			},
			data: { status: JobRoleApplicationStatusDto.Rejected },
		});
		expect(result.status).toBe(JobRoleApplicationStatusDto.Rejected);
	});
});
