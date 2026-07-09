import type { User } from "@prisma/client";

export class AuthDao {
	async findUserByEmail(email: string): Promise<User | null> {
		const { default: prisma } = await import("../prismaClient.js");
		return prisma.user.findUnique({ where: { email } });
	}
}
