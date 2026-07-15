import type { RequestHandler } from "express";
import { JwtTokenService } from "../services/jwtTokenService.js";

const tokenService = new JwtTokenService();

export const authenticate: RequestHandler = async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		res.status(401).json({ error: "Missing or invalid authorization header" });
		return;
	}

	const token = authHeader.slice("Bearer ".length).trim();
	const payload = await tokenService.verify(token);

	if (!payload) {
		res.status(401).json({ error: "Invalid or expired token" });
		return;
	}

	req.user = payload;
	next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
	if (req.user?.role !== "ADMIN") {
		res.status(403).json({ error: "Forbidden" });
		return;
	}
	next();
};
