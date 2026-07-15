export class JobRoleNotFoundError extends Error {
	constructor(jobRoleId: number) {
		super(`Job role with id ${jobRoleId} was not found`);
		this.name = "JobRoleNotFoundError";
	}
}
