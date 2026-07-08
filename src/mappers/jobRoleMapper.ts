import type { JobRoleWithRelations } from "../daos/jobRoleDao.js";
import {
	JobRoleStatusDto,
	type JobRoleResponseDto,
} from "../dtos/jobRoleDto.js";

export class JobRoleMapper {
	toResponse(jobRole: JobRoleWithRelations): JobRoleResponseDto {
		return {
			id: jobRole.id,
			roleName: jobRole.roleName,
			location: jobRole.location,
			capability: {
				capabilityId: jobRole.capabilityId,
				capabilityName: jobRole.capability.capabilityName,
			},
			band: {
				bandId: jobRole.bandId,
				bandName: jobRole.band.bandName,
			},
			closingDate: jobRole.closingDate.toISOString().split("T")[0],
			status: this.toJobRoleStatusDto(jobRole.status),
		};
	}

	private toJobRoleStatusDto(status: string): JobRoleStatusDto {
		if (status === JobRoleStatusDto.Closed) {
			return JobRoleStatusDto.Closed;
		}

		return JobRoleStatusDto.Open;
	}
}
