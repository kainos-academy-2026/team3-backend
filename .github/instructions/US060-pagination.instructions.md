---
applyTo: "src/**,tests/**"
description: "US060 pagination instructions for GET /api/job-roles using limit/page query params and navigation links."
---

# US060 Job Roles Pagination - Backend First

## Ticket Intent

Prevent crashes when many job roles exist by returning paged results from the backend and supporting frontend navigation controls for first, next, previous, and last.

## Scope Clarification

- This repository contains backend implementation only.
- Frontend list-page controls are out of scope for code changes here, but this backend contract is designed to support them.
- Endpoint for this ticket is `GET /api/job-roles` (mounted from `src/app.ts`).

## Acceptance Criteria Mapped To Backend

- Update `GET /api/job-roles` to return only a subset of rows based on query params.
- Default response page size is 10.
- Request supports query params to define page size and page start position:
	- `limit` controls number of rows returned.
	- `page` (1-based) controls where results begin.
- Response includes navigation links for:
	- first
	- next
	- previous
	- last
- Invalid query values return `400` with validation errors.

## Confirmed Decisions

- Query params: `limit` and `page`.
- Page index: 1-based (`page=1` is first page).
- Defaults and caps: default `limit=10`, max `limit=30`.
- Invalid params: reject with `400` (no auto-clamping).
- Sort order: `id` descending (newest inserted first).
- Out-of-range pages: return empty `data` with consistent metadata.
- Links format: relative URLs; unavailable links are `null`.

## API Contract

### Request

- Method: `GET`
- Path: `/api/job-roles`
- Query params:
	- `limit` optional, integer, min 1, max 30, default 10
	- `page` optional, integer, min 1, default 1

### Success Response (200)

```json
{
	"data": [
		{
			"id": 1,
			"roleName": "Backend Engineer",
			"location": "Dublin",
			"capability": {
				"capabilityId": 10,
				"capabilityName": "Engineering"
			},
			"band": {
				"bandId": 3,
				"bandName": "Band 3"
			},
			"closingDate": "2026-08-31",
			"status": "Open"
		}
	],
	"pagination": {
		"totalItems": 57,
		"totalPages": 6,
		"currentPage": 1,
		"pageSize": 10,
		"hasNext": true,
		"hasPrevious": false
	},
	"links": {
		"first": "/api/job-roles?limit=10&page=1",
		"next": "/api/job-roles?limit=10&page=2",
		"previous": null,
		"last": "/api/job-roles?limit=10&page=6"
	}
}
```

### Validation Failure (400)

```json
{
	"errors": [
		{
			"field": "limit",
			"message": "Limit must not exceed 30"
		}
	]
}
```

## Implementation Plan

### Phase 1 - DTO And Validation Schema

**File:** `src/dtos/jobRoleDto.ts`

- Add `JobRolePaginationQuerySchema` with defaults and limits.
- Add pagination response DTOs for metadata and links.

### Phase 2 - Query Middleware

**File:** `src/middleware/validate.ts`

- Add `validateQuery(schema)` middleware.
- Keep error response shape consistent with existing validation middleware.

### Phase 3 - Route Wiring

**File:** `src/routes/jobRoleRouter.ts`

- Apply `validateQuery(JobRolePaginationQuerySchema)` to `GET /`.

### Phase 4 - DAO Pagination

**File:** `src/daos/jobRoleDao.ts`

- Add paginated read method using Prisma `skip` + `take`.
- Add total-count method.
- Use deterministic ordering `orderBy: { id: "desc" }`.

### Phase 5 - Service Orchestration

**File:** `src/services/jobRoleService.ts`

- Accept pagination query DTO.
- Fetch paged rows and total count (prefer parallel).
- Map entities with existing mapper.
- Compute metadata and links.

### Phase 6 - Controller Response

**File:** `src/controllers/jobRoleController.ts`

- Parse query via pagination schema.
- Return paginated contract from service.
- Keep existing 500 handling style.

### Phase 7 - Tests

- `tests/middleware/validate.test.ts`
	- valid query passes
	- invalid query returns 400
- `tests/daos/jobRoleDao.test.ts`
	- paginated query uses `skip`, `take`, `orderBy`
	- count query returns total
- `tests/services/jobRoleService.test.ts`
	- metadata and links generated correctly
	- out-of-range page returns empty data with correct metadata
- `tests/controllers/jobRoleController.test.ts`
	- query is parsed and forwarded
	- response shape is paginated
- `tests/routes/jobRoleRouter.test.ts`
	- `GET /api/job-roles` returns paginated response
	- invalid `limit/page` returns 400 with field messages

## Done Criteria

- All changed files follow backend layering standards.
- Unit/integration tests updated and passing.
- Endpoint supports `limit/page` query params with defaults.
- Response includes pagination metadata and first/next/previous/last links.
- Validation rejects invalid pagination params with 400.

## Pre-PR Verification

Run from project root:

1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm test`
5. `npm run test:coverage`

Smoke checks:

1. `curl http://127.0.0.1:4000/health`
2. `curl "http://127.0.0.1:4000/api/job-roles?limit=10&page=1"`
3. `curl "http://127.0.0.1:4000/api/job-roles?limit=10&page=2"`
4. `curl "http://127.0.0.1:4000/api/job-roles?limit=31&page=1"` (expect 400)
5. `curl "http://127.0.0.1:4000/api/job-roles?limit=10&page=0"` (expect 400)
