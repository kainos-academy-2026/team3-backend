import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import type TokenService from "./tokenService.js";

export class JwtTokenService implements TokenService {
	async create(user: User): Promise<string> {
		const secret = process.env.JWT_SECRET as string;
		return jwt.sign({ userId: user.id, email: user.email }, secret, {
			expiresIn: "1h",
		});
	}

	async verify(token: string): Promise<boolean> {
		try {
			const secret = process.env.JWT_SECRET as string;
			jwt.verify(token, secret);
			return true;
		} catch {
			return false;
		}
	}
}
