import type { JobRoleDao } from "../daos/jobRoleDao.js";
import type {
	JobRoleApplicationResponseDto,
	JobRoleDetailedResponseDto,
	JobRoleResponseDto,
} from "../dtos/jobRoleDto.js";
import type { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import type { S3Service } from "./s3Service.js";

export class JobRoleService {
	constructor(
		private readonly jobRoleDao: JobRoleDao,
		private readonly jobRoleMapper: JobRoleMapper,
		private readonly s3Service: S3Service,
	) {}

	private escapeCsvValue(value: string | number): string {
		const stringValue = String(value);
		const escapedValue = stringValue.replaceAll('"', '""');
		return `"${escapedValue}"`;
	}

	async findAllJobRoles(): Promise<JobRoleResponseDto[]> {
		const jobRoles = await this.jobRoleDao.findAllJobRoles();
		return jobRoles.map((jobRole) => this.jobRoleMapper.toResponse(jobRole));
	}

	async generateJobRolesCsvReport(): Promise<string> {
		const jobRoles = await this.jobRoleDao.findAllJobRoles();
		const headers = [
			"id",
			"roleName",
			"location",
			"capability",
			"band",
			"closingDate",
			"status",
			"description",
			"responsibilities",
			"sharepointUrl",
			"numberOfOpenPositions",
		];

		const rows = jobRoles.map((jobRole) =>
			[
				jobRole.id,
				jobRole.roleName,
				jobRole.location,
				jobRole.capability.capabilityName,
				jobRole.band.bandName,
				jobRole.closingDate.toISOString().split("T")[0],
				jobRole.status,
				jobRole.description,
				jobRole.responsibilities,
				jobRole.sharepointUrl,
				jobRole.numberOfOpenPositions,
			]
				.map((value) => this.escapeCsvValue(value))
				.join(","),
		);

		return [headers.join(","), ...rows].join("\n");
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
		const { uploadUrl, key } = await this.s3Service.getPresignedUploadUrl(
			userId,
			jobRoleId,
			fileName,
			contentType,
		);
		await this.jobRoleDao.createApplication(userId, jobRoleId, key);
		return { uploadUrl, key };
	}
}
