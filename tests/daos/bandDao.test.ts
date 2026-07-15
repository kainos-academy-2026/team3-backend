import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	bandFindMany: vi.fn(),
	bandFindUnique: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		band: {
			findMany: mocks.bandFindMany,
			findUnique: mocks.bandFindUnique,
		},
	},
}));

import { BandDao } from "../../src/daos/bandDao.js";

describe("BandDao", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return all bands ordered by name", async () => {
		mocks.bandFindMany.mockResolvedValueOnce([{ bandId: 1, bandName: "Band 1" }]);

		const dao = new BandDao();
		const result = await dao.findAllBands();

		expect(mocks.bandFindMany).toHaveBeenCalledWith({
			orderBy: {
				bandName: "asc",
			},
		});
		expect(result).toEqual([{ bandId: 1, bandName: "Band 1" }]);
	});

	it("should find band by id", async () => {
		mocks.bandFindUnique.mockResolvedValueOnce({
			bandId: 4,
			bandName: "Band 4",
		});

		const dao = new BandDao();
		const result = await dao.findBandById(4);

		expect(mocks.bandFindUnique).toHaveBeenCalledWith({
			where: { bandId: 4 },
		});
		expect(result).toEqual({
			bandId: 4,
			bandName: "Band 4",
		});
	});
});