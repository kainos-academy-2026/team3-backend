export class JobRoleApplicationNotFoundError extends Error {
	constructor(jobRoleId: number, applicationId: number) {
		super(
			`Application with id ${applicationId} was not found for job role ${jobRoleId}`,
		);
		this.name = "JobRoleApplicationNotFoundError";
	}
}
