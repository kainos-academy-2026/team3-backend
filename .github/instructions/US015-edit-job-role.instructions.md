---
applyTo: "**"
description: "Instructions for admin job-role editing backend work. Covers admin-only PATCH endpoint on the shared job-roles surface, partial update validation, existing band/capability checks, status edit rules, and tests."
---

# Edit Job Role As An Admin - Backend First

## Scope Clarification

- In this codebase, this ticket updates an existing `JobRole` record.
- Do not confuse this with the auth `UserRole` enum (`ADMIN` / `USER`) in `prisma/schema.prisma`.
- Keep this ticket backend-only for now: API routes, controller/service/dao work, validation, and tests.

## What Is Already Done - Do Not Recreate

- `prisma/schema.prisma` already contains:
  - `JobRole`
  - `Capability`
  - `Band`
  - `UserRole`
- `src/app.ts` already registers the shared backend surface at `app.use("/api/job-roles", jobRoleRouter)`.
- `src/routes/jobRoleRouter.ts` already wires existing list/get/apply endpoints.
- `src/controllers/jobRoleController.ts` already contains:
  - `getAllJobRoles`
  - `getJobRoleById`
  - `applyForJobRole`
- `src/services/jobRoleService.ts` already contains current job-role read/apply logic.
- `src/daos/jobRoleDao.ts` already reads `JobRole` records with `capability` and `band` relations included.
- `src/dtos/jobRoleDto.ts` already defines:
  - `JobRoleStatusDto`
  - `CapabilityDto`
  - `BandDto`
  - existing job-role response DTOs
  - `JobRoleIdParamSchema`
- `src/middleware/auth.ts` already provides:
  - `authenticate`
  - `requireAdmin`
- `src/middleware/validate.ts` already provides:
  - `validateParams`
  - `validateBody`

## Acceptance Criteria Mapped To Backend

- Admin can edit an existing job role using `PATCH /api/job-roles/:id`.
- Endpoint is admin-only (`authenticate`, then `requireAdmin`).
- API supports partial updates for editable fields.
- API validation rejects invalid payloads before persistence.
- API returns `404` when the target job role does not exist.
- API returns `404` when provided `capabilityId` or `bandId` does not exist.
- Status can be edited, but only to valid values (`Open`, `Closed`).
- Admin edit endpoint lives on the existing shared `/api/job-roles` surface.

## Recommended Backend Contract

Use the existing `jobRoleRouter` rather than creating a separate admin router.

### Edit endpoint

- **Method/path:** `PATCH /api/job-roles/:id`
- **Auth:** `authenticate`, then `requireAdmin`
- **Validation:** `validateParams(JobRoleIdParamSchema)` and `validateBody(UpdateJobRoleRequestSchema)`
- **Request body:** Partial update payload; all listed fields are optional, but at least one field must be present.

Example payload:

```json
{
  "roleName": "Senior Backend Engineer",
  "location": "Dublin",
  "capabilityId": 1,
  "bandId": 2,
  "closingDate": "2026-08-31",
  "status": "Open",
  "description": "Own backend services and integrations.",
  "responsibilities": "Build APIs, review code, support delivery.",
  "sharepointUrl": "https://example.sharepoint.com/job-role",
  "numberOfOpenPositions": 2
}
```

- **Editable fields:**
  - `roleName`
  - `location`
  - `capabilityId`
  - `bandId`
  - `closingDate`
  - `status`
  - `description`
  - `responsibilities`
  - `sharepointUrl`
  - `numberOfOpenPositions`
- **Status rule:** if provided, must be `Open` or `Closed`.
- **Recommended success response:** `200 OK` with updated job role in existing detailed response shape.

## Phase 1 - Extend Job Role DTOs And Validation

**File:** `src/dtos/jobRoleDto.ts`

Add update request DTO and schema in the existing DTO file.

### Add update request DTO

```typescript
export interface UpdateJobRoleRequestDto {
  roleName?: string;
  location?: string;
  capabilityId?: number;
  bandId?: number;
  closingDate?: string;
  status?: JobRoleStatusDto;
  description?: string;
  responsibilities?: string;
  sharepointUrl?: string;
  numberOfOpenPositions?: number;
}
```

### Add body schema

Use the existing Zod pattern in this file:

