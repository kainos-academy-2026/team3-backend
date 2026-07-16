export class InvalidJobRoleReferenceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidJobRoleReferenceError";
	}
}
