import { z } from "zod";

export const LoginRequestSchema = z.object({
	email: z.string().email("Must be a valid email"),
	password: z.string().min(1, "Password is required"),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export interface LoginResponseDto {
	message: string;
	token: string;
	role: string;
}
