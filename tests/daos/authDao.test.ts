import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthDao } from "../../src/daos/authDao.js";

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		user: {
			findUnique: vi.fn(),
		},
	},
}));

import prisma from "../../src/prismaClient.js";

const mockPrisma = prisma as unknown as {
	user: { findUnique: ReturnType<typeof vi.fn> };
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
});
