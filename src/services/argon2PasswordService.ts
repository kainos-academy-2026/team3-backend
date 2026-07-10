import argon2 from "argon2";
import type PasswordService from "./passwordService.js";

export class Argon2PasswordService implements PasswordService {
	async hashPassword(password: string): Promise<string> {
		return argon2.hash(password);
	}

	async comparePasswords(password: string, hash: string): Promise<boolean> {
		return argon2.verify(hash, password);
	}
}
