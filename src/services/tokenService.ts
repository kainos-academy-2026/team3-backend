import type { User, UserRole } from "@prisma/client";

export interface AuthTokenPayload {
	userId: number;
	email: string;
	role: UserRole;
}

export default interface TokenService {
	create(user: User): Promise<string>;
	verify(token: string): Promise<AuthTokenPayload | null>;
}
