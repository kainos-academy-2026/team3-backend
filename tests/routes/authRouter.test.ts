import type { Application } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
	EmailAlreadyExistsError,
	InvalidCredentialsError,
} from "../../src/errors/InvalidCredentialsErrors.js";

const mocks = vi.hoisted(() => ({
	mockLogin: vi.fn(),
	mockRegister: vi.fn(),
}));

vi.mock("../../src/prismaClient.js", () => ({
	default: {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		jobRole: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("../../src/daos/jobRoleDao.js", () => ({
	JobRoleDao: class JobRoleDao {},
}));

vi.mock("../../src/mappers/jobRoleMapper.js", () => ({
	JobRoleMapper: class JobRoleMapper {},
}));

vi.mock("../../src/services/jobRoleService.js", () => ({
	JobRoleService: class JobRoleService {
		findAllJobRoles = vi.fn();
		getJobRoleMetadata = vi.fn();
		generateJobRolesCsvReport = vi.fn();
		findJobRoleById = vi.fn();
		createJobRole = vi.fn();
		applyForJobRole = vi.fn();
		updateJobRole = vi.fn();
		getJobRoleApplicationsForAdmin = vi.fn();
		hireApplicant = vi.fn();
		rejectApplicant = vi.fn();
		deleteJobRole = vi.fn();
	},
}));

vi.mock("../../src/services/jwtTokenService.js", () => ({
	JwtTokenService: class JwtTokenService {
		create = vi.fn();
		verify = vi.fn();
	},
}));

vi.mock("../../src/services/authService.js", () => ({
	AuthService: class AuthService {
		login = mocks.mockLogin;
		register = mocks.mockRegister;
	},
}));

let app: Application;

beforeAll(async () => {
	process.env.JWT_SECRET = "test-secret";
	process.env.AWS_REGION = "eu-west-1";
	process.env.S3_BUCKET_NAME = "test-bucket";
	process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
	app = (await import("../../src/app.js")).default;
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
	it("should return 200 with token and role on successful login", async () => {
		mocks.mockLogin.mockResolvedValueOnce({
			token: "jwt-token-here",
			role: "ADMIN",
		});

		const response = await request(app)
			.post("/api/auth/login")
			.send({ email: "admin@example.com", password: "Password123!" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			token: "jwt-token-here",
			role: "ADMIN",
			message: "Login successful",
		});
		expect(mocks.mockLogin).toHaveBeenCalledWith({
			email: "admin@example.com",
			password: "Password123!",
		});
	});

	it("should return 401 when credentials are invalid", async () => {
		mocks.mockLogin.mockRejectedValueOnce(new InvalidCredentialsError());

		const response = await request(app)
			.post("/api/auth/login")
			.send({ email: "admin@example.com", password: "wrong-password" });

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Invalid credentials" });
	});
});

describe("POST /api/auth/register", () => {
	it("should return 201 for a successful registration", async () => {
		mocks.mockRegister.mockResolvedValueOnce(undefined);

		const response = await request(app)
			.post("/api/auth/register")
			.send({ email: "new@example.com", password: "Password123!" });

		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			message: "User registered successfully",
		});
		expect(mocks.mockRegister).toHaveBeenCalledWith({
			email: "new@example.com",
			password: "Password123!",
		});
	});

	it("should return 409 when the email already exists", async () => {
		mocks.mockRegister.mockRejectedValueOnce(new EmailAlreadyExistsError());

		const response = await request(app)
			.post("/api/auth/register")
			.send({ email: "existing@example.com", password: "Password123!" });

		expect(response.status).toBe(409);
		expect(response.body).toEqual({ error: "Email already exists" });
	});
});

describe("POST /api/auth/logout", () => {
	it("should clear the token cookie and return 200", async () => {
		const response = await request(app).post("/api/auth/logout");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ message: "Logged out" });
		expect(response.headers["set-cookie"]).toBeDefined();
		expect(response.headers["set-cookie"][0]).toContain("token=");
		expect(response.headers["set-cookie"][0]).toContain("Expires=");
	});
});
