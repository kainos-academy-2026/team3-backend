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
			},
		});
	}

	async findJobRoleById(id: number): Promise<JobRoleWithRelations | null> {
		return prisma.jobRole.findUnique({
			where: { id },
			include: {
				capability: true,
				band: true,
			},
		});
	}
}
