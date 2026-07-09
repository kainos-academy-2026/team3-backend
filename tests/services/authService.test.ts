import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthDao } from "../../src/daos/authDao.js";
import { AuthService } from "../../src/services/authService.js";

vi.mock("bcrypt");
vi.mock("jsonwebtoken");

const mockDao = {
	findUserByEmail: vi.fn(),
};

describe("AuthService", () => {
	let service: AuthService;
	let authDao: Pick<AuthDao, "findUserByEmail">;

	beforeEach(() => {
		vi.clearAllMocks();

		authDao = {
			findUserByEmail: mockDao.findUserByEmail,
		};

		service = new AuthService(authDao as AuthDao);
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

			vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

			await expect(
				service.login({ email: "test@example.com", password: "wrongpassword" }),
			).rejects.toThrow("Invalid credentials");
		});

		it("should return JWT token when credentials are valid", async () => {
			const mockUser = {
				id: 1,
				email: "test@example.com",
				passwordHash: "hashedpassword",
			};

			mockDao.findUserByEmail.mockResolvedValue(mockUser);
			vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

			const mockToken = "mocked-jwt-token";
			vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

			vi.stubEnv("JWT_SECRET", "test-secret");

			const token = await service.login({
				email: "test@example.com",
				password: "password123",
			});

			expect(token).toBe(mockToken);
			expect(jwt.sign).toHaveBeenCalledWith(
				{ userId: mockUser.id, email: mockUser.email },
				"test-secret",
				{ expiresIn: "1h" },
			);

			vi.unstubAllEnvs();

		it("should call bcrypt.compare with correct arguments", async () => {
			const mockUser = {
				id: 1,
				email: "test@example.com",
				passwordHash: "hashedpassword",
			};

			mockDao.findUserByEmail.mockResolvedValue(mockUser);
			vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
			vi.mocked(jwt.sign).mockReturnValue("token" as never);

			vi.stubEnv("JWT_SECRET", "test-secret");

			await service.login({
				email: "test@example.com",
				password: "password123",
			});

			expect(bcrypt.compare).toHaveBeenCalledWith(
				"password123",
				"hashedpassword",
			);

			vi.unstubAllEnvs();
	});
});
