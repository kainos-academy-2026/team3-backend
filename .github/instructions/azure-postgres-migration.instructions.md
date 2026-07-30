---
description: "Step-by-step instructions to provision Azure Database for PostgreSQL Flexible Server via Terraform and migrate the local Docker Postgres setup to it."
applyTo: "infrastructure/**,.github/workflows/**"
---

# Azure PostgreSQL Flexible Server Migration

Migrate the local Docker-based PostgreSQL 16 database to Azure Database for PostgreSQL Flexible Server.
Scoped to the `dev` environment. Data is seeded via the existing Prisma seed script — no dump/restore required.

---

## Prerequisites

Confirm the following before starting:

- Azure CLI installed and logged in: `az login`
- Terraform >= 1.x installed: `terraform -version`
- Node.js 20+ and npm installed
- The existing GitHub Actions secrets are already configured:
  - `AZURE_CLIENT_ID`
  - `AZURE_CLIENT_SECRET`
  - `AZURE_SUBSCRIPTION_ID`
  - `AZURE_TENANT_ID`
- The remote Terraform state backend is already set up (see `infrastructure/backend-dev.hcl`)

---

## Phase 1 — Terraform Module

Create the module at `infrastructure/modules/postgres/`. This follows the same pattern as `infrastructure/modules/resource-group/`.

### 1.1 `infrastructure/modules/postgres/variables.tf`

```hcl
variable "resource_group_name" {
  description = "Name of the Azure resource group to deploy into"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "UK South"
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be dev, test, or prod."
  }
}

variable "server_name" {
  description = "Unique name for the PostgreSQL Flexible Server (must be globally unique in Azure)"
  type        = string
}

variable "admin_login" {
  description = "Administrator username for the PostgreSQL server"
  type        = string
}

variable "admin_password" {
  description = "Administrator password for the PostgreSQL server"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.admin_password) >= 8
    error_message = "Admin password must be at least 8 characters."
  }
}

variable "db_name" {
  description = "Name of the initial database to create on the server"
  type        = string
  default     = "team3"
}

# Map of label => IP address. Each entry creates one firewall rule.
variable "allowed_ip_addresses" {
  description = "Map of friendly name to IP address allowed through the server firewall"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### 1.2 `infrastructure/modules/postgres/main.tf`

```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_postgresql_flexible_server" "postgres" {
  name                = var.server_name
  resource_group_name = var.resource_group_name
  location            = var.location
  version             = "16"

  administrator_login    = var.admin_login
  administrator_password = var.admin_password

  # Cheapest burstable SKU — appropriate for a dev/hypothetical project
  sku_name = "B_Standard_B1ms"

  storage_mb                = 32768 # 32GB — Azure minimum; sufficient for seed data
  storage_auto_grow_enabled = false  # Caps storage at 32GB to prevent unexpected cost growth

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  tags = merge(
    var.tags,
    {
      environment = var.environment
      managed_by  = "terraform"
    }
  )
}

resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.postgres.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ips" {
  for_each = var.allowed_ip_addresses

  name             = "allow-${each.key}"
  server_id        = azurerm_postgresql_flexible_server.postgres.id
  start_ip_address = each.value
  end_ip_address   = each.value
}
```

### 1.3 `infrastructure/modules/postgres/outputs.tf`

```hcl
output "server_fqdn" {
  description = "The fully qualified domain name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.postgres.fqdn
}

output "server_name" {
  description = "The name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.postgres.name
}

output "db_name" {
  description = "The name of the created database"
  value       = azurerm_postgresql_flexible_server_database.db.name
}
```

---

## Phase 2 — Wire the Module into Root Infrastructure

### 2.1 Add new variables to `infrastructure/variables.tf`

Append these to the existing file:

```hcl
variable "db_server_name" {
  description = "Globally unique name for the PostgreSQL Flexible Server"
  type        = string
  default     = "team3-postgres-dev"
}

variable "db_admin_login" {
  description = "Administrator username for the PostgreSQL server"
  type        = string
  default     = "team3admin"
}

variable "db_admin_password" {
  description = "Administrator password for the PostgreSQL server"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "team3"
}

# Find your current IP with: curl ifconfig.me
# Each team member who needs direct DB access must add their IP here.
variable "allowed_ip_addresses" {
  description = "Map of label => IP address to whitelist on the server firewall"
  type        = map(string)
  default     = {}
}
```

### 2.2 Add the module block to `infrastructure/main.tf`

Append after the existing `module "resource_group"` block:

```hcl
module "postgres" {
  source = "./modules/postgres"

