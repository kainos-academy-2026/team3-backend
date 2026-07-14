import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JwtTokenService } from "../../src/services/jwtTokenService.js";

vi.mock("jsonwebtoken", () => ({
	default: {
		sign: vi.fn(),
		verify: vi.fn(),
	},
}));

import jwt from "jsonwebtoken";

describe("JwtTokenService", () => {
	let service: JwtTokenService;

	const mockUser: User = {
		id: 1,
		email: "test@example.com",
		passwordHash: "hashedpassword",
		role: "USER",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		service = new JwtTokenService();
	});

	describe("create", () => {
		it("should return a signed JWT token", async () => {
			vi.stubEnv("JWT_SECRET", "test-secret");
			vi.mocked(jwt.sign).mockReturnValue("signed-token" as never);

			const token = await service.create(mockUser);

			expect(token).toBe("signed-token");
			expect(jwt.sign).toHaveBeenCalledWith(
				{ userId: mockUser.id, email: mockUser.email, role: mockUser.role },
				"test-secret",
				{ expiresIn: "1h" },
			);

			vi.unstubAllEnvs();
		});
	});

	describe("verify", () => {
		it("should return token payload when token is valid", async () => {
			vi.stubEnv("JWT_SECRET", "test-secret");
			vi.mocked(jwt.verify).mockReturnValue({
				userId: 1,
				email: "test@example.com",
				role: "USER",
			} as never);

			const result = await service.verify("valid-token");

			expect(result).toEqual({
				userId: 1,
				email: "test@example.com",
				role: "USER",
			});
			vi.unstubAllEnvs();
		});

		it("should return null when token is invalid", async () => {
			vi.stubEnv("JWT_SECRET", "test-secret");
			vi.mocked(jwt.verify).mockImplementation(() => {
				throw new Error("invalid");
			});

			const result = await service.verify("bad-token");

			expect(result).toBeNull();
			vi.unstubAllEnvs();
		});

		it("should return null when JWT_SECRET is not set", async () => {
			vi.stubEnv("JWT_SECRET", "");

			const result = await service.verify("any-token");

			expect(result).toBeNull();
			vi.unstubAllEnvs();
		});
	});
});
