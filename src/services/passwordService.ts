export default interface PasswordService {
	hashPassword(password: string): Promise<string>;
	comparePasswords(password: string, hash: string): Promise<boolean>;
}
