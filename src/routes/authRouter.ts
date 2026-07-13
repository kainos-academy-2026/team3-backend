import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { AuthDao } from "../daos/authDao.js";
import { LoginRequestSchema } from "../dtos/authDto.js";
import { validateBody } from "../middleware/validate.js";
import { Argon2PasswordService } from "../services/argon2PasswordService.js";
import { AuthService } from "../services/authService.js";
import { JwtTokenService } from "../services/jwtTokenService.js";
import { RegisterRequestSchema } from "../dtos/registerDto.js";

const router = Router();
const authDao = new AuthDao();
const passwordService = new Argon2PasswordService();
const tokenService = new JwtTokenService();
const authService = new AuthService(authDao, passwordService, tokenService);
const authController = new AuthController(authService);

router.post(
	"/login",
	validateBody(LoginRequestSchema),
	authController.login.bind(authController),
);

router.post(
	"/register",
	validateBody(RegisterRequestSchema),
	authController.register.bind(authController),
);

router.post("/logout", authController.logout.bind(authController));

export default router;
