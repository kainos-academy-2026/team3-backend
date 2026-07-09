import { beforeEach, describe, expect, it, vi } from "vitest";
import { Argon2PasswordService } from "../../src/services/argon2PasswordService.js";

vi.mock("argon2", () => ({
	default: {
		hash: vi.fn(),
		verify: vi.fn(),
	},
}));

import argon2 from "argon2";

describe("Argon2PasswordService", () => {
	let service: Argon2PasswordService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new Argon2PasswordService();
	});

	describe("hashPassword", () => {
		it("should return a hashed password", async () => {
			vi.mocked(argon2.hash).mockResolvedValue("hashedpassword");

			const result = await service.hashPassword("password123");

			expect(result).toBe("hashedpassword");
			expect(argon2.hash).toHaveBeenCalledWith("password123");
		});
	});

	describe("comparePasswords", () => {
		it("should return true when passwords match", async () => {
			vi.mocked(argon2.verify).mockResolvedValue(true);

			const result = await service.comparePasswords(
				"password123",
				"hashedpassword",
			);

			expect(result).toBe(true);
			expect(argon2.verify).toHaveBeenCalledWith(
				"hashedpassword",
				"password123",
			);
		});

		it("should return false when passwords do not match", async () => {
			vi.mocked(argon2.verify).mockResolvedValue(false);

			const result = await service.comparePasswords(
				"wrongpassword",
				"hashedpassword",
			);

			expect(result).toBe(false);
		});
	});
});
