import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import type TokenService from "./tokenService.js";
import type { AuthTokenPayload } from "./authTokenPayload.js";

export class JwtTokenService implements TokenService {
	async create(user: User): Promise<string> {
		const secret = process.env.JWT_SECRET as string;
		return jwt.sign({ userId: user.id, email: user.email, role: user.role }, secret, {
			expiresIn: "1h",
		});
	}

	async verify(token: string): Promise<AuthTokenPayload | null> {
		try {
			const secret = process.env.JWT_SECRET as string;
			const decoded = jwt.verify(token, secret) as AuthTokenPayload;

			if (
				typeof decoded.userId !== "number" ||
				typeof decoded.email !== "string" ||
				typeof decoded.role !== "string"
			) {
				return null;
			}
			return {
				userId: decoded.userId,
				email: decoded.email,
				role: decoded.role,
			};
		} catch {
			return null;
		}
	}
}
