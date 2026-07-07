export enum JobRoleStatusDto {
  Open = "Open",
  Closed = "Closed",
}

export interface JobRoleResponseDto {
  id: number;
  roleName: string;
  location: string;
  capability: string;
  band: number;
  closingDate: Date;
  status: JobRoleStatusDto;
}

export function toJobRoleStatusDto(status: string): JobRoleStatusDto {
  if (status === JobRoleStatusDto.Closed) {
    return JobRoleStatusDto.Closed;
  }

  return JobRoleStatusDto.Open;
}
