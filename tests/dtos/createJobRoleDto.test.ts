import { describe, expect, it } from "vitest";
import { CreateJobRoleRequestSchema } from "../../src/dtos/createJobRoleDto.js";

describe("CreateJobRoleRequestSchema", () => {
	const validPayload = {
		roleName: "Senior Backend Engineer",
		location: "Dublin",
		capabilityId: 1,
		bandId: 2,
		closingDate: "2026-08-31",
		description: "Own backend services and integrations.",
		responsibilities: "Build APIs, review code, support delivery.",
		sharepointUrl: "https://example.sharepoint.com/job-role",
		numberOfOpenPositions: 2,
	};

	it("accepts a valid payload", () => {
		const result = CreateJobRoleRequestSchema.safeParse(validPayload);

		expect(result.success).toBe(true);
	});

	it("rejects missing roleName", () => {
		const result = CreateJobRoleRequestSchema.safeParse({
			...validPayload,
			roleName: "",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe("Role name is required");
	});

	it("rejects non-positive capabilityId", () => {
		const result = CreateJobRoleRequestSchema.safeParse({
			...validPayload,
			capabilityId: 0,
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe("Capability is required");
	});

	it("rejects non-positive bandId", () => {
		const result = CreateJobRoleRequestSchema.safeParse({
			...validPayload,
			bandId: -1,
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe("Band is required");
	});

	it("rejects invalid closingDate", () => {
		const result = CreateJobRoleRequestSchema.safeParse({
			...validPayload,
			closingDate: "not-a-date",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe("Closing date must be valid");
	});

	it("rejects invalid sharepointUrl", () => {
		const result = CreateJobRoleRequestSchema.safeParse({
			...validPayload,
			sharepointUrl: "invalid-url",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"SharePoint URL must be a valid URL",
		);
	});

	it("rejects non-positive numberOfOpenPositions", () => {
		const result = CreateJobRoleRequestSchema.safeParse({
			...validPayload,
			numberOfOpenPositions: 0,
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"Number of open positions must be greater than 0",
		);
	});
});
