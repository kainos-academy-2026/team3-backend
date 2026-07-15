import type { UserRole } from "@prisma/client";

export interface AuthTokenPayload {
	userId: number;
	email: string;
	role: UserRole;
}
