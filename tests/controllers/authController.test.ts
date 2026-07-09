import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "../../src/controllers/authController.js";
import type { AuthService } from "../../src/services/authService.js";

const mockService = {
	login: vi.fn(),
};

describe("AuthController", () => {
	let controller: AuthController;
	let authService: Pick<AuthService, "login">;
	let req: Partial<Request>;
	let res: Partial<Response>;

	beforeEach(() => {
		vi.clearAllMocks();

		authService = {
			login: mockService.login,
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

			expect(res.cookie).toHaveBeenCalledWith("token", "jwt-token-here", {
				httpOnly: true,
				secure: false,
				sameSite: "strict",
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: "Login successful" });
		});

		it("should return 401 when login fails", async () => {
			mockService.login.mockRejectedValue(new Error("Invalid credentials"));
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
});
