import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { BandDao } from "../daos/bandDao.js";
import { CapabilityDao } from "../daos/capabilityDao.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import {
	CreateJobRoleRequestSchema,
	JobRoleApplicationActionParamsSchema,
	JobRoleIdParamSchema,
	JobRolePaginationQuerySchema,
} from "../dtos/jobRoleDto.js";
import { UpdateJobRoleRequestSchema } from "../dtos/updateJobRoleDto.js";
import { JobRoleApplicationMapper } from "../mappers/jobRoleApplicationMapper.js";
import { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
	validateBody,
	validateParams,
	validateQuery,
} from "../middleware/validate.js";
import { JobRoleService } from "../services/jobRoleService.js";
import { S3Service } from "../services/s3Service.js";

const router = Router();
const capabilityDao = new CapabilityDao();
const bandDao = new BandDao();
const jobRoleDao = new JobRoleDao();
const jobRoleMapper = new JobRoleMapper();
const jobRoleApplicationMapper = new JobRoleApplicationMapper();
const s3Service = new S3Service();
const jobRoleService = new JobRoleService(
	jobRoleDao,
	capabilityDao,
	bandDao,
	jobRoleMapper,
	jobRoleApplicationMapper,
	s3Service,
);
const jobRoleController = new JobRoleController(jobRoleService);

router.get(
	"/",
	validateQuery(JobRolePaginationQuerySchema),
	jobRoleController.getAllJobRoles.bind(jobRoleController),
);

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
	"/report",
	authenticate,
	requireAdmin,
	jobRoleController.downloadJobRolesReport.bind(jobRoleController),
);
router.get(
	"/:id/applications",
	authenticate,
	requireAdmin,
	validateParams(JobRoleIdParamSchema),
	jobRoleController.getJobRoleApplicationsForAdmin.bind(jobRoleController),
);
router.patch(
	"/:id/applications/:applicationId/hire",
	authenticate,
	requireAdmin,
	validateParams(JobRoleApplicationActionParamsSchema),
	jobRoleController.hireApplicant.bind(jobRoleController),
);
router.patch(
	"/:id/applications/:applicationId/reject",
	authenticate,
	requireAdmin,
	validateParams(JobRoleApplicationActionParamsSchema),
	jobRoleController.rejectApplicant.bind(jobRoleController),
);
router.get(
	"/:id",
	authenticate,
	validateParams(JobRoleIdParamSchema),
	jobRoleController.getJobRoleById.bind(jobRoleController),
);
router.patch(
	"/:id",
	authenticate,
	requireAdmin,
	validateParams(JobRoleIdParamSchema),
	validateBody(UpdateJobRoleRequestSchema),
	jobRoleController.updateJobRole.bind(jobRoleController),
);
router.post(
	"/:id/apply",
	authenticate,
	validateParams(JobRoleIdParamSchema),
	jobRoleController.applyForJobRole.bind(jobRoleController),
);

export default router;
