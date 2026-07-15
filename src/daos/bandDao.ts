import type { Band } from "@prisma/client";
import prisma from "../prismaClient.js";

export class BandDao {
	async findAllBands(): Promise<Band[]> {
		return prisma.band.findMany({
			orderBy: {
				bandName: "asc",
			},
		});
	}

	async findBandById(bandId: number): Promise<Band | null> {
		return prisma.band.findUnique({
			where: { bandId },
		});
	}
}