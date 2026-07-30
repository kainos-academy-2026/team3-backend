---
applyTo: "infrastructure/**, .github/workflows/**"
description: "Task 1 (Container Apps): Deploy frontend and backend Docker images to Azure Container Apps using Terraform, with Key Vault secrets and least-privilege Managed Identities. Backend stays private, frontend is public."
---

# Task 1: Deploy Container Apps with Terraform

## Overview

Get the `team3-backend` and `team3-frontend` Docker images (already in ACR) running live in Azure using Container Apps, fully provisioned by Terraform through the existing GitHub Actions pipeline.

**Repo split decision:** shared platform resources (Key Vault, both Managed Identities, Container App Environment, ACR role assignments) and the **backend** Container App live in **this repo** (`team3-backend/infrastructure/`). The **frontend** Container App is defined in `team3-frontend/infrastructure/`, which reads this repo's Terraform outputs via a `terraform_remote_state` data source (read-only, no shared `.tf` files, separate state key so the two never clash).

**Core principle for this whole task:** closed to the internet by default, opened only where required.
- Frontend → public ingress (users need to reach it)
- Backend → internal-only ingress (only frontend should ever reach it, over Azure's private network)

Build this in the order below — each step depends on the ones before it.

---

## Prerequisites

- ✅ Task 1 (CI pipeline) and Task 2 (CD pipeline / ACR push) already completed and working
- ✅ `team3-backend` and `team3-frontend` images present in `acraiacademy26` ACR
- Azure CLI authenticated (`az login`) for local testing
- Basic familiarity with the existing `infrastructure/` Terraform project (resource group module, remote state backend)

---

## Part A: Azure Key Vault

**Goal:** create an empty, access-controlled secrets store — do **not** define secret values in Terraform.

**Implemented in:** `infrastructure/key-vault.tf`

**Steps:**
1. Add an `azurerm_key_vault` resource (`team3-kv-<random suffix>` — vault names must be globally unique across Azure, hence the `random_string` suffix), standard SKU, inside the existing `team3-rg` resource group.
2. Do **not** add `azurerm_key_vault_secret` resources for real values — those get added manually via the Azure Portal after `apply`.
3. Enable RBAC authorization mode on the vault (`rbac_authorization_enabled = true`) so access is granted via role assignments (Part D), not legacy vault access policies.

**Manual step (outside Terraform), after first apply:**
- In the Azure Portal, add these secret values by hand (names must be kebab-case, matching what the Container App references):
  - `database-url` → `DATABASE_URL`
  - `jwt-secret` → `JWT_SECRET`
  - `aws-access-key-id` → `AWS_ACCESS_KEY_ID`
  - `aws-secret-access-key` → `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME` and `AWS_REGION` aren't secret values themselves, so they stay as plain environment variables on the Container App rather than Key Vault secrets.

**Consider:**
- Never put real secret values in `.tf` files or `tfvars` — Terraform state itself would then contain them in plain text.

---

## Part B: User Assigned Managed Identities

**Goal:** create one identity per app (not shared), so a compromise of one app can't reach the other's secrets — least privilege.

**Implemented in:** `infrastructure/identities.tf`

**Steps:**
1. Create two `azurerm_user_assigned_identity` resources: `team3-backend-identity` and `team3-frontend-identity`.
2. Do not assign any roles yet — that's Part D. On their own these identities have no permissions.
3. Both identities' resource IDs and principal IDs are exposed as outputs so role assignments (Part D) and the frontend repo (via remote state) can reference them.

---

## Part C: Container App Environment

**Goal:** the shared platform both Container Apps will run inside, enabling private internal networking between them.

**Implemented in:** `infrastructure/container-app-environment.tf`

**Steps:**
1. Create an `azurerm_log_analytics_workspace` (`team3-logs`, `PerGB2018` SKU, 30-day retention) for the environment's logs.
2. Create one `azurerm_container_app_environment` (`team3-container-env`), linked to that workspace.
3. Both the backend app here and the frontend app (in `team3-frontend`) reference this same environment via its `id` output (`container_app_environment_id`).

---

## Part D: Role Assignments (ACR + Key Vault access)

**Goal:** explicitly unlock only the doors each identity needs.

**Implemented in:** `infrastructure/role-assignments.tf`

**Steps:**
1. Look up the existing ACR (`acraiacademy26`, resource group `rg-ai-academy-26`) via a `data "azurerm_container_registry"` source — it's not managed by this Terraform, just referenced.
2. Grant `AcrPull` on that ACR to **both** Managed Identities, each scoped only to the ACR (not the whole subscription).
3. Grant `Key Vault Secrets User` on the Key Vault to the **backend** identity only (frontend has no need to read backend's secrets).
4. Use `depends_on` on each `azurerm_role_assignment` to ensure the identity and the target resource (ACR / Key Vault) are fully created first — role assignments that reference a not-yet-existing principal will fail.

---

## Part E: Container Apps (backend here, frontend in team3-frontend)

**Goal:** the two running applications.

**Backend Container App** (`infrastructure/container-app-backend.tf`, `azurerm_container_app.backend`):
- `revision_mode = "Single"` to start simply
- `ingress { external_enabled = false, target_port = 4000 }` — internal-only, no public IP, matches `PORT` default in `src/index.ts`
- Points at `acraiacademy26.azurecr.io/team3-backend:<var.backend_image_tag>` (defaults to `dev-latest`, matching the `ci.yml` tagging scheme from the CD pipeline task)
- Uses the backend Managed Identity for both `identity` and the ACR registry auth (`registry { identity = ... }`)
- `secret` blocks referencing the Key Vault (`key_vault_secret_id`, `identity`) for `database-url`, `jwt-secret`, `aws-access-key-id`, `aws-secret-access-key`, then `env` blocks with `secret_name` pointing at those secrets
- Plain `env` blocks for `PORT`, `AWS_REGION`, `S3_BUCKET_NAME`, and the example feature flag `FEATURE_NEW_DASHBOARD_ENABLED` (driven by `var.feature_new_dashboard_enabled`, a plain `bool` Terraform variable — no code change needed to flip it, just change the variable and redeploy)
- `depends_on` the two backend role assignments from Part D, so ACR pull and Key Vault access are guaranteed to exist before the app tries to use them

**Frontend Container App** (to be added by teammate, in `team3-frontend/infrastructure/`):
- Add a `terraform_remote_state` data source pointing at this repo's remote state (same storage account, different `key`, e.g. `frontend.tfstate` for their own state)
- Consume this repo's outputs: `container_app_environment_id`, `frontend_identity_id`, `acr_login_server`, `backend_internal_fqdn`
- `ingress { external_enabled = true }` — public
- Points at `<acr_login_server>/team3-frontend:<tag>`
- Uses the frontend Managed Identity
- `env` block: `BACKEND_API` = the backend's internal FQDN (from `backend_internal_fqdn` output) so the frontend knows where to send API requests without ever exposing the backend publicly
- Add their own `terraform` job to their `ci.yml`, mirroring this repo's (`init -backend-config=...`, `fmt -check`, `plan`, `apply` gated to `main`)

**Consider:**
- Backend's internal FQDN isn't known until backend is created — it's exposed as the `backend_internal_fqdn` output, sourced from `azurerm_container_app.backend.ingress[0].fqdn`.
- Keep replica counts low to start (default, no explicit `min_replicas`/`max_replicas` set yet) — this is revisited in the "Make One Update" exercise later.

---

## Key Configuration Checklist

- [ ] Infrastructure changes live in `infrastructure/` (existing repo convention)
- [ ] Frontend: public ingress (in `team3-frontend` repo)
- [ ] Backend: internal-only ingress, port 4000 exposed
- [ ] Feature flags implemented as plain environment variables (togglable via a Terraform variable, no code change needed to flip them)
- [ ] Secrets (`database-url`, `jwt-secret`, `aws-access-key-id`, `aws-secret-access-key`) referenced via Key Vault, never hardcoded
- [ ] Role assignments use `depends_on` for correct sequencing
- [ ] Deployment runs through the existing GitHub Actions `terraform` job (CI/CD), not just local apply
- [ ] Frontend repo's Terraform reads this repo's outputs via `terraform_remote_state`, not by duplicating shared resources

---

## Local Testing (optional, saves pipeline time)

Per the task brief, you can `terraform init`/`plan` locally without the remote backend to iterate faster:

```bash
cd infrastructure
terraform init -backend=false
terraform validate
terraform plan
```

Switch back to the real backend (`-backend-config=backend-dev.hcl`) before applying for real, so state stays shared and locked correctly.

---

## Success Criteria

- ✅ Frontend accessible via its public URL
- ✅ Backend **not** accessible via any public URL
- ✅ Environment variables pulled as secrets from Azure Key Vault
- ✅ Entire deployment happens through Terraform automation (via the CI/CD pipeline)
- ✅ Features can be toggled on/off via environment variable changes + redeploy, no code change

---

## Next Steps (after first successful deploy)

1. Run the CI/CD pipeline end-to-end and confirm the app works via the generated URL.
2. Practice the Terraform update workflow: change something small (replica count, image tag) and redeploy.
3. Think about what pipeline changes would help validate a change safely (e.g. plan-only on PRs, apply only on merge — already partly in place).
4. (Later stage, not this task) Multi-environment/multi-stage pipeline for a production instance.
