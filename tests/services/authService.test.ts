import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthDao } from "../../src/daos/authDao.js";
import { AuthService } from "../../src/services/authService.js";
import type PasswordService from "../../src/services/passwordService.js";
import type TokenService from "../../src/services/tokenService.js";

const mockDao = {
	findUserByEmail: vi.fn(),
};

const mockPasswordService = {
	hashPassword: vi.fn(),
	comparePasswords: vi.fn(),
};

const mockTokenService = {
	create: vi.fn(),
	verify: vi.fn(),
};

describe("AuthService", () => {
	let service: AuthService;

	beforeEach(() => {
		vi.clearAllMocks();

		service = new AuthService(
			mockDao as unknown as AuthDao,
			mockPasswordService as unknown as PasswordService,
			mockTokenService as unknown as TokenService,
		);
	});

	describe("login", () => {
		it("should throw when user email not found", async () => {
			mockDao.findUserByEmail.mockResolvedValue(null);

			await expect(
				service.login({ email: "test@example.com", password: "password123" }),
			).rejects.toThrow("Invalid credentials");
		});

		it("should throw when password does not match", async () => {
			mockDao.findUserByEmail.mockResolvedValue({
				id: 1,
				email: "test@example.com",
				passwordHash: "hashedpassword",
			});

			mockPasswordService.comparePasswords.mockResolvedValue(false);

			await expect(
				service.login({ email: "test@example.com", password: "wrongpassword" }),
			).rejects.toThrow("Invalid credentials");
		});

		it("should return token when credentials are valid", async () => {
			const mockUser = {
				id: 1,
				email: "test@example.com",
				passwordHash: "hashedpassword",
			};

			mockDao.findUserByEmail.mockResolvedValue(mockUser);
			mockPasswordService.comparePasswords.mockResolvedValue(true);
			mockTokenService.create.mockResolvedValue("mocked-jwt-token");

			const token = await service.login({
				email: "test@example.com",
				password: "password123",
			});

			expect(token).toBe("mocked-jwt-token");
			expect(mockTokenService.create).toHaveBeenCalledWith(mockUser);
		});

		it("should call comparePasswords with correct arguments", async () => {
			mockDao.findUserByEmail.mockResolvedValue({
				id: 1,
				email: "test@example.com",
				passwordHash: "hashedpassword",
			});

			mockPasswordService.comparePasswords.mockResolvedValue(true);
			mockTokenService.create.mockResolvedValue("token");

			await service.login({
				email: "test@example.com",
				password: "password123",
			});

			expect(mockPasswordService.comparePasswords).toHaveBeenCalledWith(
				"password123",
				"hashedpassword",
			);
		});
	});
});
