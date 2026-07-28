# Terraform Deployment Setup - Completion Guide

## ✅ What's Been Completed

The Terraform infrastructure project has been set up with modular architecture and remote state support:

### Project Structure
```
infrastructure/
├── main.tf                          # Provider config and module usage
├── variables.tf                     # Variable definitions with validation
├── outputs.tf                       # Output definitions (re-exported from module)
├── backend.tf                       # Remote state backend config (created in Part 1)
├── terraform.tfvars                 # Default variable values
├── .gitignore                       # Git ignore rules for Terraform files
└── modules/
    └── resource-group/
        ├── main.tf                  # Resource group resource definition
        ├── variables.tf             # Module input variables
        └── outputs.tf               # Module outputs
```

### Architecture Overview

**Module Structure (Part 2 - Complete):**
- `modules/resource-group/` - Reusable module for creating Azure resource groups
- Encapsulates resource group creation with validation and tagging
- Simplified main project that calls the module
- Better code reuse and maintainability

**Remote State Setup (Part 1 - To be completed before deployment):**
- `backend.tf` - Configures Terraform to store state in Azure Storage
- Enables shared state for team collaboration
- Provides state locking for concurrent operations safety
- Must be completed before ANY deployment

**Files Summary:**

**main.tf** - Defines:
- Azure provider configuration (v3.0+)
- Module declaration for resource group with parameterized inputs

**variables.tf** - Defines:
- `resource_group_name` (default: "team3-rg")
- `location` (default: "UK South")
- `environment` (default: "dev") with validation for dev/test/prod

**outputs.tf** - Exports:
- Resource group name (via module output)
- Resource group ID (via module output)
- Location (via module output)

**backend.tf** - Configures:
- Azure Storage backend for remote state storage
- Container for state files
- State locking via Azure Storage

**terraform.tfvars** - Pre-configured values:
- resource_group_name = "team3-rg"
- location = "UK South"
- environment = "dev"

**.gitignore** - Protects:
- Local state files (`terraform.tfstate*`)
- `.terraform/` directory
- Backend config secrets
- Plan files

---

## 📋 Prerequisites

Before proceeding, ensure you have installed:

1. **Terraform CLI** (v1.0+)
   - Visit: https://developer.hashicorp.com/terraform/install
   - Or via Homebrew: `brew install tfenv && tfenv install latest`
   - Verify: `terraform version`

2. **Azure CLI**
   - Visit: https://learn.microsoft.com/cli/azure/install-azure-cli
   - Verify: `az --version`

3. **Azure Account & Login**
   - Must be authenticated: `az login`
   - Verify access: `az group list`

---

## ⚠️ IMPORTANT: Two-Phase Deployment

Since the resource group doesn't exist yet, follow this workflow:

### Phase 1: Initial Deployment (Create Resource Group)

1. **Initialize Terraform (local state)**
   ```bash
   cd infrastructure/
   terraform init
   ```

2. **Validate and plan**
   ```bash
   terraform validate
   terraform plan -out=tfplan
   ```
   Should show: `module.resource_group.azurerm_resource_group.rg will be created`

3. **Apply - creates resource group**
   ```bash
   terraform apply tfplan
   ```
   **Verify:** `az group list --query "[?name=='team3-rg']"`

### Phase 2: Remote State Setup & Migration

Once resource group exists, set up remote state for team collaboration:

1. **Create Azure Storage Account** in the resource group
   ```bash
   az storage account create \
     --name team3tfstate<RANDOM> \
     --resource-group team3-rg \
     --location "uksouth" \
     --sku Standard_LRS
   ```
   *(Replace `<RANDOM>` with unique suffix, e.g., abc123)*

2. **Create Blob Container**
   ```bash
   az storage container create \
     --name tfstate \
     --account-name team3tfstate<RANDOM>
   ```

3. **Create `infrastructure/backend.tf`**
   ```hcl
   terraform {
     backend "azurerm" {
       resource_group_name  = "team3-rg"
       storage_account_name = "team3tfstate<RANDOM>"
       container_name       = "tfstate"
       key                  = "terraform.tfstate"
     }
   }
   ```
   *(Replace `team3tfstate<RANDOM>` with your actual storage account name)*

4. **Reinitialize Terraform with Remote Backend**
   ```bash
   cd infrastructure/
   terraform init -migrate-state
   ```
   When prompted: Type `yes` to migrate state from local to remote storage

