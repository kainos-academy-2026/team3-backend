import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "../../src/controllers/authController.js";
import {
	EmailAlreadyExistsError,
	InvalidCredentialsError,
} from "../../src/errors/InvalidCredentialsErrors.js";
import type { AuthService } from "../../src/services/authService.js";

const mockService = {
	login: vi.fn(),
	register: vi.fn(),
};

describe("AuthController", () => {
	let controller: AuthController;
	let authService: Pick<AuthService, "login" | "register">;
	let req: Partial<Request>;
	let res: Partial<Response>;

	beforeEach(() => {
		vi.clearAllMocks();

		authService = {
			login: mockService.login,
			register: mockService.register,
		};

		controller = new AuthController(authService as AuthService);

		req = {
			body: {},
		};

		res = {
			cookie: vi.fn().mockReturnThis(),
			clearCookie: vi.fn().mockReturnThis(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
	});

	describe("login", () => {
		it("should return 200 and set token cookie on successful login", async () => {
			mockService.login.mockResolvedValue("jwt-token-here");
			req.body = { email: "test@example.com", password: "password123" };

			await controller.login(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				token: "jwt-token-here",
				message: "Login successful",
			});
		});

		it("should return 401 when login fails", async () => {
			mockService.login.mockRejectedValue(new InvalidCredentialsError());
			req.body = { email: "test@example.com", password: "wrongpassword" };

			await controller.login(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
		});

		it("should return 500 when an unexpected error occurs", async () => {
			mockService.login.mockRejectedValue(new Error("Unexpected error"));
			req.body = { email: "test@example.com", password: "password123" };

			await controller.login(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
		});
	});

	describe("logout", () => {
		it("should clear the token cookie and return 200", () => {
			controller.logout(req as Request, res as Response);

			expect(res.clearCookie).toHaveBeenCalledWith("token");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: "Logged out" });
		});
	});

	describe("register", () => {
		it("should return 201 on successful registration", async () => {
			mockService.register.mockResolvedValue(undefined);
			req.body = { email: "new@example.com", password: "Strong@Pass1" };

			await controller.register(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({
				message: "User registered successfully",
			});
		});

		it("should return 409 when email already exists", async () => {
			mockService.register.mockRejectedValue(new EmailAlreadyExistsError());
			req.body = { email: "existing@example.com", password: "Strong@Pass1" };

			await controller.register(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({ error: "Email already exists" });
		});

		it("should return 500 when an unexpected error occurs", async () => {
			mockService.register.mockRejectedValue(new Error("Unexpected error"));
			req.body = { email: "x@example.com", password: "Strong@Pass1" };

			await controller.register(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
		});
	});
});
