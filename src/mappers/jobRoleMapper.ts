import type { JobRole } from "@prisma/client";
import type { JobRoleResponseDto } from "../dtos/jobRoleDto.js";
import { toJobRoleStatusDto } from "../dtos/jobRoleDto.js";

export class JobRoleMapper {
  toResponse(jobRole: JobRole): JobRoleResponseDto {
    return {
      id: jobRole.id,
      roleName: jobRole.roleName,
      location: jobRole.location,
      capability: jobRole.capability,
      band: jobRole.band,
      closingDate: jobRole.closingDate,
      status: toJobRoleStatusDto(jobRole.status),
    };
  }

  toResponseList(jobRoles: JobRole[]): JobRoleResponseDto[] {
    return jobRoles.map((jobRole) => this.toResponse(jobRole));
  }
}