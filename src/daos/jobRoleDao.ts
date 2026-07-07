import type { Prisma } from "@prisma/client";
import prisma from "../prismaClient.js";

export type JobRoleWithRelations = Prisma.JobRoleGetPayload<{
  include: { capability: true; band: true };
}>;

export class JobRoleDao {
	async findAllJobRoles(): Promise<JobRoleWithRelations[]> {
		return prisma.jobRole.findMany({
			include: {
				capability: true,
				band: true,
			}
		});
	}
}
