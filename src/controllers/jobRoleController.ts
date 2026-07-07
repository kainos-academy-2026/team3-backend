import type { Request, Response } from "express";
import type { JobRoleResponseDto } from "../dtos/jobRoleDto.js";
import { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import { JobRoleService } from "../services/jobRoleService.js";

export class JobRoleController {
  constructor(
    private readonly jobRoleService: JobRoleService = new JobRoleService(),
    private readonly jobRoleMapper: JobRoleMapper = new JobRoleMapper()
  ) {}

  async getAllJobRoles(_req: Request, res: Response): Promise<void> {
    try {
      const jobRoles = await this.jobRoleService.findAllJobRoles();
      const response: JobRoleResponseDto[] = this.jobRoleMapper.toResponseList(jobRoles);

      res.status(200).json(response);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
