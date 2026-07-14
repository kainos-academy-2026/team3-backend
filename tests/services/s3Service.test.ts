import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getSignedUrl: vi.fn(),
	putObjectCommand: vi.fn(),
	s3Client: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
	PutObjectCommand: mocks.putObjectCommand,
	S3Client: mocks.s3Client,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: mocks.getSignedUrl,
}));

import { S3Service } from "../../src/services/s3Service.js";

describe("S3Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("AWS_REGION", "eu-west-1");
		vi.stubEnv("S3_BUCKET_NAME", "test-bucket");
		vi.spyOn(Date, "now").mockReturnValue(123);
	});

	it("should return a presigned upload url and key", async () => {
		mocks.getSignedUrl.mockResolvedValueOnce("https://example.com/upload");

		const service = new S3Service();
		const result = await service.getPresignedUploadUrl(
			7,
			2,
			"cv.pdf",
			"application/pdf",
		);

		expect(mocks.s3Client).toHaveBeenCalledWith({ region: "eu-west-1" });
		expect(mocks.putObjectCommand).toHaveBeenCalledWith({
			Bucket: "test-bucket",
			Key: "job-applications/2/7/123-cv.pdf",
			ContentType: "application/pdf",
		});
		expect(mocks.getSignedUrl).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			uploadUrl: "https://example.com/upload",
			key: "job-applications/2/7/123-cv.pdf",
		});
	});

	it("should throw when AWS_REGION is missing", () => {
		vi.unstubAllEnvs();
		vi.stubEnv("S3_BUCKET_NAME", "test-bucket");

		expect(() => new S3Service()).toThrow("AWS_REGION is not set");
	});
});
