---
applyTo: "**"
description: "Instructions for admin job-role creation backend work. Covers admin-only metadata and create endpoints, shared job-roles routing, validation, existing band/capability checks, default Open status, and tests."
---

# Add New Job Role As An Admin - Backend First

## Scope Clarification

- In this codebase, this ticket should create a new `JobRole` record.
- Do not confuse this with the auth `UserRole` enum (`ADMIN` / `USER`) in `prisma/schema.prisma`.
- Keep this ticket backend-only for now: API routes, controller/service/dao work, validation, and tests.

## What Is Already Done - Do Not Recreate

- `prisma/schema.prisma` already contains:
  - `JobRole`
  - `Capability`
  - `Band`
  - `UserRole`
- `src/app.ts` already registers the shared backend surface at `app.use("/api/job-roles", jobRoleRouter)`.
- `src/routes/jobRoleRouter.ts` already wires the existing list/get/apply endpoints.
- `src/controllers/jobRoleController.ts` already contains:
  - `getAllJobRoles`
  - `getJobRoleById`
  - `applyForJobRole`
- `src/services/jobRoleService.ts` already contains the current job-role read/apply logic.
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

- Admin can create a new job role linked to an existing capability and an existing band.
- The API exposes dropdown data for capabilities and bands already in the database.
- API validation rejects invalid payloads before persistence.
- API rejects capability or band IDs that do not exist.
- New job roles are always persisted with status `Open`.
- Admin-only create endpoints live on the existing shared `/api/job-roles` surface.

## Recommended Backend Contract

Use the existing `jobRoleRouter` rather than creating a separate admin router.

### 1. Metadata endpoint for create form options

- **Method/path:** `GET /api/job-roles/metadata`
- **Auth:** `authenticate`, then `requireAdmin`
- **Response:**

```json
{
  "capabilities": [
    { "capabilityId": 1, "capabilityName": "Engineering" }
  ],
  "bands": [
    { "bandId": 1, "bandName": "Band 1" }
  ]
}
```

This gives the admin UI one call for both dropdowns.

### 2. Create endpoint

- **Method/path:** `POST /api/job-roles`
- **Auth:** `authenticate`, then `requireAdmin`
- **Request body:**

```json
{
  "roleName": "Senior Backend Engineer",
  "location": "Dublin",
  "capabilityId": 1,
  "bandId": 2,
  "closingDate": "2026-08-31",
  "description": "Own backend services and integrations.",
  "responsibilities": "Build APIs, review code, support delivery.",
  "sharepointUrl": "https://example.sharepoint.com/job-role",
  "numberOfOpenPositions": 2
}
```

- **Important:** do not accept `status` from the client.
- **Persistence rule:** status must always be set to `JobRoleStatusDto.Open` in backend code.
- **Recommended success response:** `201 Created` with the created job role using the existing detailed response shape.

## Phase 1 - Extend Job Role DTOs And Validation

**File:** `src/dtos/jobRoleDto.ts`

Add the request/response shapes needed for admin creation in the existing DTO file rather than creating a parallel validation folder.

### Add a metadata response type

```typescript
export interface JobRoleMetadataResponseDto {
  capabilities: CapabilityDto[];
  bands: BandDto[];
}
```

### Add a create request DTO

```typescript
export interface CreateJobRoleRequestDto {
  roleName: string;
  location: string;
  capabilityId: number;
  bandId: number;
  closingDate: string;
  description: string;
  responsibilities: string;
  sharepointUrl: string;
  numberOfOpenPositions: number;
}
```

### Add a body schema

Use the existing Zod pattern in this file:

```typescript
export const CreateJobRoleRequestSchema = z.object({
  roleName: z.string().trim().min(1, "Role name is required"),
  location: z.string().trim().min(1, "Location is required"),
  capabilityId: z.coerce.number().int().positive("Capability is required"),
  bandId: z.coerce.number().int().positive("Band is required"),
  closingDate: z
    .string()
    .trim()
    .min(1, "Closing date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Closing date must be valid"),
  description: z.string().trim().min(1, "Description is required"),
  responsibilities: z.string().trim().min(1, "Responsibilities are required"),
  sharepointUrl: z.string().trim().url("SharePoint URL must be a valid URL"),
  numberOfOpenPositions: z.coerce
    .number()
    .int("Number of open positions must be an integer")
    .positive("Number of open positions must be greater than 0"),
});
```

Notes:

- Keep validation messages explicit because `validateBody` will expose them directly in the API response.
- UI validation is separate, but backend rules must mirror the required fields.

