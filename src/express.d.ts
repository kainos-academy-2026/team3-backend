import type { AuthTokenPayload } from "./services/authTokenPayload.js";

declare global {
	namespace Express {
		interface Request {
			user?: AuthTokenPayload;
		}
	}
}
