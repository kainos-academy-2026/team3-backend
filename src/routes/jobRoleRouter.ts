import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const jobRoleService = new JobRoleService();
const jobRoleController = new JobRoleController(jobRoleService);

router.get("/", jobRoleController.getAllJobRoles.bind(jobRoleController));

export default router;