---
applyTo: "src/**,tests/**,prisma/**"
description: "Ticket instructions for admin-only role application listing with CV access, hire/reject actions, and open-position updates."
---

# Admin Application Management For Job Roles (Backend)

## Ticket
As a Recruitment Admin

I want to see a list of applications for each role

So that I assess who should be hired

## Scope Clarification
- This ticket is backend-only.
- Frontend confirmation dialogs are out of scope for implementation, but backend endpoints must support the confirmation outcome actions (hire/reject).
- All behavior in this ticket must be admin-only.

## Acceptance Criteria Mapping (Backend)
- Job role details endpoint should return a list of applicants with application status.
- Each applicant entry should include enough information for frontend to render a clickable username and open CV from S3.
- If application status is `In Progress`, backend must allow transition to `Hired` and decrement open positions by 1.
- If application status is `In Progress`, backend must allow transition to `Rejected` without changing open positions.
- Non-admin users must not access these admin application-management behaviors.

## Existing Code Context (Use, Do Not Duplicate)
- Shared job role router already exists in `src/routes/jobRoleRouter.ts`.
- Admin auth middleware already exists (`authenticate`, `requireAdmin`) in `src/middleware/auth.ts`.
- Application creation already exists in `src/daos/jobRoleDao.ts` and defaults status to `In Progress`.
- S3 upload URL generation already exists in `src/services/s3Service.ts`.

## Authenticated User ID Rule (Match Existing CV Apply Flow)
- Follow the same pattern used in existing CV apply logic:
  - Read authenticated user identity from JWT claims populated by `authenticate` middleware (`req.user.userId`).
  - Do not accept `userId` from request body/query for authenticated actions.
- For this admin ticket, keep admin-only endpoints protected by `authenticate` + `requireAdmin` and trust the authenticated principal from JWT.

## Recommended API Contract

### 1. Admin role applications list
- **Method/path:** `GET /api/job-roles/:id/applications`
- **Auth:** `authenticate`, then `requireAdmin`
- **Params validation:** reuse `JobRoleIdParamSchema`
- **Success (`200`):**
  - role-level context: `jobRoleId`, `roleName`, `numberOfOpenPositions`
  - applicants array with at minimum:
    - `applicationId`
    - `userId`
    - `username` (see username source notes below)
    - `status`
    - `appliedAt`
    - `cvDownloadUrl` (short-lived presigned GET URL)
- **Errors:**
  - `401` unauthenticated
  - `403` non-admin
  - `404` role not found
  - `500` unexpected error

### 2. Hire action
- **Method/path:** `PATCH /api/job-roles/:id/applications/:applicationId/hire`
- **Auth:** `authenticate`, then `requireAdmin`
- **Success (`200`):** updated application + updated `numberOfOpenPositions`
- **Rules:**
  - Only allow when application status is `In Progress`
  - Update application status to `Hired`
  - Decrement `JobRole.numberOfOpenPositions` by `1`
  - Reject if `numberOfOpenPositions <= 0`
- **Recommended errors:**
  - `400` invalid status transition or no open positions
  - `404` job role or application not found / mismatched IDs
  - `409` race/conflict on concurrent update (optional but preferred)

### 3. Reject action
- **Method/path:** `PATCH /api/job-roles/:id/applications/:applicationId/reject`
- **Auth:** `authenticate`, then `requireAdmin`
- **Success (`200`):** updated application
- **Rules:**
  - Only allow when application status is `In Progress`
  - Update application status to `Rejected`
  - Do not change open positions

## DTO And Schema Updates

### 1. Extend application status enum
- File: `src/dtos/jobRoleDto.ts`
- Extend `JobRoleApplicationStatusDto` to include:
  - `InProgress = "In Progress"`
  - `Hired = "Hired"`
  - `Rejected = "Rejected"`

### 2. Add admin response DTOs
- Prefer adding DTO interfaces in existing job role DTO files (or a dedicated DTO file if already adopted).
- Add types for:
  - admin list response
  - application summary row
  - hire/reject action response

### 3. Add params schemas
- Add a schema for `applicationId` route params:
  - positive integer coercion with explicit error message

## DAO Changes
- File: `src/daos/jobRoleDao.ts`

### 1. Add admin list query
- Query applications for a role with related user data.
- Include ordering by `appliedAt desc`.
- Ensure query shape contains the user identity field used as username.

