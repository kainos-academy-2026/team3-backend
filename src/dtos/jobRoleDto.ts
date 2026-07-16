import { z } from "zod";

export enum JobRoleStatusDto {
	Open = "Open",
	Closed = "Closed",
}

export interface CapabilityDto {
	capabilityId: number;
	capabilityName: string;
}

export interface BandDto {
	bandId: number;
	bandName: string;
}

export interface JobRoleResponseDto {
	id: number;
	roleName: string;
	location: string;
	capability: CapabilityDto;
	band: BandDto;
	closingDate: string;
	status: JobRoleStatusDto;
}

export interface JobRolePaginationQueryDto {
	limit: number;
	page: number;
}

export interface JobRolePaginationMetaDto {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
	hasNext: boolean;
	hasPrevious: boolean;
}

export interface JobRolePaginationLinksDto {
	first: string | null;
	next: string | null;
	previous: string | null;
	last: string | null;
}

export interface PaginatedJobRoleResponseDto {
	data: JobRoleResponseDto[];
	pagination: JobRolePaginationMetaDto;
	links: JobRolePaginationLinksDto;
}

export interface JobRoleDetailedResponseDto {
	id: number;
	roleName: string;
	location: string;
	capability: CapabilityDto;
	band: BandDto;
	closingDate: string;
	status: JobRoleStatusDto;
	description: string;
	responsibilities: string;
	sharepointUrl: string;
	numberOfOpenPositions: number;
}

export enum JobRoleApplicationStatusDto {
	InProgress = "In Progress",
	Hired = "Hired",
	Rejected = "Rejected",
}

export interface JobRoleApplicationRequestDto {
	userId: number;
	fileName: string;
	contentType: string;
}

export interface JobRoleApplicationResponseDto {
	uploadUrl: string;
	key: string;
}

export interface JobRoleApplicationSummaryDto {
	applicationId: number;
	userId: number;
	username: string;
	status: JobRoleApplicationStatusDto;
	appliedAt: string;
	cvDownloadUrl: string;
}

export interface JobRoleApplicationsAdminResponseDto {
	jobRoleId: number;
	roleName: string;
	numberOfOpenPositions: number;
	applicants: JobRoleApplicationSummaryDto[];
}

export interface JobRoleApplicationHireResponseDto {
	application: JobRoleApplicationSummaryDto;
	numberOfOpenPositions: number;
}

export interface JobRoleApplicationRejectResponseDto {
	application: JobRoleApplicationSummaryDto;
}

export const JobRoleIdParamSchema = z.object({
	id: z.coerce.number().int().positive("ID must be a positive integer"),
});

export const JobRoleApplicationIdParamSchema = z.object({
	applicationId: z.coerce
		.number()
		.int()
		.positive("Application ID must be a positive integer"),
});

export const JobRoleApplicationActionParamsSchema = z.object({
	id: z.coerce.number().int().positive("ID must be a positive integer"),
	applicationId: z.coerce
		.number()
		.int()
		.positive("Application ID must be a positive integer"),
export const JobRolePaginationQuerySchema = z.object({
	limit: z.coerce
		.number()
		.int("Limit must be an integer")
		.min(1, "Limit must be at least 1")
		.max(30, "Limit must not exceed 30")
		.default(10),
	page: z.coerce
		.number()
		.int("Page must be an integer")
		.min(1, "Page must be at least 1")
		.default(1),
});

export const CreateJobRoleRequestSchema = z.object({
	roleName: z.string().trim().min(1, "Role name is required"),
	location: z.string().trim().min(1, "Location is required"),
	capabilityId: z.coerce.number().int().positive("Capability is required"),
	bandId: z.coerce.number().int().positive("Band is required"),
	closingDate: z
		.string()
		.trim()
		.min(1, "Closing date is required")
		.refine(
			(value) => !Number.isNaN(Date.parse(value)),
			"Closing date must be valid",
		),
	description: z.string().trim().min(1, "Description is required"),
	responsibilities: z.string().trim().min(1, "Responsibilities are required"),
	sharepointUrl: z.string().trim().url("SharePoint URL must be a valid URL"),
	numberOfOpenPositions: z.coerce
		.number()
		.int("Number of open positions must be an integer")
		.positive("Number of open positions must be greater than 0"),
});