5. **Verify Remote State Migration**
   ```bash
   terraform state list
   terraform state show module.resource_group.azurerm_resource_group.rg
   ```
   Should display your resource group details

**After Phase 2 completes, remote state is set up for team collaboration.**

---

## � Future Deployments (After Phase 2 Complete)

Once remote state is configured, subsequent changes follow this workflow:

```bash
cd infrastructure/

# Validate changes
terraform validate
terraform fmt -recursive

# Review planned changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# View current state
terraform output
```

---

## ✅ Verification Checklist

**After Phase 1 (Resource Group Created):**
- [ ] `terraform apply` completes successfully
- [ ] Resource group `team3-rg` exists in Azure (`az group list`)
- [ ] `terraform output` displays correct values

**After Phase 2 (Remote State Configured):**
- [ ] Azure Storage Account created (`az storage account list`)
- [ ] Blob container `tfstate` exists
- [ ] `backend.tf` configured with correct storage account name
- [ ] `terraform init` completes successfully with remote backend
- [ ] State migrated to remote storage (`terraform state list` shows resources)
- [ ] No local `terraform.tfstate` file or marked as outdated
- [ ] Team members can authenticate and access shared state

---

## 📝 Important Notes

- **First deployment:** Creates resource group locally, then migrates to remote state
- **State file location:** Remote Azure Storage (after Phase 2)
- **State locking:** Automatically managed by Azure Storage for concurrent safety
- **Shared access:** Team members use same remote state after Phase 2 setup
- **Module reusability:** `modules/resource-group/` can be used in other projects
- **Code changes:** Update variables in `infrastructure/variables.tf` or override via `terraform.tfvars`

### Part I: Practice Workflow (Make a Change)

1. **Edit a variable** (e.g., in `terraform.tfvars`):
   ```hcl
   environment = "test"  # Change from "dev"
   ```

2. **Run the workflow again:**
   ```bash
   terraform fmt
   terraform validate
   terraform plan
   terraform apply
   ```

### Part J: Explore Terraform Commands
```bash
terraform show              # Display current state
terraform output            # Show all output values
terraform state list        # List all resources in state
terraform providers         # Show installed providers
terraform console           # Interactive console
```

---

## ⚠️ Important Reminders

- **State File Security:** Never commit `terraform.tfstate` or `terraform.tfstate.*` files to Git
- **`.gitignore` is configured** to protect sensitive files
- **.lock file:** Commit `.terraform.lock.hcl` to version control
- **Sensitive Data:** The state file contains credentials and secrets
- **Team Collaboration:** Use remote state (Azure Storage, Terraform Cloud) for team projects

---

## ✅ Pre-Deployment Checklist

Before committing your code:

- [ ] Terraform is installed (`terraform version`)
- [ ] Azure CLI is installed and authenticated (`az login`)
- [ ] Ran `terraform fmt` (formatting complete)
- [ ] Ran `terraform validate` (no errors)
- [ ] Ran `terraform plan` (reviewed output)
- [ ] Ran `terraform apply` and verified Azure resources exist
- [ ] Confirmed `terraform.tfstate*` is in `.gitignore`
- [ ] `.terraform/` is in `.gitignore`
- [ ] `.terraform.lock.hcl` will be committed
- [ ] All Terraform files follow naming conventions

---

## 📊 Resource Created

When you successfully apply the configuration, you'll have:

**Azure Resource Group**
- Name: `team3-rg`
- Location: `UK South`
- Environment Tag: `dev`
- Project Tag: `team3-backend`

---

## 🔗 Useful Resources

- [Terraform AWS/Azure Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm)
- [Azure Terraform Learning Path](https://learn.microsoft.com/en-us/training/modules/provision-infrastructure-terraform/)
- [Terraform Best Practices](https://terraform.io/cloud-docs/recommended-practices)

---

## Summary

**Task Status:** ✅ **INFRASTRUCTURE CODE COMPLETE**

All Terraform configuration files have been created and are ready to deploy. The only remaining steps are:
1. Install Terraform CLI (if not already installed)
2. Authenticate with Azure (`az login`)
3. Execute the workflow commands above

The files are production-ready and follow Terraform best practices including:
- Parameterized configuration via variables
- Output definitions for resource reference
- Proper .gitignore setup
- Input validation on variables
- Environment-aware tagging
