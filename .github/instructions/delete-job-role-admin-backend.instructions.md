---
applyTo: "src/**,tests/**"
description: "Instructions for admin job-role deletion backend work. Covers admin-only DELETE endpoint on the shared job-roles surface, 404 handling, cascade safety, and tests."
---

# Delete Job Role As An Admin - Backend First

## Scope Clarification

- In this codebase, this ticket permanently deletes an existing `JobRole` record.
- The confirmation warning before deletion is a **frontend concern only** — the backend does not enforce it.
- Keep this ticket backend-only: API routes, controller/service/dao work, and tests.

## What Is Already Done - Do Not Recreate

- `prisma/schema.prisma` already contains `JobRole`, `Capability`, `Band`, and `UserRole`.
- `src/app.ts` already registers the shared backend surface at `app.use("/api/job-roles", jobRoleRouter)`.
- `src/routes/jobRoleRouter.ts` already wires existing list/get/create/patch/apply endpoints.
- `src/controllers/jobRoleController.ts` already contains:
  - `getAllJobRoles`
  - `getJobRoleById`
  - `getJobRoleMetadata`
  - `createJobRole`
  - `updateJobRole`
  - `applyForJobRole`
  - `downloadJobRolesReport`
- `src/services/jobRoleService.ts` already contains current job-role read/create/update/apply logic.
- `src/daos/jobRoleDao.ts` already contains:
  - `findAllJobRoles`
  - `findJobRoleById`
  - `createJobRole`
  - `updateJobRole`
  - `findCapabilityById`
  - `findBandById`
- `src/dtos/jobRoleDto.ts` already defines `JobRoleIdParamSchema` — reuse it for `DELETE /:id` param validation.
- `src/errors/JobRoleNotFoundError.ts` already exists — reuse it for missing role errors.
- `src/middleware/auth.ts` already provides `authenticate` and `requireAdmin`.
- `src/middleware/validate.ts` already provides `validateParams`.

## Acceptance Criteria Mapped To Backend

- Admin can delete an existing job role using `DELETE /api/job-roles/:id`.
- Endpoint is admin-only (`authenticate`, then `requireAdmin`).
- API returns `204 No Content` on successful deletion.
- API returns `404` when the target job role does not exist.
- API validates the `:id` param before reaching the service.

## Recommended Backend Contract

Use the existing `jobRoleRouter` — do not create a separate admin router.

### Delete endpoint

- **Method/path:** `DELETE /api/job-roles/:id`
- **Auth:** `authenticate`, then `requireAdmin`
- **Validation:** `validateParams(JobRoleIdParamSchema)`
- **Request body:** none
- **Success response:** `204 No Content` with no body
- **Not found response:** `404` with `{ "error": "<message from JobRoleNotFoundError>" }`

## Phase 1 - No New DTOs Required

No new DTO or schema is needed for delete.

- The `:id` route parameter is already validated by the existing `JobRoleIdParamSchema` in `src/dtos/jobRoleDto.ts`.
- There is no request body to validate.
- There is no response body for a successful delete.

## Phase 2 - Add DAO Method For Deletion

**File:** `src/daos/jobRoleDao.ts`

Add a delete method to `JobRoleDao`:

```typescript
async deleteJobRoleById(id: number): Promise<void> {
  await prisma.jobRole.delete({
    where: { id },
  });
}
```

Implementation rules:

- Use `prisma.jobRole.delete` with `where: { id }`.
- Return `void` — the service layer handles existence checks before calling this.
- Do not include relation data in the delete call; it is not needed.

## Phase 3 - Add Service Method

**File:** `src/services/jobRoleService.ts`

Add the following method to `JobRoleService`:

```typescript
async deleteJobRole(id: number): Promise<void>
```

Implementation rules:

1. Call `this.jobRoleDao.findJobRoleById(id)`.
2. If the result is `null`, throw `new JobRoleNotFoundError(id)`.
3. Call `this.jobRoleDao.deleteJobRoleById(id)`.
4. Return `void`.

