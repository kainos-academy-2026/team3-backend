import type { Capability } from "@prisma/client";
import prisma from "../prismaClient.js";

export class CapabilityDao {
	async findAllCapabilities(): Promise<Capability[]> {
		return prisma.capability.findMany({
			orderBy: {
				capabilityName: "asc",
			},
		});
	}

	async findCapabilityById(capabilityId: number): Promise<Capability | null> {
		return prisma.capability.findUnique({
			where: { capabilityId },
		});
	}
}
