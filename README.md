# team3-backend
 
Backend API for Team 3, built with Node.js, TypeScript, Express, Prisma 7, and Postgres.
 
## Prerequisites
 
- Node.js 22+
- npm
- Docker Desktop (or Docker Engine with Compose)
 
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
 
5. Apply Prisma migrations:
 
```bash
npm run prisma:migrate
```
 
6. Seed initial data:
 
```bash
npm run prisma:seed
```
 
7. Start the API in development mode:
 
```bash
npm run dev
```
 
You should see:
 
```text
Server running on http://localhost:3000
```
 
## Verify Endpoints
 
Use browser, Postman or curl.
 
- Health check: `GET http://127.0.0.1:3000/health`
- Job roles: `GET http://127.0.0.1:3000/api/job-roles`
 
Example with curl:
 
```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/api/job-roles
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
curl -v --max-time 3 http://127.0.0.1:3000/health
```
 
3. Check what process owns port 3000:
 
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```
 
4. If needed, run on another port:
 
```bash
PORT=3001 npm run dev
```
 
### Empty array from /api/job-roles
 
Database is reachable but has no rows. Re-run:
 
```bash
npm run prisma:migrate
npm run prisma:seed
```
 
### Prisma client initialization error
 
Check that `.env` exists and `DATABASE_URL` is set.
 