import type { JobRoleDao } from "../daos/jobRoleDao.js";
import type {
	CreateJobRoleRequestDto,
	JobRoleApplicationResponseDto,
	JobRoleDetailedResponseDto,
	JobRoleMetadataResponseDto,
	JobRoleResponseDto,
} from "../dtos/jobRoleDto.js";
import { InvalidJobRoleReferenceError } from "../errors/InvalidJobRoleReferenceError.js";
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

	async getJobRoleMetadata(): Promise<JobRoleMetadataResponseDto> {
		const [capabilities, bands] = await Promise.all([
			this.jobRoleDao.findAllCapabilities(),
			this.jobRoleDao.findAllBands(),
		]);

		return {
			capabilities: capabilities.map((capability) => ({
				capabilityId: capability.capabilityId,
				capabilityName: capability.capabilityName,
			})),
			bands: bands.map((band) => ({
				bandId: band.bandId,
				bandName: band.bandName,
			})),
		};
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

	async createJobRole(
		data: CreateJobRoleRequestDto,
	): Promise<JobRoleDetailedResponseDto> {
		const capability = await this.jobRoleDao.findCapabilityById(data.capabilityId);
		if (!capability) {
			throw new InvalidJobRoleReferenceError(
				`Capability with ID ${data.capabilityId} does not exist`,
			);
		}

		const band = await this.jobRoleDao.findBandById(data.bandId);
		if (!band) {
			throw new InvalidJobRoleReferenceError(
				`Band with ID ${data.bandId} does not exist`,
			);
		}

		const createdJobRole = await this.jobRoleDao.createJobRole({
			roleName: data.roleName,
			location: data.location,
			capabilityId: data.capabilityId,
			bandId: data.bandId,
			closingDate: new Date(data.closingDate),
			description: data.description,
			responsibilities: data.responsibilities,
			sharepointUrl: data.sharepointUrl,
			numberOfOpenPositions: data.numberOfOpenPositions,
		});

		return this.jobRoleMapper.toDetailedResponse(createdJobRole);
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
