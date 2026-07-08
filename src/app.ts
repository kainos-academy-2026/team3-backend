import express from "express";
import jobRoleRouter from "./routes/jobRoleRouter.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ status: "UP", timestamp: new Date().toISOString() });
});

app.use("/api/job-roles", jobRoleRouter);

export default app;
