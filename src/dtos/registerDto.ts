import { z } from "zod";

const strongPasswordSchema = z
    .string()
    .min(9, "Password must be more than 8 characters long.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

export const RegisterRequestSchema = z.object({
    email: z.string().email("Must be a valid email"),
    password: strongPasswordSchema,
});


export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;