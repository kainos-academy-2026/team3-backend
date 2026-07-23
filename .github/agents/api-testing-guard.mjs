const stdin = await new Promise((resolve) => {
	let data = "";
	process.stdin.setEncoding("utf8");
	process.stdin.on("data", (chunk) => {
		data += chunk;
	});
	process.stdin.on("end", () => resolve(data));
});

const allow = () => {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: "PreToolUse",
				permissionDecision: "allow",
			},
		}),
	);
};

const deny = (reason) => {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: "PreToolUse",
				permissionDecision: "deny",
				permissionDecisionReason: reason,
			},
		}),
	);
};

let payload;

try {
	payload = stdin ? JSON.parse(stdin) : {};
} catch {
	allow();
	process.exit(0);
}

const toolName = String(payload.tool_name ?? "");
const toolInput = payload.tool_input ?? {};

const normalizePath = (value) =>
	String(value).replaceAll("\\", "/").replace(/^\.\//, "");

const collectPaths = (value, key = "") => {
	if (typeof value === "string") {
		if (
			key === "path" ||
			key === "file" ||
			key === "targetFile" ||
			key === "uri"
		) {
			return [value];
		}
		return [];
	}

	if (Array.isArray(value)) {
		if (key === "files") {
			return value.flatMap((entry) => {
				if (typeof entry === "string") {
					return [entry];
				}

				if (entry && typeof entry === "object") {
					return collectPaths(entry);
				}

				return [];
			});
		}

		return value.flatMap((entry) => collectPaths(entry));
	}

	if (!value || typeof value !== "object") {
		return [];
	}

	return Object.entries(value).flatMap(([entryKey, entryValue]) =>
		collectPaths(entryValue, entryKey),
	);
};

const collectCommands = (value, key = "") => {
	if (typeof value === "string") {
		return key === "command" ? [value] : [];
	}

	if (Array.isArray(value)) {
		return value.flatMap((entry) => collectCommands(entry));
	}

	if (!value || typeof value !== "object") {
		return [];
	}

	return Object.entries(value).flatMap(([entryKey, entryValue]) =>
		collectCommands(entryValue, entryKey),
	);
};

const isAllowedTestPath = (filePath) => {
	const normalized = normalizePath(filePath);
	return normalized.startsWith("tests/") && !normalized.includes("..");
};

const safeCommandPatterns = [
	/^(cd\s+[^;&|]+\s+&&\s+)?npm\s+run\s+(lint|build|test:coverage)(\s+.*)?$/u,
	/^(cd\s+[^;&|]+\s+&&\s+)?npm\s+test(\s+.*)?$/u,
	/^(cd\s+[^;&|]+\s+&&\s+)?npx\s+vitest(\s+.*)?$/u,
	/^(cd\s+[^;&|]+\s+&&\s+)?npx\s+biome\s+format\s+--write\s+tests\/.+$/u,
	/^(cd\s+[^;&|]+\s+&&\s+)?npx\s+biome\s+lint(\s+--write)?\s+tests\/.+$/u,
	/^(cd\s+[^;&|]+\s+&&\s+)?git\s+--no-pager\s+(status|diff)(\s+.*)?$/u,
	/^(cd\s+[^;&|]+\s+&&\s+)?curl(\s+.*)?$/u,
];

const editLikeTool = toolName.toLowerCase().includes("edit");
if (editLikeTool) {
	const paths = [...new Set(collectPaths(toolInput).map(normalizePath))];

	if (paths.length === 0) {
		deny(
			"API Testing agent could not determine edit targets; only tests/** may be edited.",
		);
		process.exit(0);
	}

	const invalidPath = paths.find((filePath) => !isAllowedTestPath(filePath));
	if (invalidPath) {
		deny(
			`API Testing agent may edit tests/** only. Blocked edit target: ${invalidPath}`,
		);
		process.exit(0);
	}
}

const commands = collectCommands(toolInput).map((command) => command.trim());
if (commands.length > 0) {
	const unsafeCommand = commands.find(
		(command) => !safeCommandPatterns.some((pattern) => pattern.test(command)),
	);

	if (unsafeCommand) {
		deny(
			`API Testing agent only allows safe test and verification commands. Blocked command: ${unsafeCommand}`,
		);
		process.exit(0);
	}
}

allow();
