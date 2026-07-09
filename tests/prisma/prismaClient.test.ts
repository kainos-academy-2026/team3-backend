import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@prisma/adapter-pg", () => ({
	PrismaPg: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
	PrismaClient: vi.fn(),
}));

describe("prismaClient", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("should throw error when DATABASE_URL is not set", async () => {
		vi.stubEnv("DATABASE_URL", "");

		await expect(async () => {
			await import("../../src/prismaClient.js");
		}).rejects.toThrow("DATABASE_URL is not set");

		vi.unstubAllEnvs();
	});

	it("should successfully create prisma client when DATABASE_URL is set", async () => {
		vi.stubEnv("DATABASE_URL", "postgresql://localhost/test");

		const { default: prisma } = await import("../../src/prismaClient.js");

		expect(prisma).toBeDefined();

		vi.unstubAllEnvs();
	});
});
