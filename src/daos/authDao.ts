import type { User } from "@prisma/client";
import prisma from "../prismaClient.js";

export class AuthDao {
	async findUserByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({ where: { email } });
	}
}
