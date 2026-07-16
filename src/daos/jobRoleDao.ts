import type { Prisma } from "@prisma/client";
import {
	JobRoleApplicationStatusDto,
	JobRoleStatusDto,
} from "../dtos/jobRoleDto.js";
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

	async createJobRole(data: {
		roleName: string;
		location: string;
		capabilityId: number;
		bandId: number;
		closingDate: Date;
		description: string;
		responsibilities: string;
		sharepointUrl: string;
		numberOfOpenPositions: number;
	}): Promise<JobRoleWithRelations> {
		return prisma.jobRole.create({
			data: {
				...data,
				status: JobRoleStatusDto.Open,
			},
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

	async createApplication(
		userId: number,
		jobRoleId: number,
		cvUrl: string,
	): Promise<void> {
		await prisma.application.create({
			data: {
				userId,
				jobRoleId,
				cvUrl,
				status: JobRoleApplicationStatusDto.InProgress,
			},
		});
	}
}