## Phase 2 - Add DAO Support For Metadata And Creation

**File:** `src/daos/jobRoleDao.ts`

Add DAO methods to support admin creation.

### Add metadata queries

Add methods to fetch dropdown data from the database:

```typescript
async findAllCapabilities(): Promise<Capability[]>;
async findAllBands(): Promise<Band[]>;
```

Recommended Prisma behaviour:

- sort capabilities by `capabilityName` ascending
- sort bands by `bandName` ascending

### Add existence checks

Add methods so the service can verify the submitted foreign keys before create:

```typescript
async findCapabilityById(capabilityId: number): Promise<Capability | null>;
async findBandById(bandId: number): Promise<Band | null>;
```

### Add create method

Add a DAO create method for a new job role:

```typescript
async createJobRole(data: {
  roleName: string;
  location: string;
  capabilityId: number;
  bandId: number;
  closingDate: Date;
  description: string;
  responsibilities: string;
  sharepointUrl: string;
  numberOfOpenPositions: number;
}): Promise<JobRoleWithRelations>
```

Implementation rules:

- persist `status: JobRoleStatusDto.Open`
- convert `closingDate` to a `Date` before persistence
- include `capability: true` and `band: true` in the create query result so the mapper can be reused

## Phase 3 - Add Explicit Domain Error For Invalid References

**File:** `src/errors/InvalidJobRoleReferenceError.ts` (new file)

Add a small explicit error type for missing capability/band references:

```typescript
export class InvalidJobRoleReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJobRoleReferenceError";
  }
}
```

Use this instead of a generic `Error` when submitted IDs do not point to existing database records.

## Phase 4 - Add Service Methods

**File:** `src/services/jobRoleService.ts`

Add the following methods to `JobRoleService`:

```typescript
async getJobRoleMetadata(): Promise<JobRoleMetadataResponseDto>
async createJobRole(data: CreateJobRoleRequestDto): Promise<JobRoleDetailedResponseDto>
```

### `getJobRoleMetadata`

Implementation rules:

- call the new DAO methods for capabilities and bands
- map them into:

```typescript
return {
  capabilities: capabilities.map((capability) => ({
    capabilityId: capability.capabilityId,
    capabilityName: capability.capabilityName,
  })),
  bands: bands.map((band) => ({
    bandId: band.bandId,
    bandName: band.bandName,
  })),
};
```

### `createJobRole`

Implementation rules:

1. Verify the capability exists.
2. Verify the band exists.
3. If either does not exist, throw `InvalidJobRoleReferenceError` with a precise message.
4. Call the DAO create method.
5. Return `this.jobRoleMapper.toDetailedResponse(createdJobRole)`.

Expected status logic:

- never read status from request data
- always persist `JobRoleStatusDto.Open`

## Phase 5 - Add Controller Methods

**File:** `src/controllers/jobRoleController.ts`

Add two new controller methods.

### `getJobRoleMetadata`

```typescript
async getJobRoleMetadata(_req: Request, res: Response): Promise<void>
```

Behaviour:

- call `this.jobRoleService.getJobRoleMetadata()`
- return `res.status(200).json(metadata)`
- on error, return `res.status(500).json({ error: "Internal server error" })`

### `createJobRole`

```typescript
async createJobRole(req: Request, res: Response): Promise<void>
```

Behaviour:

- rely on `validateBody(CreateJobRoleRequestSchema)` for shape validation
- call `this.jobRoleService.createJobRole(req.body)`
- return `res.status(201).json(createdJobRole)`
- catch `InvalidJobRoleReferenceError` and return:

```typescript
res.status(400).json({ error: error.message });
```

- all other failures return `res.status(500).json({ error: "Internal server error" })`

## Phase 6 - Wire Routes On The Existing Shared Surface

**File:** `src/routes/jobRoleRouter.ts`

Update the existing router instead of creating a new admin router.

Add imports:

```typescript
import { CreateJobRoleRequestSchema } from "../dtos/jobRoleDto.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
```

Add routes:

```typescript
router.get(
  "/metadata",
  authenticate,
  requireAdmin,
  jobRoleController.getJobRoleMetadata.bind(jobRoleController),
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  validateBody(CreateJobRoleRequestSchema),
  jobRoleController.createJobRole.bind(jobRoleController),
);
```

Important route-order rule:

- place `GET /metadata` before `GET /:id`, otherwise Express will treat `metadata` as an `id`

## Phase 7 - Tests

### `tests/controllers/jobRoleController.test.ts`

Add service mocks for:

