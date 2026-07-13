import type { AuthDao } from "../daos/authDao.js";
import type { LoginRequestDto} from "../dtos/authDto.js";
import type { RegisterRequestDto } from "../dtos/registerDto.js";
import { EmailAlreadyExistsError, InvalidCredentialsError } from "../errors/InvalidCredentialsErrors.js";
import type PasswordService from "./passwordService.js";
import type TokenService from "./tokenService.js";

export class AuthService {
	constructor(
		private readonly authDao: AuthDao,
		private readonly passwordService: PasswordService,
		private readonly tokenService: TokenService,
	) { }

	async login(dto: LoginRequestDto): Promise<string> {
		const user = await this.authDao.findUserByEmail(dto.email);
		if (!user) {
			throw new InvalidCredentialsError();
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

	async register(dto: RegisterRequestDto): Promise<void> {
		const existing = await this.authDao.findUserByEmail(dto.email);
		if (existing) {
			throw new EmailAlreadyExistsError();
		}

		const passwordHash = await this.passwordService.hashPassword(dto.password);
		await this.authDao.createUser(dto.email, passwordHash);
	}
}
