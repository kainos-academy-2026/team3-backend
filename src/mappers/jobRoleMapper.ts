import type { JobRoleResponseDto } from "../dtos/jobRoleDto.js";
import { toJobRoleStatusDto } from "../dtos/jobRoleDto.js";
import { JobRoleWithRelations } from "../daos/jobRoleDao.js";



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
      closingDate: jobRole.closingDate,
      status: toJobRoleStatusDto(jobRole.status),
    };
  }
}