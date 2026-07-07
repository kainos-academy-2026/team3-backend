import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const jobRoleDao = new JobRoleDao();
const jobRoleMapper = new JobRoleMapper();
const jobRoleService = new JobRoleService(jobRoleDao, jobRoleMapper);
const jobRoleController = new JobRoleController(jobRoleService);

router.get("/", jobRoleController.getAllJobRoles.bind(jobRoleController));

export default router;
