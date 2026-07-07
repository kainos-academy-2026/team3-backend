import type { JobRoleWithRelations } from "../daos/jobRoleDao.js";
import type { JobRoleResponseDto } from "../dtos/jobRoleDto.js";
import { toJobRoleStatusDto } from "../dtos/jobRoleDto.js";

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
			status: toJobRoleStatusDto(jobRole.status),
		};
	}
}
