---
applyTo: "infrastructure/**,.github/workflows/**"
description: "Task 1: Deploy Container Apps with Terraform. Covers Key Vault, Managed Identity, Container App Environment, ACR/Key Vault RBAC, and Container App configuration with feature flags and secret references."
---

# Task 1: Deploy Container Apps with Terraform

## Objective

Deploy containerized frontend and backend applications to Azure Container Apps using Terraform, with secrets sourced from Azure Key Vault and feature flag support via environment variables.

**Core principle:** Everything closed to the internet by default; open only what is necessary.

---

## Prerequisites

- Docker images for frontend and backend pushed to Azure Container Registry (ACR)
- Basic Terraform understanding (resource group module and remote state from earlier tasks)

---

## Build Order

Work through these in sequence — each step depends on the previous one being deployed before you write the next block of Terraform.

### Step 1: Azure Key Vault

- Create a Key Vault with Terraform.
- **Do not** store secrets as Terraform variables — add secrets manually in the Azure Portal after the Key Vault is created.
- Secrets you will need: database connection string, session secret, any other app-level env vars.

### Step 2: User-Assigned Managed Identity

- Create a single user-assigned managed identity.
- This identity will be used by your container apps to authenticate to both ACR and Key Vault without any stored credentials.

### Step 3: Container App Environment

- Create the Container App Environment (the shared platform both apps run within).
- No ingress rules at this level.

### Step 4: RBAC Role Assignments

Wire the managed identity to the services it needs:

| Role | Scope | Purpose |
|------|-------|---------|
| `AcrPull` | ACR resource | Pull container images |
| `Key Vault Secrets User` | Key Vault resource | Read secrets at runtime |

Use `depends_on` in Terraform to ensure role assignments are created before the Container Apps that rely on them.

### Step 5: Container Apps

Create two Container Apps — frontend (public) and backend (private).

**Frontend:**
- Public ingress on port 80/443
- Environment variables sourced from Key Vault secret references

**Backend:**
- Internal ingress only — not accessible from the internet
- Specify the required internal port
- Environment variables sourced from Key Vault secret references

---

## Key Vault Secret References in Container Apps

Use the two-step pattern: define a `secret` block that references Key Vault, then reference it in `env`:

```hcl
template {
  container {
    env {
      name        = "SESSION_SECRET"
      secret_name = "session-secret-ref"
    }
  }
}

secret {
  name                = "session-secret-ref"
  key_vault_secret_id = "${azurerm_key_vault.main.vault_uri}secrets/SessionSecret"
  identity            = azurerm_user_assigned_identity.main.id
}
```

---

## Feature Flags

Use plain environment variables (not secrets) in the Container App `env` block to toggle features:

```hcl
env {
  name  = "FEATURE_NEW_UI"
  value = "true"
}
```

This lets you switch flags per-environment without changing application code.

---

## Success Criteria

- ✅ Frontend app accessible via public URL
- ✅ Backend app **not** accessible via public URL
- ✅ Environment variables pulled as secrets from Azure Key Vault
- ✅ Deployed entirely through Terraform (no manual resource creation beyond Key Vault secrets)
- ✅ Feature flags togglable via environment variables

---

## Iterating After First Deploy

1. Run your CI/CD pipeline and confirm the public URL works end to end.
2. Practice the Terraform update workflow: change something small (replica count, image tag) and redeploy.
3. Once `dev` is stable, repeat for `prod` — the only difference should be a different set of variable values and a separate pipeline gate.

---

## Local Plan Without Remote State (Faster Iteration)

While writing Terraform, you can plan locally without initialising the remote backend:

```bash
cd infrastructure
terraform init
terraform plan
```

This avoids pipeline round-trips during authoring.
