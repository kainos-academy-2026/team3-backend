import type { Request, Response } from "express";
import type { LoginRequestDto } from "../dtos/authDto.js";
import type { RegisterRequestDto } from "../dtos/registerDto.js";
import { EmailAlreadyExistsError, InvalidCredentialsError } from "../errors/InvalidCredentialsErrors.js";
import type { AuthService } from "../services/authService.js";

export class AuthController {
	constructor(private readonly authService: AuthService) {}

	async login(req: Request, res: Response): Promise<void> {
		try {
			const dto = req.body as LoginRequestDto;
			const token = await this.authService.login(dto);

			res.status(200).json({ token, message: "Login successful" });
		} catch (error) {
			if (error instanceof InvalidCredentialsError) {
				res.status(401).json({ error: "Invalid credentials" });
				return;
			}
			res.status(500).json({ error: "Internal server error" });
		}
	}

	logout(_req: Request, res: Response): void {
		res.clearCookie("token");
		res.status(200).json({ message: "Logged out" });
	}

	async register(req: Request, res: Response): Promise<void> {
		try {
			const dto = req.body as RegisterRequestDto;
			await this.authService.register(dto);
			res.status(201).json({ message: "User registered successfully" });
		} catch (error) {
			if (error instanceof EmailAlreadyExistsError) {
				res.status(409).json({ error: "Email already exists" });
				return;
			}
			res.status(500).json({ error: "Internal server error" });
		}
	}
}
