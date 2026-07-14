import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findUnique: vi.fn(),
	create: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		user: {
			findUnique: mocks.findUnique,
			create: mocks.create,
		},
	},
}));

import { AuthDao } from "../../src/daos/authDao.js";

const mockPrisma = {
	user: { findUnique: mocks.findUnique, create: mocks.create },
};

describe("AuthDao", () => {
	let authDao: AuthDao;

	beforeEach(() => {
		vi.clearAllMocks();
		authDao = new AuthDao();
	});

	describe("findUserByEmail", () => {
		it("should return a user when found", async () => {
			const mockUser: User = {
				id: 1,
				email: "test@example.com",
				passwordHash: "hashedpassword",
				role: "USER",
			};

			mockPrisma.user.findUnique.mockResolvedValue(mockUser);

			const result = await authDao.findUserByEmail("test@example.com");

			expect(result).toEqual(mockUser);
			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { email: "test@example.com" },
			});
		});

		it("should return null when user not found", async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null);

			const result = await authDao.findUserByEmail("nonexistent@example.com");

			expect(result).toBeNull();
		});
	});

	describe("createUser", () => {
		it("should create and return a user", async () => {
			const mockCreatedUser = {
				id: 2,
				email: "new@example.com",
				passwordHash: "hashed-pass",
				role: "USER",
			};

			mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

			const result = await authDao.createUser("new@example.com", "hashed-pass");

			expect(result).toEqual(mockCreatedUser);
			expect(mockPrisma.user.create).toHaveBeenCalledWith({
				data: { email: "new@example.com", passwordHash: "hashed-pass" },
			});
		});
	});
});