## Phase 4 - Add Controller Method

**File:** `src/controllers/jobRoleController.ts`

Add controller method:

```typescript
async deleteJobRole(req: Request, res: Response): Promise<void>
```

Behaviour:

- Rely on `validateParams(JobRoleIdParamSchema)` for param validation.
- Parse `id` from `req.params.id` as a number.
- Call `await this.jobRoleService.deleteJobRole(id)`.
- On success, return `res.status(204).send()`.
- Catch `JobRoleNotFoundError` and return `res.status(404).json({ error: error.message })`.
- All other failures: log the error and return `res.status(500).json({ error: "Internal server error" })`.

Example:

```typescript
async deleteJobRole(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await this.jobRoleService.deleteJobRole(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof JobRoleNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

## Phase 5 - Wire Route On Existing Shared Surface

**File:** `src/routes/jobRoleRouter.ts`

Add the DELETE route. No new imports are needed — `authenticate`, `requireAdmin`, `validateParams`, and `JobRoleIdParamSchema` are already imported.

Add route:

```typescript
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validateParams(JobRoleIdParamSchema),
  jobRoleController.deleteJobRole.bind(jobRoleController),
);
```

Route-order reminder:

- Keep this route **after** static routes (`/metadata`, `/report`) and **after** `GET /:id` and `PATCH /:id` so route order is clear.
- The existing `router.post("/:id/apply", ...)` must remain after the new DELETE route.

## Phase 6 - Tests

### `tests/controllers/jobRoleController.test.ts`

Add service mock for:

- `deleteJobRole`

Add test suite for `deleteJobRole` controller method:

- Happy path: service resolves, controller returns `204` with no body.
- Missing job role: service throws `JobRoleNotFoundError`, controller returns `404` with the error message.
- Generic failure: service throws an unexpected error, controller returns `500`.

### `tests/routes/jobRoleRouter.test.ts`

Update mocked service class to include:

- `deleteJobRole`

Add route coverage for `DELETE /api/job-roles/:id`:

- Missing auth header: returns `401`.
- Authenticated non-admin user: returns `403`.
- Invalid route id (e.g. `abc`): returns `400` from `validateParams`.
- Missing target job role (service returns `JobRoleNotFoundError`): returns `404`.
- Admin happy path: returns `204` with no body.

Use the existing JWT mock pattern returning:

```typescript
{ userId: 1, email: "admin@example.com", role: "ADMIN" }
```

for admin requests.

### `tests/services/jobRoleService.test.ts`

Extend DAO mocks for:

- `findJobRoleById`
- `deleteJobRoleById`

Add tests for `deleteJobRole`:

- Happy path: `findJobRoleById` returns a role, `deleteJobRoleById` is called with the correct id, method resolves without throwing.
- Missing target job role: `findJobRoleById` returns `null`, method throws `JobRoleNotFoundError`.
- `deleteJobRoleById` is **not** called when the role is not found.

### `tests/daos/jobRoleDao.test.ts`

Add DAO coverage for `deleteJobRoleById`:

- Calls `prisma.jobRole.delete` with `where: { id }`.
- Resolves without error on success.

## Files To Change

| File | Change |
|---|---|
| `src/daos/jobRoleDao.ts` | Add `deleteJobRoleById` persistence method |
| `src/services/jobRoleService.ts` | Add `deleteJobRole` orchestration with existence check |
| `src/controllers/jobRoleController.ts` | Add `deleteJobRole` controller method with status-code mapping |
| `src/routes/jobRoleRouter.ts` | Add admin-only `DELETE /:id` route with param validation |
| `tests/controllers/jobRoleController.test.ts` | Add controller coverage for delete behaviour |
| `tests/routes/jobRoleRouter.test.ts` | Add route coverage for auth, validation, 404, and 204 success |
| `tests/services/jobRoleService.test.ts` | Add service tests for existence check and DAO delegation |
| `tests/daos/jobRoleDao.test.ts` | Add DAO coverage for `deleteJobRoleById` |
