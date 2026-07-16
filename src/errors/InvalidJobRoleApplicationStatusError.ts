export class InvalidJobRoleApplicationStatusError extends Error {
	constructor(applicationId: number, status: string) {
		super(
			`Application ${applicationId} cannot transition from status ${status}`,
		);
		this.name = "InvalidJobRoleApplicationStatusError";
	}
}