  resource_group_name  = module.resource_group.resource_group_name
  location             = var.location
  environment          = var.environment
  server_name          = var.db_server_name
  admin_login          = var.db_admin_login
  admin_password       = var.db_admin_password
  db_name              = var.db_name
  allowed_ip_addresses = var.allowed_ip_addresses

  tags = {
    Project = "team3-backend"
  }
}
```

### 2.3 Add the FQDN output to `infrastructure/outputs.tf`

Append to the existing file:

```hcl
output "postgres_fqdn" {
  description = "The FQDN of the Azure PostgreSQL Flexible Server"
  value       = module.postgres.server_fqdn
}
```

---

## Phase 3 — Configure GitHub Actions Secrets and Variables

Go to the repository → **Settings** → **Secrets and variables** → **Actions**.

### Secrets to add

| Secret name | Value |
|---|---|
| `DB_ADMIN_PASSWORD` | A strong password for the PostgreSQL admin account. Must be 8–128 characters, containing characters from at least three of: uppercase letters, lowercase letters, numbers, symbols. Do not include the admin login name in the password. Store this in your password manager. |
| `DATABASE_URL` | Leave blank for now — fill in after Phase 4 once the FQDN is known. Format: `postgresql://team3admin:<password>@<fqdn>:5432/team3?sslmode=require` |
| `DB_SERVER_NAME` | The value used for `db_server_name`, e.g. `team3-postgres-dev`. Used by the auto-shutdown workflows. |

### Variables to add (not secrets — these are not sensitive)

Under the **Variables** tab (same Settings page):

| Variable name | Value | Purpose |
|---|---|---|
| `ALLOWED_IP_ADDRESSES` | See format below | Firewall rules for direct DB access (e.g. developer machines) |

`ALLOWED_IP_ADDRESSES` must be a JSON object in Terraform map syntax. Find each developer's IP with `curl ifconfig.me`, then set:

```
{"your-name" = "1.2.3.4", "colleague-name" = "5.6.7.8"}
```

> Each team member who needs direct database access (e.g. via DBeaver) must have their IP listed here. If left as `{}`, only Azure-hosted services with a firewall rule will be able to connect.

---

## Phase 4 — Wire the Password into the Existing Terraform CI/CD Job

The existing `terraform` job in `.github/workflows/ci.yml` already runs `terraform plan` on PRs and `terraform apply` on push to `main`. You only need to add two environment variables to its `env:` block.

In `.github/workflows/ci.yml`, find the `terraform` job's `env:` block (which currently ends with `TF_VAR_environment: dev`) and append these two lines:

```yaml
      TF_VAR_db_admin_password: ${{ secrets.DB_ADMIN_PASSWORD }}
      TF_VAR_allowed_ip_addresses: ${{ vars.ALLOWED_IP_ADDRESSES }}
```

Terraform reads `TF_VAR_*` environment variables as input variables automatically — no `-var` flags needed.

After the next push to `main`, the `terraform apply` step will create the PostgreSQL server. Retrieve the FQDN from the `Terraform apply` step output in GitHub Actions, or from the Azure Portal under the new PostgreSQL Flexible Server resource.

The FQDN will look like: `team3-postgres-dev.postgres.database.azure.com`

Now go back and update the `DATABASE_URL` secret (Phase 3) with the full connection string:

```
postgresql://team3admin:<password>@team3-postgres-dev.postgres.database.azure.com:5432/team3?sslmode=require
```

> **Flexible Server note:** Unlike the old Azure Single Server, the username does NOT include `@servername`. Use the plain login name only (e.g. `team3admin`, not `team3admin@team3-postgres-dev`). `sslmode=require` is mandatory.

---

## Phase 5 — Automate Migrations and Run Seed

### 5.1 Add a migration job to `.github/workflows/ci.yml`

Migrations run automatically on every push to `main`, after `terraform apply`. This ensures any new migration files added in future PRs are applied to the database without a manual step.

Add this job to `.github/workflows/ci.yml`:

```yaml
  migrate:
    name: Run Prisma Migrations
    runs-on: ubuntu-latest
    needs: terraform
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - name: Apply migrations
        run: npx prisma migrate deploy
```

`prisma migrate deploy` (not `migrate dev`) applies existing migration files without generating new ones or prompting interactively. It tracks which migrations have already run and skips them — safe to execute on every deploy.

### 5.2 Seed the database (manual, once-off)

The seed only needs to run once after the database is first created. It is not added to CI because seeding on every deployment is not standard practice.

Run this from your local machine after updating your `.env`:

```bash
# From the project root
export DATABASE_URL="postgresql://team3admin:<password>@<fqdn>:5432/team3?sslmode=require"
npx prisma db seed
```

The seed (`prisma/seed.ts`) uses `upsert`, so it is safe to re-run if needed.

