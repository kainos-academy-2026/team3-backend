import type { Request, Response } from "express";
import type { JobRoleService } from "../services/jobRoleService.js";

export class JobRoleController {
	constructor(private readonly jobRoleService: JobRoleService) {}

	async getAllJobRoles(_req: Request, res: Response): Promise<void> {
		try {
			const jobRoles = await this.jobRoleService.findAllJobRoles();

			res.status(200).json(jobRoles);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	async getJobRoleById(req: Request, res: Response): Promise<void> {
		try {
			const id = Number(req.params.id);
			const jobRole = await this.jobRoleService.findJobRoleById(id);

			if (!jobRole) {
				res.status(404).json({ error: "Job role not found" });
				return;
			}

			res.status(200).json(jobRole);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	async applyForJobRole(req: Request, res: Response): Promise<void> {
		try {
			const jobRoleId = Number(req.params.id);
			const userId = req.user?.userId;
			const { fileName, contentType } = req.body;

			if (!userId) {
				res.status(401).json({ error: "Authentication required" });
				return;
			}

			if (!fileName || !contentType) {
				res.status(400).json({ error: "Missing required fields" });
				return;
			}

			const presignedUrlData = await this.jobRoleService.applyForJobRole(
				userId,
				jobRoleId,
				fileName,
				contentType,
			);

			res.status(200).json(presignedUrlData);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
}
