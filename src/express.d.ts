import type { AuthTokenPayload } from "./services/tokenService.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}
