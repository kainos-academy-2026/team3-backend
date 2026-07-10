import cookieParser from "cookie-parser";
import express from "express";
import authRouter from "./routes/authRouter.js";
import jobRoleRouter from "./routes/jobRoleRouter.js";

if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET is not set");
}

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);

app.get("/health", (_req, res) => {
	res.json({ status: "UP", timestamp: new Date().toISOString() });
});

app.use("/api/job-roles", jobRoleRouter);

export default app;
