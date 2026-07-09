import type { Request, Response } from "express";
import type { LoginRequestDto } from "../dtos/authDto.js";
import type { AuthService } from "../services/authService.js";

export class AuthController {
	constructor(private readonly authService: AuthService) {}

	async login(req: Request, res: Response): Promise<void> {
		try {
			const dto = req.body as LoginRequestDto;
			const token = await this.authService.login(dto);

			res.cookie("token", token, {
				httpOnly: true, // JS on the page cannot read this cookie
				secure: false, // set to true in production (requires HTTPS)
				sameSite: "strict",
			});

			res.status(200).json({ message: "Login successful" });
		} catch (_error) {
			res.status(401).json({ error: "Invalid credentials" });
		}
	}

	logout(_req: Request, res: Response): void {
		res.clearCookie("token");
		res.status(200).json({ message: "Logged out" });
	}
}
