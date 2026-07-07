import { z } from "zod";

export interface JobRoleResponseDto {
  id: number;
  roleName: string;
  location: string;
  capability: string;
  band: number;
  closingDate: string;
  status: "Open" | "Closed";
}

export const CreateJobRoleSchema = z.object({
  roleName: z.string().min(1, "Role name cannot be empty"),
  location: z.string().min(1, "Location cannot be empty"),
  capability: z.string().min(1, "Capability cannot be empty"),
  band: z.number().positive("Band must be a positive number"),
  closingDate: z.string().min(1, "Closing date cannot be empty"),
  status: z.enum(["Open", "Closed"]).default("Open"),
});

export type CreateJobRoleRequestDto = z.infer<typeof CreateJobRoleSchema>;

export const IdParamSchema = z.object({
  id: z.coerce.number().int("ID must be an integer").positive("ID must be a positive integer"),
});
