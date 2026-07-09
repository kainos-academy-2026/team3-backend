import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { AuthDao } from "../daos/authDao.js";
import type { LoginRequestDto } from "../dtos/authDto.js";

export class AuthService {
	constructor(private readonly authDao: AuthDao) {}

	async login(dto: LoginRequestDto): Promise<string> {
		const user = await this.authDao.findUserByEmail(dto.email);

		// Use a generic error message — never tell the user which part was wrong
		if (!user) {
			throw new Error("Invalid credentials");
		}

		const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

		if (!passwordMatch) {
			throw new Error("Invalid credentials");
		}

		const token = jwt.sign(
			{ userId: user.id, email: user.email },
			process.env.JWT_SECRET as string,
			{ expiresIn: "1h" },
		);

		return token;
	}
}
