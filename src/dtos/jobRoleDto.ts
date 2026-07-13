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

export enum JobRoleApplicationStatusDto {
	InProgress = "In Progress",
}

export interface JobRoleApplicationRequestDto {
	userId: number;
	jobRoleId: number;
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
