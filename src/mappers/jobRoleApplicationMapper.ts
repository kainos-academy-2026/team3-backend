import type {
	JobRoleApplicationWithUser,
	JobRoleWithRelations,
} from "../daos/jobRoleDao.js";
import type {
	JobRoleApplicationHireResponseDto,
	JobRoleApplicationRejectResponseDto,
	JobRoleApplicationStatusDto,
	JobRoleApplicationSummaryDto,
	JobRoleApplicationsAdminResponseDto,
} from "../dtos/jobRoleDto.js";

export class JobRoleApplicationMapper {
	toApplicationSummary(
		application: JobRoleApplicationWithUser,
		cvDownloadUrl: string,
	): JobRoleApplicationSummaryDto {
		return {
			applicationId: application.id,
			userId: application.userId,
			username: application.user.email,
			status: application.status as JobRoleApplicationStatusDto,
			appliedAt: application.appliedAt.toISOString(),
			cvDownloadUrl,
		};
	}

	toAdminApplicationsResponse(
		jobRole: JobRoleWithRelations,
		applicants: JobRoleApplicationSummaryDto[],
	): JobRoleApplicationsAdminResponseDto {
		return {
			jobRoleId: jobRole.id,
			roleName: jobRole.roleName,
			numberOfOpenPositions: jobRole.numberOfOpenPositions,
			applicants,
		};
	}

	toHireResponse(
		application: JobRoleApplicationSummaryDto,
		numberOfOpenPositions: number,
	): JobRoleApplicationHireResponseDto {
		return {
			application,
			numberOfOpenPositions,
		};
	}

	toRejectResponse(
		application: JobRoleApplicationSummaryDto,
	): JobRoleApplicationRejectResponseDto {
		return {
			application,
		};
	}
}
