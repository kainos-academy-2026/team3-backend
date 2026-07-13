import type { User } from "@prisma/client";
import { default as prisma } from "../prismaClient.js";

export class AuthDao {
	async findUserByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({ where: { email } });
	}

	async createUser(email: string, passwordHash: string): Promise<User> {
		return prisma.user.create({
			data: {email, passwordHash},
		});
		}
}
