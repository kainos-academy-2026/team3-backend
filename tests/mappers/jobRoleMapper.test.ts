import { describe, expect, it } from "vitest";
import type { JobRoleWithRelations } from "../../src/daos/jobRoleDao.js";
import { JobRoleStatusDto } from "../../src/dtos/jobRoleDto.js";
import { JobRoleMapper } from "../../src/mappers/jobRoleMapper.js";

describe("JobRoleMapper", () => {
	it("should map a job role to response dto", () => {
		const mapper = new JobRoleMapper();

		const jobRole = {
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
		} as JobRoleWithRelations;

		const result = mapper.toResponse(jobRole);

		expect(result).toEqual({
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
		});
	});
});