### 2. Add status update methods
- Methods to update application status by `applicationId` and `jobRoleId`.
- Implement guard checks:
  - current status must be `In Progress`
  - application belongs to target job role

### 3. Add atomic hire operation
- Use `prisma.$transaction` for hire flow:
  - read role/application state
  - validate role has open positions
  - validate valid transition
  - update application status to `Hired`
  - decrement open positions
- Prevent double-hire in concurrent admin actions.

## Service Changes
- File: `src/services/jobRoleService.ts`

### 1. Admin list method
- Add service method to fetch role applications and map data to admin list DTO.
- Generate presigned CV download URL for each applicant using S3 service.

### 2. Hire method
- Orchestrate DAO transaction.
- Return updated entity payload expected by controller.
- Throw explicit domain errors for:
  - invalid status transition
  - no open positions
  - missing resource

### 3. Reject method
- Update status from `In Progress` to `Rejected`.
- Preserve open positions.

## S3 Changes
- File: `src/services/s3Service.ts`

### Add presigned download support
- Add `getPresignedDownloadUrl(key: string)` using `GetObjectCommand` + `getSignedUrl`.
- Use short expiry (for example `300` seconds) to minimize risk.
- Do not expose bucket internals in API response beyond signed URL.

## Controller Changes
- File: `src/controllers/jobRoleController.ts`

Add handlers:
- `getJobRoleApplicationsForAdmin`
- `hireApplicant`
- `rejectApplicant`

Controller requirements:
- validate params
- map service domain errors to stable HTTP responses
- keep error messages safe (no DB internals)

## Route Wiring
- File: `src/routes/jobRoleRouter.ts`

Add admin-only routes on existing shared surface:
- `GET /:id/applications`
- `PATCH /:id/applications/:applicationId/hire`
- `PATCH /:id/applications/:applicationId/reject`

Use middleware order:
1. `authenticate`
2. `requireAdmin`
3. `validateParams(...)`
4. controller handler

## Username Source Note (Implementation Default)
- Current `User` model has `email` but no explicit `username` column in `prisma/schema.prisma`.
- For this ticket, use the existing user record from the application relation and expose:
  - `userId` for stable identity
  - `username` mapped from `email` until a dedicated username column exists
- If product later requires a separate username field, create a follow-up migration ticket.

## Error Handling Guidance
- Prefer explicit domain errors over generic `Error` for transition failures and missing references.
- Return consistent status codes from controller boundaries.
- Avoid leaking Prisma error details in responses.

## Test Plan (Required)

### Unit tests
- `tests/services/jobRoleService.test.ts`
  - admin list maps applicants and includes presigned CV URLs
  - hire transitions `In Progress -> Hired` and decrements open positions
  - reject transitions `In Progress -> Rejected` and does not decrement positions
  - invalid transitions throw expected domain error
  - hire fails when no open positions remain

- `tests/controllers/jobRoleController.test.ts`
  - list endpoint returns `200` with expected payload
  - hire/reject map domain errors to expected HTTP codes

- `tests/daos/jobRoleDao.test.ts`
  - transaction behavior for hire path
  - guard against non-`In Progress` updates

- `tests/services/s3Service.test.ts`
  - presigned download URL generation

### Route/integration checks
- `tests/routes/jobRoleRouter.test.ts`
  - `401` unauthenticated access blocked
  - `403` non-admin access blocked
  - admin can list applications
  - admin can hire/reject valid `In Progress` applications

## Manual Verification Checklist
Run from project root:
1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm test`
5. `npm run test:coverage`

Optional API smoke checks once app is running:
1. `curl http://127.0.0.1:4000/health`
2. `curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://127.0.0.1:4000/api/job-roles/<ROLE_ID>/applications`
3. `curl -X PATCH -H "Authorization: Bearer <ADMIN_TOKEN>" http://127.0.0.1:4000/api/job-roles/<ROLE_ID>/applications/<APPLICATION_ID>/hire`
4. `curl -X PATCH -H "Authorization: Bearer <ADMIN_TOKEN>" http://127.0.0.1:4000/api/job-roles/<ROLE_ID>/applications/<APPLICATION_ID>/reject`

## Done Criteria
- Admin-only application list endpoint exists and returns status + CV download URL.
- Hire action updates status and decrements open positions atomically.
- Reject action updates status only.
- No unauthorized access.
- Tests cover happy paths and key failure paths.
- Formatting, lint, tests, and coverage complete.