- `getJobRoleMetadata`
- `createJobRole`

Add test suites:

#### `getJobRoleMetadata`

- returns 200 with `{ capabilities, bands }`
- returns 500 when service throws

#### `createJobRole`

- happy path: returns 201 with created job role
- invalid reference error: returns 400 with the explicit message
- generic failure: returns 500

### `tests/routes/jobRoleRouter.test.ts`

Update mocked service class to include:

- `getJobRoleMetadata`
- `createJobRole`

Add route coverage for `GET /api/job-roles/metadata`:

- missing auth header: returns 401
- authenticated non-admin user: returns 403
- authenticated admin user: returns 200 and delegates to controller/service

Add route coverage for `POST /api/job-roles`:

- missing auth header: returns 401
- authenticated non-admin user: returns 403
- invalid body: returns 400 from `validateBody`
- admin happy path: returns 201 with created job role

Use the existing JWT mock pattern by returning:

```typescript
{ userId: 1, email: "admin@example.com", role: "ADMIN" }
```

for admin requests.

### `tests/services/jobRoleService.test.ts`

Extend DAO mocks for:

- `findAllCapabilities`
- `findAllBands`
- `findCapabilityById`
- `findBandById`
- `createJobRole`

Add tests for `getJobRoleMetadata`:

- returns mapped capabilities and bands
- propagates DAO failure

Add tests for `createJobRole`:

- happy path: verifies capability and band lookup, DAO create call, and mapper usage
- missing capability: throws `InvalidJobRoleReferenceError`
- missing band: throws `InvalidJobRoleReferenceError`
- verifies status is not taken from the caller and is handled in persistence logic

### `tests/daos/jobRoleDao.test.ts`

Add DAO coverage for:

- `findAllCapabilities` queries Prisma capability table with ascending name order
- `findAllBands` queries Prisma band table with ascending name order
- `findCapabilityById` queries by `capabilityId`
- `findBandById` queries by `bandId`
- `createJobRole` calls `prisma.jobRole.create` with:
  - submitted job-role fields
  - `status: JobRoleStatusDto.Open`
  - included `capability` and `band` relations

### `tests/dtos/jobRoleDto.test.ts`

Add schema tests for `CreateJobRoleRequestSchema`:

- accepts a valid payload
- rejects missing `roleName`
- rejects non-positive `capabilityId`
- rejects non-positive `bandId`
- rejects invalid `closingDate`
- rejects invalid `sharepointUrl`
- rejects non-positive `numberOfOpenPositions`

## Files To Change

| File | Change |
|---|---|
| `src/dtos/jobRoleDto.ts` | Add create request DTO/schema and metadata response DTO |
| `src/daos/jobRoleDao.ts` | Add capability/band metadata queries, existence checks, and createJobRole |
| `src/errors/InvalidJobRoleReferenceError.ts` | New explicit domain error |
| `src/services/jobRoleService.ts` | Add metadata and create methods |
| `src/controllers/jobRoleController.ts` | Add metadata and create controller methods |
| `src/routes/jobRoleRouter.ts` | Add admin-only metadata and create routes |
| `tests/controllers/jobRoleController.test.ts` | Add controller coverage for metadata and create |
| `tests/routes/jobRoleRouter.test.ts` | Add route coverage for admin auth/403/body validation/create |
| `tests/services/jobRoleService.test.ts` | Add metadata and create service tests |
| `tests/daos/jobRoleDao.test.ts` | Add metadata and create DAO tests |
| `tests/dtos/jobRoleDto.test.ts` | Add schema tests for create payload |

## Pre-PR Checklist

1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm test`
5. `npm run test:coverage`
6. Manual API smoke check with an admin bearer token:

```bash
curl -H "Authorization: Bearer <admin-token>" http://127.0.0.1:4000/api/job-roles/metadata
```

7. Manual API smoke check for create:

```bash
curl -X POST http://127.0.0.1:4000/api/job-roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Senior Backend Engineer",
    "location": "Dublin",
    "capabilityId": 1,
    "bandId": 2,
    "closingDate": "2026-08-31",
    "description": "Own backend services and integrations.",
    "responsibilities": "Build APIs, review code, support delivery.",
    "sharepointUrl": "https://example.sharepoint.com/job-role",
    "numberOfOpenPositions": 2
  }'
```

Expected outcomes:

- metadata endpoint returns database-backed `capabilities` and `bands`
- create endpoint returns `201`
- created record is linked to the selected capability and band
- created record status is `Open`
- non-admin requests return `403 Forbidden`