### 5.3 Update your local `.env`

Update `DATABASE_URL` in your local `.env` to point to Azure:

```
DATABASE_URL=postgresql://team3admin:<password>@team3-postgres-dev.postgres.database.azure.com:5432/team3?sslmode=require
```

> If you still need to run tests against the local Docker database, switch `DATABASE_URL` back to `postgresql://postgres:password@localhost:5432/team3` when running tests, or keep a separate `.env.test`.

### 5.4 Add a firewall rule for the hosted app (if applicable)

If the backend app is running in an Azure Container App or App Service, add a firewall rule for its outbound IP:

```bash
az postgres flexible-server firewall-rule create \
  --resource-group team3-rg \
  --name team3-postgres-dev \
  --rule-name allow-container-app \
  --start-ip-address <CONTAINER_APP_OUTBOUND_IP> \
  --end-ip-address <CONTAINER_APP_OUTBOUND_IP>
```

Alternatively, add it to the `ALLOWED_IP_ADDRESSES` GitHub Actions variable so Terraform manages it going forward.

---

## Phase 6 — Auto-Shutdown GitHub Actions Workflows

Azure Database for PostgreSQL Flexible Server does not support native scheduled shutdown. Instead, two GitHub Actions workflows handle start and stop via the Azure CLI.

> **UK timezone note:** GitHub Actions cron runs in UTC.
> - In **winter (GMT, UTC+0):** `0 17` = 5pm, `0 9` = 9am — matches UK time exactly.
> - In **summer (BST, UTC+1):** `0 17` = 6pm UK time, `0 9` = 10am UK time.
>
> Adjust the cron hour by `-1` (e.g. `0 16` and `0 8`) during BST if exact 5pm/9am UK time is required.

### 6.1 Create `.github/workflows/db-shutdown.yml`

```yaml
name: DB Shutdown

on:
  schedule:
    - cron: '0 17 * * 1-5' # 5pm UTC Mon-Fri (5pm GMT / 6pm BST)
  workflow_dispatch:

jobs:
  shutdown:
    name: Stop PostgreSQL Flexible Server
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: '{"clientId":"${{ secrets.AZURE_CLIENT_ID }}","clientSecret":"${{ secrets.AZURE_CLIENT_SECRET }}","subscriptionId":"${{ secrets.AZURE_SUBSCRIPTION_ID }}","tenantId":"${{ secrets.AZURE_TENANT_ID }}"}'

      - name: Stop server
        run: |
          az postgres flexible-server stop \
            --resource-group team3-rg \
            --name ${{ secrets.DB_SERVER_NAME }}
```

### 6.2 Create `.github/workflows/db-startup.yml`

```yaml
name: DB Startup

on:
  schedule:
    - cron: '0 9 * * 1-5' # 9am UTC Mon-Fri (9am GMT / 10am BST)
  workflow_dispatch:

jobs:
  startup:
    name: Start PostgreSQL Flexible Server
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: '{"clientId":"${{ secrets.AZURE_CLIENT_ID }}","clientSecret":"${{ secrets.AZURE_CLIENT_SECRET }}","subscriptionId":"${{ secrets.AZURE_SUBSCRIPTION_ID }}","tenantId":"${{ secrets.AZURE_TENANT_ID }}"}'

      - name: Start server
        run: |
          az postgres flexible-server start \
            --resource-group team3-rg \
            --name ${{ secrets.DB_SERVER_NAME }}
```

> Both workflows include `workflow_dispatch` so they can be triggered manually from the GitHub Actions UI at any time.

---

## Phase 7 — Verification

Run these checks after completing all phases:

1. **Confirm FQDN:** Check the `Terraform apply` step output in GitHub Actions, or run `terraform output postgres_fqdn` locally from `infrastructure/` after `terraform init -backend-config=backend-dev.hcl`.

2. **Connect via DBeaver:**
   - Host: `<fqdn>` (from Terraform output)
   - Port: `5432`
   - Database: `team3`
   - Username: `team3admin`
   - Password: your admin password
   - SSL mode: `require`

3. **Check migrations:** Confirm the `migrate` job passed in GitHub Actions. Optionally verify locally: `npx prisma migrate status` (requires `DATABASE_URL` set in your shell or `.env`).

4. **Check seed data:** In DBeaver, run:
   ```sql
   SELECT * FROM "Capability";
   SELECT * FROM "Band";
   SELECT * FROM "JobRole";
   ```

5. **Test auto-shutdown:** Go to GitHub Actions → **DB Shutdown** → **Run workflow** manually and confirm the server stops in the Azure Portal (status changes to `Stopped`).

