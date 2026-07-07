import type { JobRole } from "@prisma/client";
import prisma from "../prismaClient.js";

export class JobRoleService {
  async findAllJobRoles(): Promise<JobRole[]> {
    return prisma.jobRole.findMany();
  }
}
