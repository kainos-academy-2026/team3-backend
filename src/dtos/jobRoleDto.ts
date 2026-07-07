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
  closingDate: Date;
  status: JobRoleStatusDto;
}

export function toJobRoleStatusDto(status: string): JobRoleStatusDto {
  if (status === JobRoleStatusDto.Closed) {
    return JobRoleStatusDto.Closed;
  }

  return JobRoleStatusDto.Open;
}