6. **Test auto-startup:** Go to GitHub Actions → **DB Startup** → **Run workflow** manually and confirm the server starts (status changes to `Available`).

---

---

## Migration Guide

This section is a standalone runbook. Once the implementation phases above have been completed and merged, use this guide as the day-to-day reference.

---

### Part 1 — First-Time Database Setup

Follow these steps once, after the implementation work has been merged to `main` for the first time.

**Step 1 — Configure GitHub Actions secrets and variables**

In the repository → Settings → Secrets and variables → Actions:

- Add secret `DB_ADMIN_PASSWORD` — choose a strong password and save it to your team password manager
- Add secret `DB_SERVER_NAME` — e.g. `team3-postgres-dev`
- Add secret `DATABASE_URL` — leave blank for now, fill in after Step 3
- Add variable `ALLOWED_IP_ADDRESSES` — add each team member's IP in Terraform map syntax:
  ```
  {"name" = "x.x.x.x", "colleague" = "x.x.x.x"}
  ```
  Get your IP with: `curl ifconfig.me`

**Step 2 — Push to `main` to provision the database**

Push (or merge a PR) to `main`. The CI/CD pipeline will:
1. Run `terraform apply` → creates the Azure PostgreSQL Flexible Server
2. Run `prisma migrate deploy` → applies all existing migrations to the new database

Watch the `terraform` job in GitHub Actions. When it completes, the FQDN will appear in the `Terraform apply` step output.

**Step 3 — Update the `DATABASE_URL` secret**

Using the FQDN from Step 2, build the connection string:

```
postgresql://team3admin:<password>@<fqdn>:5432/team3?sslmode=require
```

Update the `DATABASE_URL` GitHub Actions secret with this value.

**Step 4 — Seed the database (once only)**

Add `DATABASE_URL` to your local `.env`, then run:

```bash
npx prisma db seed
```

Verify in DBeaver by querying `SELECT * FROM "Capability";` — you should see seeded rows.

**Step 5 — Share access with the team**

- Share `DATABASE_URL` with teammates via the team password manager (not Slack or email)
- Each teammate puts it in their local `.env`
- Each teammate's IP must be in `ALLOWED_IP_ADDRESSES` for DBeaver access
- For Postman API testing, no database credentials are needed — just call `POST /auth/login` to get a JWT and use `Authorization: Bearer <token>` on subsequent requests

---

### Part 2 — Making Schema Changes

Any change to `prisma/schema.prisma` requires a migration file. Prisma tracks which migrations have been applied, so you always go through this process — never edit the database manually.

**Step 1 — Make sure your local Docker database is running**

```bash
docker compose up -d
```

Your local `.env` should point to the local Docker DB for development:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/team3
```

**Step 2 — Edit `prisma/schema.prisma`**

Make your schema change (add a field, new model, etc.).

**Step 3 — Generate and apply the migration locally**

```bash
npx prisma migrate dev --name <descriptive-name>
```

Use a short, lowercase, hyphenated name that describes the change, e.g.:
- `add-salary-field-to-job-role`
- `add-interview-date-to-application`

This command:
- Generates a new folder under `prisma/migrations/<timestamp>_<name>/` containing `migration.sql`
- Applies the migration to your local Docker database
- Regenerates the Prisma client

**Step 4 — Review the generated SQL**

Open `prisma/migrations/<timestamp>_<name>/migration.sql` and confirm the SQL looks correct before committing.

**Step 5 — Commit both files**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: <description of schema change>"
```

Both files must be committed together. The migration file is what CI/CD uses to update the Azure database.

**Step 6 — Open a PR and merge to `main`**

On the PR, the CI pipeline runs `terraform plan` (infrastructure only — no database changes happen at this point).

When merged to `main`, the `migrate` job runs `prisma migrate deploy` automatically, applying the new migration to the Azure database.

**Step 7 — Verify**

Confirm the `migrate` job passed in GitHub Actions. If you have DBeaver access, connect to the Azure database and confirm the schema change is present.

---

### IP Address Changes

Home and office IPs can rotate. If a team member suddenly cannot connect to the database via DBeaver:

1. Run `curl ifconfig.me` to get the current IP
2. Update `ALLOWED_IP_ADDRESSES` in GitHub Actions variables
3. Push any commit to `main` — Terraform will update the firewall rules automatically

---

## Teardown (when no longer needed)

To destroy the Azure database and stop incurring costs:

```bash
cd infrastructure
export TF_VAR_db_admin_password="<YOUR_PASSWORD>"
terraform init -backend-config=backend-dev.hcl
terraform destroy
```

> This will permanently delete the server and all data. The local Docker setup in `compose.yml` remains unaffected.
