---
applyTo: ".github/workflows/**,infrastructure/**"
description: "Task 2: CD pipeline. Push Docker images to ACR on main only, make Terraform pipeline-ready with dev naming, and add a Terraform deployment job using the existing Service Principal client-secret auth."
---

# Task 2: Continuous Deployment Pipeline

## Objective

Extend the Task 1 CI pipeline so it also pushes the built image to Azure Container Registry (main branch only) and deploys infrastructure via Terraform automation.

## Prerequisites

- Task 1 CI pipeline completed (`test` job + `build` job with Docker build validation)
- Existing Terraform under `infrastructure/` (resource-group module, `backend.tf.example`)
- An Azure Container Registry instance

---

## Environment Already In Place (confirmed via Azure CLI)

Before writing any workflow YAML, the actual Azure setup was checked rather than assumed:

- **ACR:** `acraiacademy26` (login server `acraiacademy26.azurecr.io`), resource group `rg-ai-academy-26`. Admin user is **disabled** (`adminUserEnabled: false`), so auth must go through Azure AD/RBAC, not the ACR admin username/password.
- **Service Principal:** `sp-team3-ai-academy-26` already has:
  - `AcrPush` scoped to `acraiacademy26` ✅
  - `Contributor` on the whole subscription ✅ (covers Terraform resource management)
  - `User Access Administrator` ✅
  - No additional role grants were needed or made.
- **GitHub repo secrets already exist:** `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`. These were set up by a teammate previously (client-secret auth, not OIDC).
- **Terraform remote state already exists:** storage account `team3tfstate123` in resource group `team3-rg`, container `tfstate`, blob `terraform.tfstate` already populated from an earlier local `terraform apply`. This matches `infrastructure/backend.tf.example` exactly.

**Authentication decision:** Use the **existing Service Principal client-secret auth** already configured in GitHub Secrets, rather than migrating to OIDC federated credentials. OIDC is best practice for new setups, but since working, correctly-permissioned secret-based auth already exists, replacing it would mean coordinating a change with whoever set it up for no functional benefit right now. This is a deliberate, documented trade-off — not an oversight.

---

## Part A: Push to Azure Container Registry (Main Branch Only)

**Workflow steps:**
1. Authenticate with `azure/login@v2` using the existing secrets:
   ```yaml
   - uses: azure/login@v2
     with:
       client-id: ${{ secrets.AZURE_CLIENT_ID }}
       client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}
       tenant-id: ${{ secrets.AZURE_TENANT_ID }}
       subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
   ```
2. Login to ACR: `az acr login --name acraiacademy26`.
3. Tag and push:
   - Always tag with the Git SHA: `acraiacademy26.azurecr.io/team3-backend:${{ github.sha }}`
   - On `main` also tag `latest`.
4. Gate the push step(s) with:
   ```yaml
   if: github.ref == 'refs/heads/main' && github.event_name == 'push'
   ```

**Verify the push worked:**
```bash
az acr repository show-tags --name acraiacademy26 --repository team3-backend
```

---

## Part B: Prepare Terraform for Automation

- `infrastructure/` is already inside this application repo — no move needed.
- Convert `backend.tf.example` into a real `backend.tf` using the confirmed remote state values:
  ```hcl
  terraform {
    backend "azurerm" {
      resource_group_name  = "team3-rg"
      storage_account_name = "team3tfstate123"
      container_name       = "tfstate"
      key                  = "terraform.tfstate"
    }
  }
  ```
- Use `TF_VAR_environment=dev` for now (your `variables.tf` already validates `dev`/`test`/`prod`) so a `prod` pipeline later is just a different value/workflow input, not new code.
- Non-interactive requirements:
  - `terraform init -input=false`
  - `terraform plan -input=false` on every branch/PR (visibility, no changes applied)
  - `terraform apply -input=false -auto-approve tfplan` only on `main`
- Auth: same Service Principal client-secret pattern as Part A. Terraform's `azurerm` provider reads these directly from env vars (no code changes needed in `.tf` files):
  ```yaml
  env:
    ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
    ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
    ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
    ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  ```

---

## Part C: Create Terraform Deployment Job

**Job dependency:** `terraform` job should have `needs: <acr-push-job>` so infrastructure only deploys after a valid image exists.

**Steps:**
1. `azure/login@v2` (same secrets as Part A) — needed for the Azure CLI parts even though Terraform itself uses `ARM_*` env vars directly.
2. `hashicorp/setup-terraform@v3` to install Terraform in the runner.
3. `terraform fmt -check` — fail the job if formatting is off (cheap, fast lint gate).
4. `terraform init -input=false` with backend config.
5. `terraform plan -input=false -out=tfplan` — run this on **every** push and PR for visibility.
6. `terraform apply -input=false -auto-approve tfplan` — gated with:
   ```yaml
   if: github.ref == 'refs/heads/main' && github.event_name == 'push'
   ```
   So PRs only ever get a `plan`, never an `apply`.

**Other recommended practices:**
- Upload the `tfplan` as a workflow artifact (`actions/upload-artifact@v4`) so it's reviewable on PRs.
- Keep the resource scope minimal for now (resource group only, as instructed) — don't expand scope until the pipeline pattern is proven.

---

## Success Criteria

- ✅ Docker image pushed to ACR only on `main` branch pushes, tagged with Git SHA (+ `latest`)
- ✅ Azure authentication reuses the existing, already-permissioned Service Principal secrets (no new secrets or roles created)
- ✅ Terraform runs `plan` on every branch/PR, `apply` only on `main`
- ✅ Terraform job depends on a successful ACR push
- ✅ Naming uses `dev` environment convention, structured so `prod` can be added later without rewriting
- ✅ No interactive prompts required for any pipeline step
