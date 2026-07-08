import type { JobRoleDao } from "../daos/jobRoleDao.js";
import type { JobRoleResponseDto } from "../dtos/jobRoleDto.js";
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
}
