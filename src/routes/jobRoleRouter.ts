import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import { JobRoleIdParamSchema } from "../dtos/jobRoleDto.js";
import { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import { validateParams } from "../middleware/validate.js";
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
	"/:id",
	validateParams(JobRoleIdParamSchema),
	jobRoleController.getJobRoleById.bind(jobRoleController),
);
router.post("/:id/apply", validateParams(JobRoleIdParamSchema), jobRoleController.applyForJobRole.bind(jobRoleController));

export default router;
