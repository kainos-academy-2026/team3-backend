---
applyTo: "**"
description: "Team 3 backend standards for naming, file placement, architecture layering, and pre-PR verification commands. Use when creating or editing backend files."
---
 
# Team 3 Backend Standards
 
## Purpose
Use these rules for all backend changes to keep naming, structure, and verification consistent before opening a PR.
This file must be used for every new ticket scenario.
 
## Naming Standards
- Use clear, intent-based names.
- Prefer camelCase for variables, functions, and file names.
- Use PascalCase for classes, types, and interfaces.
- Use singular class names for domain units.
- Keep file names aligned with responsibility and suffix pattern:
  - Controllers: `src/controllers/*Controller.ts`
  - Services: `src/services/*Service.ts`
  - DAOs: `src/daos/*Dao.ts`
  - DTOs and validation schemas: `src/dtos/*Dto.ts`
  - Routes: `src/routes/*Router.ts`
  - Middleware: `src/middleware/*.ts`
  - Mappers: `src/mappers/*Mapper.ts`
  - Tests: `tests/**/<sourceName>.test.ts`
 
## File Placement And Layering
- Routes handle endpoint registration and dependency wiring only.
- Controllers handle HTTP request/response concerns only.
- Services hold business logic and orchestration.
- DAOs handle database access and Prisma calls.
- DTOs define request/response shapes and schema validation.
- Mappers transform DAO/database models into API response DTOs.
- Keep flow one direction: routes -> controllers -> services -> DAOs.
 
## Error Handling
- Prefer explicit domain errors over generic `Error` where possible.
- Return consistent HTTP status codes from controller boundaries.
- Avoid leaking internal DB details in API responses.
 
## Test And Quality Expectations
- Add or update tests whenever behavior changes.
- Mirror source structure in `tests/`.
- Cover happy path and key failure path for new logic.
 
## Pre-PR Manual Checklist
Run these from project root before pushing and before uploading coverage:
 
1. Format code
   - `npm run format`
2. Lint and auto-fix
   - `npm run lint:fix`
3. Verify no lint issues remain
   - `npm run lint`
4. Run unit tests
   - `npm test`
5. Generate coverage report
   - `npm run test:coverage`
 
## API Smoke Checks With curl
Run smoke checks after the app is running and before PR submission:
 
1. Health endpoint
   - `curl http://127.0.0.1:4000/health`
2. Job roles endpoint
   - `curl http://127.0.0.1:4000/api/job-roles`
 
Expected outcome:
- Health returns status payload.
- Job roles returns valid JSON array/object response.
 
## Submission Gate
Before uploading coverage or creating a PR, confirm all are true:
- Formatting complete.
- Lint passing.
- Tests passing.
- Coverage generated.
- curl smoke checks passing.
- Changed files follow naming and folder standards.
- New behavior is reflected in tests.
 