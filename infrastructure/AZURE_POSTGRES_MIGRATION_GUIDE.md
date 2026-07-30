# Azure PostgreSQL Migration Guide (Dev)

This guide is the practical runbook for moving from local Docker PostgreSQL to Azure Database for PostgreSQL Flexible Server in the dev environment.

## What has already been implemented in code

- Terraform postgres module under infrastructure/modules/postgres
- Root Terraform wiring in infrastructure/main.tf, infrastructure/variables.tf, and infrastructure/outputs.tf
- CI workflow updates in .github/workflows/ci.yml for:
  - TF_VAR_db_admin_password
  - TF_VAR_allowed_ip_addresses
  - Prisma migration job on pushes to main
- Scheduled DB start/stop workflows:
  - .github/workflows/db-startup.yml
  - .github/workflows/db-shutdown.yml

## Steps to do now

### 1. Add GitHub Actions secrets and variables

Open repository settings:
Settings -> Secrets and variables -> Actions

Add Secrets:

- DB_ADMIN_PASSWORD
  - Strong password for PostgreSQL admin user
- DB_SERVER_NAME
  - Example: team3-postgres-dev
- DATABASE_URL
  - Leave temporarily blank until server FQDN is known

Add Variables:

- ALLOWED_IP_ADDRESSES
  - Terraform map syntax example:
  - {"yasmine" = "1.2.3.4", "teammate" = "5.6.7.8"}

Find each developer IP using:

curl ifconfig.me

### 2. Merge or push to main to provision database

Push these infrastructure/workflow changes to main.

Pipeline behavior on main push:

1. Terraform apply creates Azure PostgreSQL Flexible Server
2. Prisma migrate deploy applies existing migrations

### 3. Capture the PostgreSQL FQDN

After terraform apply completes, get FQDN from either:

- GitHub Actions terraform apply output
- Azure Portal PostgreSQL Flexible Server overview

Expected style:

team3-postgres-dev.postgres.database.azure.com

### 4. Set DATABASE_URL secret

Update DATABASE_URL in GitHub secrets to:

postgresql://team3admin:<password>@<fqdn>:5432/team3?sslmode=require

Important:

- Use username team3admin only (do not append @servername)
- Keep sslmode=require

### 5. Seed database once from local machine

From repository root, with Azure DATABASE_URL in your shell:

export DATABASE_URL="postgresql://team3admin:<password>@<fqdn>:5432/team3?sslmode=require"
npx prisma db seed

Seed is idempotent because it uses upsert.

### 6. Update local env for day-to-day Azure usage

Set local DATABASE_URL in .env to Azure when working against cloud DB:

DATABASE_URL=postgresql://team3admin:<password>@team3-postgres-dev.postgres.database.azure.com:5432/team3?sslmode=require

If needed for local tests, switch back to local Docker DB URL:

DATABASE_URL=postgresql://postgres:password@localhost:5432/team3

### 7. Verify end-to-end

- Terraform output includes postgres_fqdn
- Migrate job passes in GitHub Actions
- Seed data exists in Capability, Band, JobRole tables
- DB Shutdown workflow can stop the server
- DB Startup workflow can start the server

Suggested SQL checks in DBeaver:

SELECT * FROM "Capability";
SELECT * FROM "Band";
SELECT * FROM "JobRole";

## Ongoing schema change process

When changing prisma/schema.prisma:

1. Start local Docker DB
2. Run migration locally:

npx prisma migrate dev --name <descriptive-name>

3. Review generated migration.sql
4. Commit schema and migration files together
5. Merge to main
6. CI migrate job applies migration to Azure automatically

## If someone loses DB access later

If IP changes and DBeaver access fails:

1. Run curl ifconfig.me
2. Update ALLOWED_IP_ADDRESSES variable in GitHub
3. Push any commit to main so Terraform updates firewall rules

## Optional teardown

To destroy Azure DB resources when no longer needed:

cd infrastructure
export TF_VAR_db_admin_password="<YOUR_PASSWORD>"
terraform init -backend-config=backend-dev.hcl
terraform destroy

Warning: This permanently deletes the Azure PostgreSQL server and its data.
