Ticket: Apply For Role Authorization (Backend Only)
Date: 2026-07-14

Goal
- Keep job role listing and job role details public.
- Require authentication for apply endpoint.
- Bind application submission to authenticated user identity from token, not request body.
- Avoid unrelated refactors or changes to other developers' logic.

Scope
- Backend only.
- No frontend changes in this ticket.

Acceptance Criteria Mapping
1) Recruitment Admin must have access to all endpoints
- This ticket does not restrict admin access.
- Authenticated admins can still apply and access protected endpoints.

2) Applicant user only has access to list/info endpoints, not create/update/delete
- For this ticket, list/info remain public.
- Apply is authenticated only.
- Role-based create/update/delete controls can be handled in separate endpoint-specific tickets if required.

3) Non-logged in users should be redirected to login page
- Backend APIs return 401 for unauthenticated requests.
- Redirect behavior is frontend responsibility.

4) Token required on all API endpoints other than Registration and Login
- Current ticket exception: keep GET /api/job-roles and GET /api/job-roles/:id public.
- Enforce token on POST /api/job-roles/:id/apply.

Required Code Changes
1) Route protection
File: src/routes/jobRoleRouter.ts
- Add authenticate middleware only to POST /:id/apply.
- Keep GET / and GET /:id unchanged (public).

2) Controller authorization binding
File: src/controllers/jobRoleController.ts
- In applyForJobRole, read userId from req.user?.userId.
- Return 401 when req.user is missing.
- Do not accept userId from request body.
- Keep existing fileName/contentType validation and service call behavior.

3) Middleware and token behavior
File: src/middleware/auth.ts
- Ensure authenticate reads Bearer token and sets req.user payload.
- Return 401 for missing/invalid token.

File: src/services/jwtTokenService.ts
- Ensure token includes role in create().
- verify() should validate payload shape and return null when invalid.

Testing Requirements
1) Controller tests
File: tests/controllers/jobRoleController.test.ts
- applyForJobRole success test must include req.user.
- no-auth apply test should return 401.
- missing field test should return 400.
- service error test should return 500.

2) Route tests
File: tests/routes/jobRoleRouter.test.ts
- POST apply without Authorization header returns 401.
- POST apply with invalid token returns 401.
- POST apply with valid token returns 200 and calls service with authenticated userId.
- GET list/details remain public and unchanged.

3) Middleware and token coverage tests
File: tests/middleware/auth.test.ts
- requireAdmin returns 403 for non-admin.
- requireAdmin calls next for admin.

File: tests/services/jwtTokenService.test.ts
- verify returns null when decoded role is not a string.

Out of Scope
- Frontend redirects and UI role-gating.
- New create/update/delete authorization rules for other endpoints.
- Schema or migration work unrelated to apply auth.

Definition of Done
- All required tests pass.
- Apply endpoint cannot be used without valid Bearer token.
- Controller no longer trusts client-supplied userId for apply.
- Public list and details endpoints remain accessible without token.
- No unrelated files changed.

Suggested Run Commands
- npm test -- tests/controllers/jobRoleController.test.ts tests/routes/jobRoleRouter.test.ts tests/middleware/auth.test.ts tests/services/jwtTokenService.test.ts
- npm run test:coverage
