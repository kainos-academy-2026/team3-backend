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

export interface JobRoleMetadataResponseDto {
	capabilities: CapabilityDto[];
	bands: BandDto[];
}

export interface CreateJobRoleRequestDto {
	roleName: string;
	location: string;
	capabilityId: number;
	bandId: number;
	closingDate: string;
	description: string;
	responsibilities: string;
	sharepointUrl: string;
	numberOfOpenPositions: number;
}

export enum JobRoleApplicationStatusDto {
	InProgress = "In Progress",
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

export const JobRoleIdParamSchema = z.object({
	id: z.coerce.number().int().positive("ID must be a positive integer"),
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
