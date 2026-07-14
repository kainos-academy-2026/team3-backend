import type { User, UserRole } from "@prisma/client";
import type { AuthTokenPayload } from "./authTokenPayload.js";


export default interface TokenService {
	create(user: User): Promise<string>;
	verify(token: string): Promise<AuthTokenPayload | null>;
}
