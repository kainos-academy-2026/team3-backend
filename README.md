# team3-backend
 
Backend API for Team 3, built with Node.js, TypeScript, Express, Prisma 7, and Postgres.
 
## Prerequisites
 
- Node.js 22+
- npm
- Docker Desktop (or Docker Engine with Compose)
- DBeaver
 
## First-Time Setup
 
1. Clone the repository and open it:
 
```bash
git clone https://github.com/kainos-academy-2026/team3-backend.git
cd team3-backend
```
 
2. Install dependencies:
 
```bash
npm install
```
 
3. Create a root `.env` file:
 
```env
DATABASE_URL=url-here
```
 
4. Start Postgres in Docker:
 
```bash
npm run db:up
```

5. Add the new database connection to DBeaver
```
database: team3
username: postgres
password: password
```
 
6. Apply Prisma migrations:
 
```bash
npm run prisma:migrate
```

7. Build the Prisma Client:

```bash
npx prisma generate
 ```

8. Seed initial data:
 
```bash
npm run prisma:seed
```
 
9. Start the API in development mode:
 
```bash
npm run dev
```
 
You should see:
 
```text
Server running on http://localhost:4000
```
 
## Verify Endpoints
 
Use browser, Postman or curl.
 
- Health check: `GET http://127.0.0.1:4000/health`
- Job roles: `GET http://127.0.0.1:4000/api/job-roles`
 
Example with curl:
 
```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4000/api/job-roles
```

## API Reference

### GET /health

Returns a simple liveness payload.

Example response (`200 OK`):

```json
{
	"status": "UP",
	"timestamp": "2026-07-07T10:22:34.123Z"
}
```

### GET /api/job-roles

Returns all job roles.

Example response (`200 OK`):

```json
[
	{
		"id": 1,
		"roleName": "Software Engineer",
		"location": "Belfast",
		"capability": {
			"capabilityId": 2,
			"capabilityName": "Engineering"
		},
		"band": {
			"bandId": 3,
			"bandName": "Associate"
		},
		"closingDate": "2026-08-01",
		"status": "Open"
	}
]
```


### GET /api/job-roles

Returns a unique job role based on an id.

```json
{
	"id":1,
	"roleName":"Backend Engineer",
	"location":"Dublin",
	"capability": {
		"capabilityId":1,
		"capabilityName":"Engineering"
	},"band": {
		"bandId":1,
		"bandName":"Associate"
	},
	"closingDate":"2026-08-31",
	"status":"Open",
	"description":"Responsible for server-side web application logic and integration of the work front-end developers do.",
	"responsibilities":"Design and implement backend services, APIs, and databases.",
	"sharepointUrl":"https://example.com/backend-engineer",
	"numberOfOpenPositions":3
}
```

## Build

Compile the TypeScript source into `dist`:

```bash
npm run build
```

Run the compiled server:

```bash
npm run start
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

Open the Vitest UI:

```bash
npm run test:ui
```

## Linting and Formatting

Format the codebase:

```bash
npm run format
```

Lint the codebase:

```bash
npm run lint
```

Lint and apply fixes:

```bash
npm run lint:fix
```

Run Biome checks with safe fixes:

```bash
npm run check
```

Run CI-style validation:

```bash
npm run ci:check
```

## Useful Scripts

- `npm run dev` - start dev server with watch mode
- `npm run build` - compile TypeScript to `dist`
- `npm run start` - run compiled server
- `npm run db:up` - start Postgres container
- `npm run db:down` - stop Postgres container
- `npm run prisma:migrate` - apply local migrations
- `npx prisma generate` - Build the Prisma Client
- `npm run prisma:seed` - seed database
- `npm run prisma:studio` - open Prisma Studio
- `npm test` - run test suite
- `npm run test:watch` - run tests in watch mode
- `npm run test:coverage` - run tests with coverage
- `npm run test:ui` - open the Vitest UI
- `npm run format` - format the codebase
- `npm run lint` - lint the codebase
- `npm run lint:fix` - lint and apply fixes
- `npm run check` - run Biome checks with fixes
- `npm run ci:check` - run Biome in CI mode
 
## Troubleshooting
 
### Request stays pending
 
1. Confirm the server is running in the terminal.
2. Test with IPv4 explicitly:
 
```bash
curl -v --max-time 3 http://127.0.0.1:4000/health
```
 
3. Check what process owns port 4000:
 
```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
```
 
4. If needed, run on another port:
 
```bash
PORT=4001 npm run dev
```
 
### Empty array from /api/job-roles
 
Database is reachable but has no rows. Re-run:
 
```bash
npm run prisma:migrate
npm run prisma:seed
```
 
### Prisma client initialization error
 
Check that `.env` exists and `DATABASE_URL` is set.


 