```typescript
export const UpdateJobRoleRequestSchema = z
  .object({
    roleName: z.string().trim().min(1, "Role name cannot be empty").optional(),
    location: z.string().trim().min(1, "Location cannot be empty").optional(),
    capabilityId: z.coerce.number().int().positive("Capability must be a positive number").optional(),
    bandId: z.coerce.number().int().positive("Band must be a positive number").optional(),
    closingDate: z
      .string()
      .trim()
      .min(1, "Closing date cannot be empty")
      .refine((value) => !Number.isNaN(Date.parse(value)), "Closing date must be valid")
      .optional(),
    status: z.nativeEnum(JobRoleStatusDto).optional(),
    description: z.string().trim().min(1, "Description cannot be empty").optional(),
    responsibilities: z.string().trim().min(1, "Responsibilities cannot be empty").optional(),
    sharepointUrl: z.string().trim().url("SharePoint URL must be a valid URL").optional(),
    numberOfOpenPositions: z.coerce
      .number()
      .int("Number of open positions must be an integer")
      .positive("Number of open positions must be greater than 0")
      .optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one editable field must be provided",
  });
```

Notes:

- Keep validation messages explicit because `validateBody` exposes them in the API response.
- Schema is for partial updates, but empty payloads must be rejected.

## Phase 2 - Add DAO Support For Edit Flow

**File:** `src/daos/jobRoleDao.ts`

Add or reuse DAO methods needed for update orchestration.

### Job role existence and reference lookup methods

Ensure DAO supports the following lookups (reuse existing methods if already present from incoming work):

```typescript
async findJobRoleById(id: number): Promise<JobRoleWithRelations | null>;
async findCapabilityById(capabilityId: number): Promise<Capability | null>;
async findBandById(bandId: number): Promise<Band | null>;
```

### Add update method

```typescript
async updateJobRole(
  id: number,
  data: {
    roleName?: string;
    location?: string;
    capabilityId?: number;
    bandId?: number;
    closingDate?: Date;
    status?: JobRoleStatusDto;
    description?: string;
    responsibilities?: string;
    sharepointUrl?: string;
    numberOfOpenPositions?: number;
  },
): Promise<JobRoleWithRelations>
```

Implementation rules:

- Use Prisma update on the target `id`.
- Include `capability: true` and `band: true` so existing mapper can be reused.
- Convert `closingDate` to `Date` before persistence.

## Phase 3 - Add Explicit Domain Errors

Add explicit domain errors for clear controller mapping.

**File:** `src/errors/JobRoleNotFoundError.ts` (new file)

```typescript
export class JobRoleNotFoundError extends Error {
  constructor(jobRoleId: number) {
    super(`Job role with id ${jobRoleId} was not found`);
    this.name = "JobRoleNotFoundError";
  }
}
```

**File:** `src/errors/InvalidJobRoleReferenceError.ts` (new file)

```typescript
export class InvalidJobRoleReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJobRoleReferenceError";
  }
}
```

If the incoming create-role PR already introduces one of these errors, reuse it rather than duplicating.

## Phase 4 - Add Service Method

**File:** `src/services/jobRoleService.ts`

Add the following method to `JobRoleService`:

```typescript
async updateJobRole(id: number, data: UpdateJobRoleRequestDto): Promise<JobRoleDetailedResponseDto>
```

Implementation rules:

1. Verify the target job role exists.
2. If not found, throw `JobRoleNotFoundError`.
3. If `capabilityId` is provided, verify capability exists.
4. If provided capability is missing, throw `InvalidJobRoleReferenceError`.
5. If `bandId` is provided, verify band exists.
6. If provided band is missing, throw `InvalidJobRoleReferenceError`.
7. Convert `closingDate` to `Date` before DAO update if provided.
8. Call DAO update method.
9. Return `this.jobRoleMapper.toDetailedResponse(updatedJobRole)`.

## Phase 5 - Add Controller Method

**File:** `src/controllers/jobRoleController.ts`

Add controller method:

```typescript
async updateJobRole(req: Request, res: Response): Promise<void>
```

Behaviour:

- rely on `validateParams(JobRoleIdParamSchema)` and `validateBody(UpdateJobRoleRequestSchema)` for request validation
- call `this.jobRoleService.updateJobRole(id, req.body)`
- return `res.status(200).json(updatedJobRole)`
- catch `JobRoleNotFoundError` and return `404`
- catch `InvalidJobRoleReferenceError` and return `404`
- all other failures return `res.status(500).json({ error: "Internal server error" })`

Recommended error response bodies:

```typescript
res.status(404).json({ error: error.message });
```

## Phase 6 - Wire Route On Existing Shared Surface

**File:** `src/routes/jobRoleRouter.ts`

Update existing router (do not create a separate admin router).

Add imports:

```typescript
import { UpdateJobRoleRequestSchema } from "../dtos/jobRoleDto.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
```

Add route:

```typescript
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validateParams(JobRoleIdParamSchema),
  validateBody(UpdateJobRoleRequestSchema),
  jobRoleController.updateJobRole.bind(jobRoleController),
);
```

Route-order reminder:

- Keep static routes like `/metadata` (if added elsewhere) before `/:id` routes so they are not treated as ids.

## Phase 7 - Tests

### `tests/controllers/jobRoleController.test.ts`

Add service mock for:

- `updateJobRole`

