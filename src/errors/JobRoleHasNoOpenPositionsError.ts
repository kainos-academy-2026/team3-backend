export class JobRoleHasNoOpenPositionsError extends Error {
	constructor(jobRoleId: number) {
		super(`Job role with id ${jobRoleId} has no open positions`);
		this.name = "JobRoleHasNoOpenPositionsError";
	}
}
