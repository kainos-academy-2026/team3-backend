import type { Application } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		jobRole: {
			findMany: vi.fn(),
		},
	},
}));

let app: Application;

beforeAll(async () => {
	process.env.JWT_SECRET = "test-secret";
	process.env.AWS_REGION = "eu-west-1";
	process.env.S3_BUCKET_NAME = "test-bucket";
	app = (await import("../../src/app.js")).default;
});

describe("GET /health", () => {
	it("should return 200 with status UP", async () => {
		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("UP");
	});

	it("should include a timestamp in the response", async () => {
		const response = await request(app).get("/health");

		expect(response.body.timestamp).toBeDefined();
		expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
	});
});

describe("GET /unknown", () => {
	it("should return 404 for an unknown route", async () => {
		const response = await request(app).get("/unknown");

		expect(response.status).toBe(404);
	});
});
