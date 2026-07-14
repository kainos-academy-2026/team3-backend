import type { User, UserRole } from "@prisma/client";
import type { AuthTokenPayload } from "./tokenService.js";

export interface AuthTokenPayload {
    userId: number;
    email: string;
    role: UserRole;
}