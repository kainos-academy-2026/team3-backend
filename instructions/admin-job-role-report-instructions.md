---
applyTo: "src/**,tests/**,prisma/**"
description: "Ticket instructions for admin job role CSV export endpoint and behavior."
---

# Admin Job Role Report Ticket Instructions (Backend)

## Ticket
As an Admin

I want to generate a report of all job roles

So that I can provide an up to date export to stakeholders

## Acceptance Criteria Mapping
- A CSV file is downloaded in the browser containing all job role information.
- Report generation is available from the job roles last page in the frontend.

## Backend Responsibilities
- Provide an API endpoint to return a CSV report of all job roles.
- Ensure only authenticated admins can access this endpoint.
- Return proper download headers so browsers treat the response as a file.

## Required API Behavior
- Route: GET /api/job-roles/report
- Middleware: authenticate then requireAdmin
- Success:
  - Status 200
  - Content-Type: text/csv; charset=utf-8
  - Content-Disposition: attachment; filename="job-roles-report-YYYY-MM-DD.csv"
  - Body: CSV payload with all required columns
- Errors:
  - 401 if unauthenticated
  - 403 if authenticated but non-admin
  - 500 for unexpected failures

## CSV Content Requirements
Include all job role fields needed by stakeholders, at minimum:
- id
- roleName
- location
- capability
- band
- closingDate
- status
- description
- responsibilities
- sharepointUrl
- numberOfOpenPositions

CSV formatting rules:
- Include header row.
- Escape quotes by doubling them.
- Quote values to safely handle commas and special characters.
- Format dates consistently (YYYY-MM-DD).

## Suggested Layering
- Route: register /report endpoint and middleware order.
- Controller: set headers and send CSV response.
- Service: build CSV string from DAO data.
- DAO: reuse/find all job role query including needed relations.

## Test Requirements (Backend)
Add/update tests for:
- Service CSV generation:
  - contains header row
  - handles quotes and commas safely
- Controller:
  - sets download headers
  - sends CSV payload
  - returns 500 on failure
- Route/integration:
  - 401 without auth
  - 403 for non-admin
  - 200 for admin with CSV response

## Done Criteria (Backend)
- Endpoint implemented and protected.
- CSV content complete and well formatted.
- Tests updated and passing.
- No regression to existing job role endpoints.
