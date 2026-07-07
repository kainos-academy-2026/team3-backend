import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRoleWithRelations } from "../../src/daos/jobRoleDao.js";

const mocks = vi.hoisted(() => ({
	findMany: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		jobRole: {
			findMany: mocks.findMany,
		},
	},
}));

import { JobRoleDao } from "../../src/daos/jobRoleDao.js";

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
				closingDate: new Date("2026-08-31T00:00:00.000Z"),
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
});
