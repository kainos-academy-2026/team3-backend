import type { AuthDao } from "../daos/authDao.js";
import type { LoginRequestDto } from "../dtos/authDto.js";
import type PasswordService from "./passwordService.js";
import type TokenService from "./tokenService.js";

export class AuthService {
	constructor(
		private readonly authDao: AuthDao,
		private readonly passwordService: PasswordService,
		private readonly tokenService: TokenService,
	) {}

	async login(dto: LoginRequestDto): Promise<string> {
		const user = await this.authDao.findUserByEmail(dto.email);
		if (!user) {
			throw new Error("Invalid credentials");
		}

		const passwordMatch = await this.passwordService.comparePasswords(
			dto.password,
			user.passwordHash,
		);
		if (!passwordMatch) {
			throw new Error("Invalid credentials");
		}

		const token = await this.tokenService.create(user);

		return token;
	}
}
