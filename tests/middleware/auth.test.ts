import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin } from "../../src/middleware/auth.js";

describe("requireAdmin", () => {
	let req: Request;
	let res: Response;
	let next: NextFunction;

	beforeEach(() => {
		req = {} as Request;
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as unknown as Response;
		next = vi.fn();
	});

	it("should return 403 when user is not admin", () => {
		req = {
			user: { userId: 7, email: "user@example.com", role: "USER" },
		} as unknown as Request;

		requireAdmin(req, res, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
		expect(next).not.toHaveBeenCalled();
	});

	it("should call next when user is admin", () => {
		req = {
			user: { userId: 1, email: "admin@example.com", role: "ADMIN" },
		} as unknown as Request;

		requireAdmin(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});
