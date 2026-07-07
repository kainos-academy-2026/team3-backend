import type { JobRole } from "@prisma/client";
import { JobRoleDao } from "../daos/jobRoleDao.js";

export class JobRoleService {
  constructor(private readonly jobRoleDao: JobRoleDao = new JobRoleDao()) {}

  async findAllJobRoles(): Promise<JobRole[]> {
    return this.jobRoleDao.findAllJobRoles();
  }
}
