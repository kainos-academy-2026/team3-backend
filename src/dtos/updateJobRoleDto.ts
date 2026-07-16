import { z } from "zod";
import { JobRoleStatusDto } from "./jobRoleDto.js";

export interface UpdateJobRoleRequestDto {
	roleName?: string;
	location?: string;
	capabilityId?: number;
	bandId?: number;
	closingDate?: string;
	status?: JobRoleStatusDto;
	description?: string;
	responsibilities?: string;
	sharepointUrl?: string;
	numberOfOpenPositions?: number;
}

export const UpdateJobRoleRequestSchema = z
	.object({
		roleName: z.string().trim().min(1, "Role name cannot be empty").optional(),
		location: z.string().trim().min(1, "Location cannot be empty").optional(),
		capabilityId: z.coerce
			.number()
			.int()
			.positive("Capability must be a positive number")
			.optional(),
		bandId: z.coerce
			.number()
			.int()
			.positive("Band must be a positive number")
			.optional(),
		closingDate: z
			.string()
			.trim()
			.min(1, "Closing date cannot be empty")
			.refine(
				(value) => !Number.isNaN(Date.parse(value)),
				"Closing date must be valid",
			)
			.optional(),
		status: z.nativeEnum(JobRoleStatusDto).optional(),
		description: z
			.string()
			.trim()
			.min(1, "Description cannot be empty")
			.optional(),
		responsibilities: z
			.string()
			.trim()
			.min(1, "Responsibilities cannot be empty")
			.optional(),
		sharepointUrl: z
			.string()
			.trim()
			.url("SharePoint URL must be a valid URL")
			.optional(),
		numberOfOpenPositions: z.coerce
			.number()
			.int("Number of open positions must be an integer")
			.positive("Number of open positions must be greater than 0")
			.optional(),
	})
	.refine((body) => Object.keys(body).length > 0, {
		message: "At least one editable field must be provided",
	});
