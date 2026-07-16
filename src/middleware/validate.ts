import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export function validateParams(schema: ZodSchema): RequestHandler {
	return (req, res, next) => {
		const result = schema.safeParse(req.params);

		if (!result.success) {
			res.status(400).json({
				errors: result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				})),
			});
			return;
		}

		req.params = result.data as typeof req.params;
		next();
	};
}

export function validateBody(schema: ZodSchema): RequestHandler {
	return (req, res, next) => {
		const result = schema.safeParse(req.body);

		if (!result.success) {
			res.status(400).json({
				errors: result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				})),
			});
			return;
		}

		req.body = result.data;
		next();
	};
}

export function validateQuery(schema: ZodSchema): RequestHandler {
	return (req, res, next) => {
		const result = schema.safeParse(req.query);

		if (!result.success) {
			res.status(400).json({
				errors: result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				})),
			});
			return;
		}

		next();
	};
}
