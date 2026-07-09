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
