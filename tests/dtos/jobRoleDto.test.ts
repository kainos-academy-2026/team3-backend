import { describe, expect, it } from "vitest";
import { JobRoleStatusDto } from "../../src/dtos/jobRoleDto.js";
import { UpdateJobRoleRequestSchema } from "../../src/dtos/updateJobRoleDto.js";

describe("JobRoleStatusDto", () => {
	it("has the expected Open value", () => {
		expect(JobRoleStatusDto.Open).toBe("Open");
	});

	it("has the expected Closed value", () => {
		expect(JobRoleStatusDto.Closed).toBe("Closed");
	});
});

describe("UpdateJobRoleRequestSchema", () => {
	it("accepts a valid partial payload", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			roleName: "Senior Backend Engineer",
		});

		expect(result.success).toBe(true);
	});

	it("accepts a valid full payload", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capabilityId: 1,
			bandId: 2,
			closingDate: "2026-08-31",
			status: JobRoleStatusDto.Open,
			description: "Own backend services and integrations.",
			responsibilities: "Build APIs, review code, support delivery.",
			sharepointUrl: "https://example.sharepoint.com/job-role",
			numberOfOpenPositions: 2,
		});

		expect(result.success).toBe(true);
	});

	it("rejects an empty payload", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"At least one editable field must be provided",
			);
		}
	});

	it("rejects invalid status", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			status: "Paused",
		});

		expect(result.success).toBe(false);
	});

	it("rejects non-positive capabilityId", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			capabilityId: 0,
		});

		expect(result.success).toBe(false);
	});

	it("rejects non-positive bandId", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			bandId: -1,
		});

		expect(result.success).toBe(false);
	});

	it("rejects invalid closingDate", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			closingDate: "not-a-date",
		});

		expect(result.success).toBe(false);
	});

	it("rejects invalid sharepointUrl", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			sharepointUrl: "not-a-url",
		});

		expect(result.success).toBe(false);
	});

	it("rejects non-positive numberOfOpenPositions", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			numberOfOpenPositions: 0,
		});

		expect(result.success).toBe(false);
	});
});
