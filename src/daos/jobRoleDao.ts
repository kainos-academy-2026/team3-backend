import type { JobRole } from "@prisma/client";
import prisma from "../prismaClient.js";

export class JobRoleDao {
	async findAllJobRoles(): Promise<JobRole[]> {
		return prisma.jobRole.findMany();
	}
}
