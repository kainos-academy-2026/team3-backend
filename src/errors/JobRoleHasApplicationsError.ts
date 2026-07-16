export class JobRoleHasApplicationsError extends Error {
	constructor(jobRoleId: number, count: number) {
		super(
			`Job role with id ${jobRoleId} cannot be deleted because it has ${count} existing application(s)`,
		);
		this.name = "JobRoleHasApplicationsError";
	}
}
