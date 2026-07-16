import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	validateBody,
	validateParams,
	validateQuery,
} from "../../src/middleware/validate.js";

describe("Validation Middleware", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;

	beforeEach(() => {
		req = {
			params: {},
			body: {},
			query: {},
		};
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		next = vi.fn();
	});

	describe("validateParams", () => {
		it("should call next when params are valid", () => {
			const schema = z.object({
				id: z.coerce.number().int().positive(),
			});

			const middleware = validateParams(schema);
			req.params = { id: "123" };

			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should return 400 with error message when params are invalid", () => {
			const schema = z.object({
				id: z.coerce.number().int().positive("ID must be positive"),
			});

			const middleware = validateParams(schema);
			req.params = { id: "invalid" };

			middleware(req as Request, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("validateBody", () => {
		it("should call next when body is valid", () => {
			const schema = z.object({
				email: z.string().email(),
				password: z.string().min(1),
			});

			const middleware = validateBody(schema);
			req.body = { email: "test@example.com", password: "password123" };

			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should return 400 with error message when body is invalid", () => {
			const schema = z.object({
				email: z.string().email("Invalid email"),
				password: z.string().min(1, "Password required"),
			});

			const middleware = validateBody(schema);
			req.body = { email: "invalid-email", password: "" };

			middleware(req as Request, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalled();
			const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(jsonCall.errors).toBeDefined();
			expect(next).not.toHaveBeenCalled();
		});

		it("should parse and set body when validation passes", () => {
			const schema = z.object({
				email: z.string().email(),
				password: z.string(),
			});

			const middleware = validateBody(schema);
			req.body = { email: "test@example.com", password: "pass123" };

			middleware(req as Request, res as Response, next);

			expect(req.body).toEqual({
				email: "test@example.com",
				password: "pass123",
			});
		});
	});

	describe("validateQuery", () => {
		it("should call next when query is valid", () => {
			const schema = z.object({
				limit: z.coerce.number().int().min(1).max(30).default(10),
				page: z.coerce.number().int().min(1).default(1),
			});

			const middleware = validateQuery(schema);
			req.query = { limit: "10", page: "2" };

			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should return 400 when query is invalid", () => {
			const schema = z.object({
				limit: z.coerce.number().int().min(1).max(30),
				page: z.coerce.number().int().min(1),
			});

			const middleware = validateQuery(schema);
			req.query = { limit: "31", page: "0" };

			middleware(req as Request, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		});
	});
});
