export class InvalidCredentialsError extends Error {
	constructor(message: string = "Invalid credentials") {
		super(message);
		this.name = "InvalidCredentialsError";
	}
}

export class EmailAlreadyExistsError extends Error {
	constructor(message: string = "Email already exists") {
		super(message);
		this.name = "EmailAlreadyExistsError";
	}
}
