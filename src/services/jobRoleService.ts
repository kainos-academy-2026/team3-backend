import type { JobRoleDao } from "../daos/jobRoleDao.js";
import type { JobRoleDetailedResponseDto, JobRoleResponseDto } from "../dtos/jobRoleDto.js";
import type { JobRoleMapper } from "../mappers/jobRoleMapper.js";

export class JobRoleService {
	constructor(
		private readonly jobRoleDao: JobRoleDao,
		private readonly jobRoleMapper: JobRoleMapper,
	) {}

	async findAllJobRoles(): Promise<JobRoleResponseDto[]> {
		const jobRoles = await this.jobRoleDao.findAllJobRoles();
		return jobRoles.map((jobRole) => this.jobRoleMapper.toResponse(jobRole));
	}

	async findJobRoleById(id: number): Promise<JobRoleDetailedResponseDto | null> {
		const jobRole = await this.jobRoleDao.findJobRoleById(id);
		if (!jobRole) {
			return null;
		}
		return this.jobRoleMapper.toDetailedResponse(jobRole);
	}
}