Add test suite for `updateJobRole`:

- happy path: returns `200` with updated job role
- missing job role: returns `404` with explicit message
- missing capability/band reference: returns `404` with explicit message
- generic failure: returns `500`

### `tests/routes/jobRoleRouter.test.ts`

Update mocked service class to include:

- `updateJobRole`

Add route coverage for `PATCH /api/job-roles/:id`:

- missing auth header: returns `401`
- authenticated non-admin user: returns `403`
- invalid route id: returns `400` from `validateParams`
- empty body: returns `400` from `validateBody`
- invalid body fields (for example invalid status or URL): returns `400`
- missing target job role: returns `404`
- missing capability/band references: returns `404`
- admin happy path: returns `200` with updated payload

Use existing JWT mock pattern by returning:

```typescript
{ userId: 1, email: "admin@example.com", role: "ADMIN" }
```

for admin requests.

### `tests/services/jobRoleService.test.ts`

Extend DAO mocks for:

- `findJobRoleById`
- `findCapabilityById`
- `findBandById`
- `updateJobRole`

Add tests for `updateJobRole`:

- happy path: verifies existence checks, DAO update call, and mapper usage
- missing target job role: throws `JobRoleNotFoundError`
- missing capability (when `capabilityId` is supplied): throws `InvalidJobRoleReferenceError`
- missing band (when `bandId` is supplied): throws `InvalidJobRoleReferenceError`
- no capability/band lookup when ids are not supplied in patch payload
- closingDate conversion to `Date` before DAO call when supplied

### `tests/daos/jobRoleDao.test.ts`

Add DAO coverage for:

- `findJobRoleById` queries by id with `capability` and `band` included
- `findCapabilityById` queries by `capabilityId`
- `findBandById` queries by `bandId`
- `updateJobRole` calls `prisma.jobRole.update` with:
  - `where: { id }`
  - provided patch fields only
  - included `capability` and `band` relations

### `tests/dtos/jobRoleDto.test.ts`

Add schema tests for `UpdateJobRoleRequestSchema`:

- accepts valid partial payload (single-field update)
- accepts valid full payload
- rejects empty payload
- rejects invalid `status`
- rejects non-positive `capabilityId`
- rejects non-positive `bandId`
- rejects invalid `closingDate`
- rejects invalid `sharepointUrl`
- rejects non-positive `numberOfOpenPositions`

## Files To Change

| File | Change |
|---|---|
| `src/dtos/jobRoleDto.ts` | Add update request DTO/schema for PATCH validation |
| `src/daos/jobRoleDao.ts` | Add or reuse lookup methods and add updateJobRole persistence method |
| `src/errors/JobRoleNotFoundError.ts` | New explicit domain error for missing target role |
| `src/errors/InvalidJobRoleReferenceError.ts` | New explicit domain error for missing capability/band references |
| `src/services/jobRoleService.ts` | Add updateJobRole orchestration and domain error throwing |
| `src/controllers/jobRoleController.ts` | Add updateJobRole controller method and status-code mapping |
| `src/routes/jobRoleRouter.ts` | Add admin-only PATCH route with params/body validation |
| `tests/controllers/jobRoleController.test.ts` | Add controller coverage for PATCH update behavior |
| `tests/routes/jobRoleRouter.test.ts` | Add route coverage for auth, validation, 404 paths, and success |
| `tests/services/jobRoleService.test.ts` | Add service tests for orchestration and error conditions |
| `tests/daos/jobRoleDao.test.ts` | Add DAO tests for lookup and update query shape |
| `tests/dtos/jobRoleDto.test.ts` | Add schema tests for PATCH payload rules |

## Pre-PR Checklist

1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm test`
5. `npm run test:coverage`
6. Manual API smoke check for unauthorized edit (expect `401`):

```bash
curl -X PATCH http://127.0.0.1:4000/api/job-roles/1 \
  -H "Content-Type: application/json" \
  -d '{"roleName":"Updated Role"}'
```

7. Manual API smoke check for admin edit (expect `200`):

```bash
curl -X PATCH http://127.0.0.1:4000/api/job-roles/1 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Updated Senior Backend Engineer",
    "status": "Closed",
    "numberOfOpenPositions": 1
  }'
```

8. Manual API smoke check for missing role (expect `404`):

```bash
curl -X PATCH http://127.0.0.1:4000/api/job-roles/999999 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleName":"Does not exist"}'
```

9. Manual API smoke check for invalid references (expect `404`):

```bash
curl -X PATCH http://127.0.0.1:4000/api/job-roles/1 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"capabilityId": 999999}'
```

Expected outcomes:

- endpoint is admin-only
- valid patch returns updated record
- empty/invalid payloads return `400`
- missing target role returns `404`
- missing capability/band references return `404`
- lint/tests/coverage all pass
