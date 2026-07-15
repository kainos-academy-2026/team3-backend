import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import {
	CreateJobRoleRequestSchema,
	JobRoleIdParamSchema,
} from "../dtos/jobRoleDto.js";
import { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { JobRoleService } from "../services/jobRoleService.js";
import { S3Service } from "../services/s3Service.js";

const router = Router();
const jobRoleDao = new JobRoleDao();
const jobRoleMapper = new JobRoleMapper();
const s3Service = new S3Service();
const jobRoleService = new JobRoleService(jobRoleDao, jobRoleMapper, s3Service);
const jobRoleController = new JobRoleController(jobRoleService);

router.get("/", jobRoleController.getAllJobRoles.bind(jobRoleController));
router.get(
	"/metadata",
	authenticate,
	requireAdmin,
	jobRoleController.getJobRoleMetadata.bind(jobRoleController),
);
router.post(
	"/",
	authenticate,
	requireAdmin,
	validateBody(CreateJobRoleRequestSchema),
	jobRoleController.createJobRole.bind(jobRoleController),
);
router.get(
	"/:id",
	authenticate,
	validateParams(JobRoleIdParamSchema),
	jobRoleController.getJobRoleById.bind(jobRoleController),
);
router.post(
	"/:id/apply",
	authenticate,
	validateParams(JobRoleIdParamSchema),
	jobRoleController.applyForJobRole.bind(jobRoleController),
);

export default router;
