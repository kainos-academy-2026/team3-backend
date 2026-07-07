import type { Request, Response } from "express";
import type { JobRoleResponseDto } from "../dtos/jobRoleDto.js";
import { toJobRoleStatusDto } from "../dtos/jobRoleDto.js";
import type { JobRoleService } from "../services/jobRoleService.js";

export class JobRoleController {
  constructor(
    private readonly jobRoleService: JobRoleService,
  ) {}

  async getAllJobRoles(_req: Request, res: Response): Promise<void> {
    try {
      const jobRoles = await this.jobRoleService.findAllJobRoles();
      const response: JobRoleResponseDto[] = jobRoles.map((jobRole) => ({
        id: jobRole.id,
        roleName: jobRole.roleName,
        location: jobRole.location,
        capability: jobRole.capability,
        band: jobRole.band,
        closingDate: jobRole.closingDate,
        status: toJobRoleStatusDto(jobRole.status),
      }));

      res.status(200).json(response);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
