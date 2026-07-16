import type { JobRoleStatusDto } from "../dtos/jobRoleDto.js";

export interface UpdateJobRoleData {
	roleName?: string;
	location?: string;
	capabilityId?: number;
	bandId?: number;
	closingDate?: Date;
	status?: JobRoleStatusDto;
	description?: string;
	responsibilities?: string;
	sharepointUrl?: string;
	numberOfOpenPositions?: number;
}
