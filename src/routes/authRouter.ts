import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { AuthDao } from "../daos/authDao.js";
import { LoginRequestSchema } from "../dtos/authDto.js";
import { validateBody } from "../middleware/validate.js";
import { AuthService } from "../services/authService.js";

const router = Router();
const authDao = new AuthDao();
const authService = new AuthService(authDao);
const authController = new AuthController(authService);

router.post(
	"/login",
	validateBody(LoginRequestSchema),
	authController.login.bind(authController),
);

router.post("/logout", authController.logout.bind(authController));

export default router;
