// This test verifies that S3Service can generate a valid presigned upload URL and correctly formatted S3 key in a real Ministack-backed environment.
import { createConnection } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { S3Service } from "../../src/services/s3Service.js";

const integrationEnv = {
	AWS_REGION: "us-east-1",
	S3_BUCKET_NAME: "test-bucket",
	AWS_ACCESS_KEY_ID: "test",
	AWS_SECRET_ACCESS_KEY: "test",
} as const;

const originalEnv: Partial<Record<keyof typeof integrationEnv, string>> = {};

async function assertMinistackReachable(): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const socket = createConnection({ host: "127.0.0.1", port: 4566 });

		socket.once("connect", () => {
			socket.end();
			resolve();
		});

		socket.once("error", () => {
			reject(
				new Error(
					"Ministack is not reachable on localhost:4566. Start Docker services first with npm run db:up.",
				),
			);
		});

		socket.setTimeout(1000, () => {
			socket.destroy();
			reject(
				new Error(
					"Timed out connecting to localhost:4566. Start Docker services first with npm run db:up.",
				),
			);
		});
	});
}

describe("S3Service integration", () => {
	beforeAll(async () => {
		for (const [name, value] of Object.entries(integrationEnv)) {
			originalEnv[name as keyof typeof integrationEnv] = process.env[name];
			process.env[name] = value;
		}

		await assertMinistackReachable();
	});

	afterAll(() => {
		for (const [name, previousValue] of Object.entries(originalEnv)) {
			if (previousValue === undefined) {
				delete process.env[name];
				continue;
			}

			process.env[name] = previousValue;
		}
	});

	it("should generate a presigned upload url and key", async () => {
		const service = new S3Service();

		const result = await service.getPresignedUploadUrl(
			7,
			2,
			"cv.pdf",
			"application/pdf",
		);

		expect(result.key).toMatch(/^job-applications\/2\/7\/\d+-cv\.pdf$/);

		const uploadUrl = new URL(result.uploadUrl);
		expect(uploadUrl.toString()).toContain("X-Amz-Algorithm");
		expect(uploadUrl.toString()).toContain("X-Amz-Signature");
	});

	it("should throw when S3_BUCKET_NAME is missing", () => {
		const originalBucketName = process.env.S3_BUCKET_NAME;
		delete process.env.S3_BUCKET_NAME;

		try {
			expect(() => new S3Service()).toThrow("S3_BUCKET_NAME is not set");
		} finally {
			process.env.S3_BUCKET_NAME = originalBucketName;
		}
	});
});