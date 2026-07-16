import type { Band, Capability, Prisma } from "@prisma/client";
import {
	JobRoleApplicationStatusDto,
	JobRoleStatusDto,
} from "../dtos/jobRoleDto.js";
import type { UpdateJobRoleData } from "../models/updateJobRoleData.js";
import prisma from "../prismaClient.js";

export type JobRoleWithRelations = Prisma.JobRoleGetPayload<{
	include: { capability: true; band: true };
}>;

export class JobRoleDao {
	async findAllJobRoles(): Promise<JobRoleWithRelations[]> {
		return prisma.jobRole.findMany({
			orderBy: {
				id: "desc",
			},
			include: {
				capability: true,
				band: true,
			},
		});
	}

	async findPaginatedJobRoles(
		limit: number,
		page: number,
	): Promise<JobRoleWithRelations[]> {
		const skip = (page - 1) * limit;

		return prisma.jobRole.findMany({
			skip,
			take: limit,
			orderBy: {
				id: "desc",
			},
			include: {
				capability: true,
				band: true,
			},
		});
	}

	async countJobRoles(): Promise<number> {
		return prisma.jobRole.count();
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

	async findCapabilityById(capabilityId: number): Promise<Capability | null> {
		return prisma.capability.findUnique({
			where: { capabilityId },
		});
	}

	async findBandById(bandId: number): Promise<Band | null> {
		return prisma.band.findUnique({
			where: { bandId },
		});
	}

	async updateJobRole(
		id: number,
		data: UpdateJobRoleData,
	): Promise<JobRoleWithRelations> {
		return prisma.jobRole.update({
			where: { id },
			data,
			include: {
				capability: true,
				band: true,
			},
		});
	}

	async deleteJobRoleById(id: number): Promise<void> {
		await prisma.jobRole.delete({
			where: { id },
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
