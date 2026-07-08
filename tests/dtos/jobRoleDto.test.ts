import { describe, expect, it } from "vitest";
import { JobRoleStatusDto } from "../../src/dtos/jobRoleDto.js";

describe("JobRoleStatusDto", () => {
	it("has the expected Open value", () => {
		expect(JobRoleStatusDto.Open).toBe("Open");
	});

	it("has the expected Closed value", () => {
		expect(JobRoleStatusDto.Closed).toBe("Closed");
	});
});
