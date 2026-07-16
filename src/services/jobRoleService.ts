import type { BandDao } from "../daos/bandDao.js";
import type { CapabilityDao } from "../daos/capabilityDao.js";
import type { JobRoleDao } from "../daos/jobRoleDao.js";
import type { CreateJobRoleRequestDto } from "../dtos/createJobRoleDto.js";
import type {
	JobRoleApplicationResponseDto,
	JobRoleDetailedResponseDto,
	JobRoleResponseDto,
} from "../dtos/jobRoleDto.js";
import type { JobRoleMetadataResponseDto } from "../dtos/jobRoleMetadataDto.js";
import type { UpdateJobRoleRequestDto } from "../dtos/updateJobRoleDto.js";
import { InvalidJobRoleReferenceError } from "../errors/InvalidJobRoleReferenceError.js";
import { JobRoleNotFoundError } from "../errors/JobRoleNotFoundError.js";
import type { JobRoleMapper } from "../mappers/jobRoleMapper.js";
import type { S3Service } from "./s3Service.js";

export class JobRoleService {
	constructor(
		private readonly jobRoleDao: JobRoleDao,
		private readonly capabilityDao: CapabilityDao,
		private readonly bandDao: BandDao,
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

	async getJobRoleMetadata(): Promise<JobRoleMetadataResponseDto> {
		const [capabilities, bands] = await Promise.all([
			this.capabilityDao.findAllCapabilities(),
			this.bandDao.findAllBands(),
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

	async createJobRole(
		data: CreateJobRoleRequestDto,
	): Promise<JobRoleDetailedResponseDto> {
		const capability = await this.capabilityDao.findCapabilityById(
			data.capabilityId,
		);
		if (!capability) {
			throw new InvalidJobRoleReferenceError(
				`Capability with ID ${data.capabilityId} does not exist`,
			);
		}

		const band = await this.bandDao.findBandById(data.bandId);
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

	async updateJobRole(
		id: number,
		data: UpdateJobRoleRequestDto,
	): Promise<JobRoleDetailedResponseDto> {
		const existingJobRole = await this.jobRoleDao.findJobRoleById(id);

		if (!existingJobRole) {
			throw new JobRoleNotFoundError(id);
		}

		if (data.capabilityId !== undefined) {
			const capability = await this.jobRoleDao.findCapabilityById(
				data.capabilityId,
			);

			if (!capability) {
				throw new InvalidJobRoleReferenceError(
					`Capability with id ${data.capabilityId} was not found`,
				);
			}
		}

		if (data.bandId !== undefined) {
			const band = await this.jobRoleDao.findBandById(data.bandId);

			if (!band) {
				throw new InvalidJobRoleReferenceError(
					`Band with id ${data.bandId} was not found`,
				);
			}
		}

		const updatedJobRole = await this.jobRoleDao.updateJobRole(id, {
			...data,
			closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
		});

		return this.jobRoleMapper.toDetailedResponse(updatedJobRole);
	}
}
