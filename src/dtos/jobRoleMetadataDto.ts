import type { BandDto, CapabilityDto } from "./jobRoleDto.js";

export interface JobRoleMetadataResponseDto {
	capabilities: CapabilityDto[];
	bands: BandDto[];
}