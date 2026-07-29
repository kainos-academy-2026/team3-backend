---
applyTo: ".github/workflows/**,infrastructure/**"
description: "Task 2: CD pipeline. Push Docker images to ACR on main only, make Terraform pipeline-ready with dev naming, and add a Terraform deployment job using OIDC auth."
---

# Task 2: Continuous Deployment Pipeline

## Objective

Extend the Task 1 CI pipeline so it also pushes the built image to Azure Container Registry (main branch only) and deploys infrastructure via Terraform automation.

## Prerequisites

- Task 1 CI pipeline completed (`test` job + `build` job with Docker build validation)
- Existing Terraform under `infrastructure/` (resource-group module, `backend.tf.example`)
- An Azure Container Registry instance

---

## Part A: Push to Azure Container Registry (Main Branch Only)

**Authentication decision:** Use **OIDC federated credentials**, not a stored Service Principal secret.

Why: GitHub issues a short-lived OIDC token per run; Azure AD trusts it via a federated credential tied to this repo/branch. No client secret is stored in GitHub at all — nothing long-lived to leak or rotate. Store only non-secret identifiers (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) as repo variables/secrets.

**Setup steps (Azure side, one-time):**
1. Create/reuse an App Registration (Service Principal) in Azure AD.
2. Under the App Registration, add a **Federated credential** scoped to:
   - Organization/repo: `kainos-academy-2026/team3-backend`
   - Entity type: branch `main` (add a second one scoped to `pull_request` if PR-tagged pushes are needed for the bonus)
3. Grant the Service Principal `AcrPush` role on the ACR instance (least privilege — not `Owner`/`Contributor`).

**Workflow steps:**
1. Add a permissions block so the job can request an OIDC token:
   ```yaml
   permissions:
     id-token: write
     contents: read
   ```
2. Authenticate with `azure/login@v2` using `client-id` / `tenant-id` / `subscription-id` (no password/secret input).
3. Login to ACR: `az acr login --name <registry-name>` (or `docker/login-action@v3` with ACR credentials from `azure/login`).
4. Tag and push:
   - Always tag with the Git SHA: `<registry>.azurecr.io/team3-backend:${{ github.sha }}`
   - On `main` also tag `latest`.
   - Bonus: on `pull_request`, build and tag `pr-<number>` and push it too, so a reviewer can pull that specific image — but keep the final push step itself gated to `main` for the "real" release tag.
5. Gate the push step(s) with:
   ```yaml
   if: github.ref == 'refs/heads/main' && github.event_name == 'push'
   ```

**Verify the push worked:**
```bash
az acr repository show-tags --name <registry-name> --repository team3-backend
```

---

## Part B: Prepare Terraform for Automation

- `infrastructure/` is already inside this application repo — no move needed.
- Convert `backend.tf.example` into a real `backend.tf`, but leave storage account name/key out of the committed file — pass them at `terraform init` time via `-backend-config`, sourced from CI secrets/variables.
- Use `TF_VAR_environment=dev` for now (your `variables.tf` already validates `dev`/`test`/`prod`) so a `prod` pipeline later is just a different value/workflow input, not new code.
- Non-interactive requirements:
  - `terraform init -input=false -backend-config=...`
  - `terraform plan -input=false` on every branch/PR (visibility, no changes applied)
  - `terraform apply -input=false -auto-approve tfplan` only on `main`
- Auth: same OIDC pattern as Part A. Terraform's `azurerm` provider natively supports OIDC via these env vars (no secret needed):
  ```yaml
  env:
    ARM_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
    ARM_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
    ARM_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
    ARM_USE_OIDC: true
  ```

---

## Part C: Create Terraform Deployment Job

**Job dependency:** `terraform` job should have `needs: <acr-push-job>` so infrastructure only deploys after a valid image exists.

**Steps:**
1. `azure/login@v2` (OIDC, as above) — needed for the Azure CLI parts even if Terraform itself uses `ARM_*` env vars directly.
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
- Post the `plan` output as a PR comment for visibility (common pattern, e.g. via `actions/github-script` or a community action).
- Keep the resource scope minimal for now (resource group only, as instructed) — don't expand scope until the pipeline pattern is proven.

---

## Success Criteria

- ✅ Docker image pushed to ACR only on `main` branch pushes, tagged with Git SHA (+ `latest`)
- ✅ Azure authentication uses OIDC federated credentials, not stored secrets
- ✅ Terraform runs `plan` on every branch/PR, `apply` only on `main`
- ✅ Terraform job depends on a successful ACR push
- ✅ Naming uses `dev` environment convention, structured so `prod` can be added later without rewriting
- ✅ No interactive prompts required for any pipeline step
