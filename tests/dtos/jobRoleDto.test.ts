import { describe, expect, it } from "vitest";
import {
	JobRoleStatusDto,
	toJobRoleStatusDto,
} from "../../src/dtos/jobRoleDto.js";

describe("toJobRoleStatusDto", () => {
	it("returns Closed when status is Closed", () => {
		const result = toJobRoleStatusDto("Closed");
		expect(result).toBe(JobRoleStatusDto.Closed);
	});

	it("returns Open when status is Open", () => {
		const result = toJobRoleStatusDto("Open");
		expect(result).toBe(JobRoleStatusDto.Open);
	});

	it("defaults to Open for unknown status", () => {
		const result = toJobRoleStatusDto("AnythingElse");
		expect(result).toBe(JobRoleStatusDto.Open);
	});
});
