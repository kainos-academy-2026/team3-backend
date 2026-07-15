import type { Request, Response } from "express";
import { InvalidJobRoleReferenceError } from "../errors/InvalidJobRoleReferenceError.js";
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

	async getJobRoleMetadata(_req: Request, res: Response): Promise<void> {
		try {
			const metadata = await this.jobRoleService.getJobRoleMetadata();
			res.status(200).json(metadata);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	async downloadJobRolesReport(_req: Request, res: Response): Promise<void> {
		try {
			const csvReport = await this.jobRoleService.generateJobRolesCsvReport();
			const today = new Date().toISOString().split("T")[0];

			res.setHeader("Content-Type", "text/csv; charset=utf-8");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="job-roles-report-${today}.csv"`,
			);
			res.status(200).send(csvReport);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	async getJobRoleMetadata(_req: Request, res: Response): Promise<void> {
		try {
			const metadata = await this.jobRoleService.getJobRoleMetadata();
			res.status(200).json(metadata);
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

	async createJobRole(req: Request, res: Response): Promise<void> {
		try {
			const createdJobRole = await this.jobRoleService.createJobRole(req.body);
			res.status(201).json(createdJobRole);
		} catch (error) {
			console.error(error);

			if (error instanceof InvalidJobRoleReferenceError) {
				res.status(400).json({ error: error.message });
				return;
			}

			res.status(500).json({ error: "Internal server error" });
		}
	}
}
