import { describe, expect, it } from "vitest";
import type {
	JobRoleApplicationWithUser,
	JobRoleWithRelations,
} from "../../src/daos/jobRoleDao.js";
import { JobRoleApplicationStatusDto } from "../../src/dtos/jobRoleDto.js";
import { JobRoleApplicationMapper } from "../../src/mappers/jobRoleApplicationMapper.js";

describe("JobRoleApplicationMapper", () => {
	it("should map application and signed url to summary dto", () => {
		const mapper = new JobRoleApplicationMapper();
		const application = {
			id: 101,
			userId: 7,
			jobRoleId: 1,
			cvUrl: "job-applications/1/7/abc-cv.pdf",
			status: JobRoleApplicationStatusDto.InProgress,
			appliedAt: new Date("2026-07-01T12:00:00.000Z"),
			user: {
				id: 7,
				email: "candidate@example.com",
			},
		} as JobRoleApplicationWithUser;

		const result = mapper.toApplicationSummary(
			application,
			"https://example.com/download",
		);

		expect(result).toEqual({
			applicationId: 101,
			userId: 7,
			username: "candidate@example.com",
			status: JobRoleApplicationStatusDto.InProgress,
			appliedAt: "2026-07-01T12:00:00.000Z",
			cvDownloadUrl: "https://example.com/download",
		});
	});

	it("should map role and applicants to admin response dto", () => {
		const mapper = new JobRoleApplicationMapper();
		const role = {
			id: 1,
			roleName: "Backend Engineer",
			numberOfOpenPositions: 2,
		} as JobRoleWithRelations;

		const result = mapper.toAdminApplicationsResponse(role, [
			{
				applicationId: 101,
				userId: 7,
				username: "candidate@example.com",
				status: JobRoleApplicationStatusDto.InProgress,
				appliedAt: "2026-07-01T12:00:00.000Z",
				cvDownloadUrl: "https://example.com/download",
			},
		]);

		expect(result).toEqual({
			jobRoleId: 1,
			roleName: "Backend Engineer",
			numberOfOpenPositions: 2,
			applicants: [
				{
					applicationId: 101,
					userId: 7,
					username: "candidate@example.com",
					status: JobRoleApplicationStatusDto.InProgress,
					appliedAt: "2026-07-01T12:00:00.000Z",
					cvDownloadUrl: "https://example.com/download",
				},
			],
		});
	});

	it("should map hire and reject response wrappers", () => {
		const mapper = new JobRoleApplicationMapper();
		const application = {
			applicationId: 101,
			userId: 7,
			username: "candidate@example.com",
			status: JobRoleApplicationStatusDto.Hired,
			appliedAt: "2026-07-01T12:00:00.000Z",
			cvDownloadUrl: "https://example.com/download",
		};

		expect(mapper.toHireResponse(application, 1)).toEqual({
			application,
			numberOfOpenPositions: 1,
		});
		expect(mapper.toRejectResponse(application)).toEqual({
			application,
		});
	});
});
