import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	capabilityFindMany: vi.fn(),
	capabilityFindUnique: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		capability: {
			findMany: mocks.capabilityFindMany,
			findUnique: mocks.capabilityFindUnique,
		},
	},
}));

import { CapabilityDao } from "../../src/daos/capabilityDao.js";

describe("CapabilityDao", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return all capabilities ordered by name", async () => {
		mocks.capabilityFindMany.mockResolvedValueOnce([
			{ capabilityId: 1, capabilityName: "Engineering" },
		]);

		const dao = new CapabilityDao();
		const result = await dao.findAllCapabilities();

		expect(mocks.capabilityFindMany).toHaveBeenCalledWith({
			orderBy: {
				capabilityName: "asc",
			},
		});
		expect(result).toEqual([{ capabilityId: 1, capabilityName: "Engineering" }]);
	});

	it("should find capability by id", async () => {
		mocks.capabilityFindUnique.mockResolvedValueOnce({
			capabilityId: 7,
			capabilityName: "Data",
		});

		const dao = new CapabilityDao();
		const result = await dao.findCapabilityById(7);

		expect(mocks.capabilityFindUnique).toHaveBeenCalledWith({
			where: { capabilityId: 7 },
		});
		expect(result).toEqual({
			capabilityId: 7,
			capabilityName: "Data",
		});
	});
});