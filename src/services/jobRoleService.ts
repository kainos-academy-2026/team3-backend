import type { JobRoleDao } from "../daos/jobRoleDao.js";
import type {
	JobRoleDetailedResponseDto,
	JobRoleResponseDto,
	JobRoleApplicationResponseDto,
} from "../dtos/jobRoleDto.js";
import type { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import type { S3Service } from "./s3Service.js";

export class JobRoleService {
	constructor(
		private readonly jobRoleDao: JobRoleDao,
		private readonly jobRoleMapper: JobRoleMapper,
		private readonly s3Service: S3Service,
	) {}

	async findAllJobRoles(): Promise<JobRoleResponseDto[]> {
		const jobRoles = await this.jobRoleDao.findAllJobRoles();
		return jobRoles.map((jobRole) => this.jobRoleMapper.toResponse(jobRole));
	}

	async findJobRoleById(
		id: number,
	): Promise<JobRoleDetailedResponseDto | null> {
		const jobRole = await this.jobRoleDao.findJobRoleById(id);
		if (!jobRole) {
			return null;
		}
		return this.jobRoleMapper.toDetailedResponse(jobRole);
	}

	async applyForJobRole(
		userId: number,
		jobRoleId: number,
		fileName: string,
		contentType: string,
	): Promise<JobRoleApplicationResponseDto> {
		const { uploadUrl, key } = await this.s3Service.getPresignedUploadUrl(userId, jobRoleId, fileName, contentType);
		await this.jobRoleDao.createApplication(userId, jobRoleId, key);
		return { uploadUrl, key };
	}
}
