---
applyTo: "infrastructure/**"
description: "Task 2: Remote state management and Terraform modules. Move state to Azure Storage and create a reusable resource group module."
---

# Task 2: Remote State and Terraform Modules

## Overview

After completing Task 1 (basic Terraform setup), this task focuses on:
1. Moving Terraform state from local storage to Azure Storage (remote state backend)
2. Creating a reusable Terraform module for resource groups
3. Understanding module structure and benefits for team collaboration

## Prerequisites

- ✅ Task 1 completed: Basic Terraform infrastructure deployed
- ✅ `terraform apply tfplan` has been run successfully
- Azure CLI installed and authenticated (`az login`)
- Terraform CLI v1.0+ installed

## Part 1: Remote State Management

### Goal

Move the Terraform state file from your local machine to Azure Storage for secure, shared team collaboration and state locking.

### Current State

- State file currently stored locally: `infrastructure/terraform.tfstate`
- No state locking mechanism in place
- State cannot be shared across team members safely

### What You'll Do

1. **Create an Azure Storage Account** for state storage
2. **Create a Blob Container** within the storage account
3. **Configure backend block** in Terraform to use remote state
4. **Migrate existing state** from local to remote storage
5. **Enable state locking** for concurrent operations safety

### Implementation Steps

#### Step 1: Create Azure Storage Resources

Using Azure CLI, create:
- A storage account (naming: `team3tfstate<random>` to ensure uniqueness)
- A blob container named `tfstate`
- A storage account access key for authentication

**Reference commands:**
```bash
# Create resource group (if not using Terraform-managed one)
az storage account create --name <storage_account_name> --resource-group team3-rg --location "UK South"

# Create blob container
az storage container create --name tfstate --account-name <storage_account_name>

# Get storage account key
az storage account keys list --account-name <storage_account_name>
```

#### Step 2: Add Backend Configuration to Terraform

Create or update `infrastructure/backend.tf` with:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "team3-rg"
    storage_account_name = "<your_storage_account_name>"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}
```

**Note:** Replace `<your_storage_account_name>` with your actual storage account name.

#### Step 3: Initialize with Remote Backend

Run from `infrastructure/` directory:

```bash
terraform init
```

When prompted, confirm migration of existing state to remote storage:
- Type `yes` when asked about migrating state

#### Step 4: Verify Remote State

Confirm state is now remote:

```bash
# Check Terraform backend status
terraform state list

# Verify in Azure CLI
az storage blob list --container-name tfstate --account-name <your_storage_account_name>
```

**Success indicators:**
- ✅ No `terraform.tfstate` file in local directory (or it's outdated)
- ✅ `terraform state list` shows your resources
- ✅ Azure Storage blob contains your state file

### Security Considerations

- Add `backend.tf` and `.terraform/` to `.gitignore` (should already be there)
- Consider enabling storage account encryption at rest
- Restrict storage account access with firewall rules
- Use managed identity or service principal for CI/CD pipelines

---

## Part 2: Create a Terraform Module

### Goal

Create a reusable module for resource groups to demonstrate module structure and benefits:
- Code reuse across projects
- Consistent resource configuration
- Simplified main configuration
- Better maintainability

### Current Setup

- Main project uses hardcoded resource group resource
- No module structure in place
- All logic mixed in `main.tf`

### What You'll Do

1. **Create module directory structure** at `infrastructure/modules/resource-group/`
2. **Define module inputs** (variables.tf)
3. **Implement module logic** (main.tf)
4. **Export module outputs** (outputs.tf)
5. **Refactor main project** to use the module

### Implementation Steps

#### Step 1: Create Module Directory Structure

```bash
mkdir -p infrastructure/modules/resource-group
```

Create these files inside `infrastructure/modules/resource-group/`:

#### Step 2: Create Module Variables (`modules/resource-group/variables.tf`)

```hcl
variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  
  validation {
    condition     = length(var.resource_group_name) > 0
    error_message = "Resource group name cannot be empty."
  }
}

variable "location" {
  description = "Azure region location"
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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

#### Step 3: Create Module Main (`modules/resource-group/main.tf`)

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

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location

  tags = merge(
    var.tags,
    {
      environment = var.environment
      managed_by  = "terraform"
    }
  )
}
```

#### Step 4: Create Module Outputs (`modules/resource-group/outputs.tf`)

```hcl
output "resource_group_name" {
  description = "The name of the created resource group"
  value       = azurerm_resource_group.rg.name
}

output "resource_group_id" {
  description = "The ID of the created resource group"
  value       = azurerm_resource_group.rg.id
}

output "location" {
  description = "The location of the resource group"
  value       = azurerm_resource_group.rg.location
}
```

#### Step 5: Refactor Main Project to Use Module

Update `infrastructure/main.tf`:

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

module "resource_group" {
  source = "./modules/resource-group"

  resource_group_name = var.resource_group_name
  location            = var.location
  environment         = var.environment
}
```

Update `infrastructure/outputs.tf`:

```hcl
output "resource_group_name" {
  description = "The name of the resource group"
  value       = module.resource_group.resource_group_name
}

output "resource_group_id" {
  description = "The ID of the resource group"
  value       = module.resource_group.resource_group_id
}

output "location" {
  description = "The location of the resource group"
  value       = module.resource_group.location
}
```

#### Step 6: Validate and Test the Module

From `infrastructure/` directory:

```bash
# Validate module syntax
terraform validate

# Format code
terraform fmt -recursive

# Plan changes (should show no changes if already deployed)
terraform plan

# If needed, apply
terraform apply
```

**Success indicators:**
- ✅ `terraform validate` passes with no errors
- ✅ Module code is properly formatted
- ✅ `terraform plan` shows no resource changes (reusing existing infrastructure)
- ✅ Outputs match previous values

### Module Best Practices

- Keep modules simple and focused on a single responsibility
- Always include comprehensive variable validation
- Export useful outputs for consumers
- Document inputs and outputs with `description` fields
- Test modules with different variable combinations
- Version modules in production with git tags

---

## Verification Checklist

After completing both parts, verify:

### Part 1: Remote State
- [ ] Azure Storage Account created
- [ ] Blob container created in storage account
- [ ] `backend.tf` configured in Terraform
- [ ] `terraform init` completed successfully
- [ ] State migrated to remote storage (verified with `az storage blob list`)
- [ ] No local `terraform.tfstate` file (or marked as outdated)
- [ ] Team members can access shared state

### Part 2: Module
- [ ] Module directory structure created at `infrastructure/modules/resource-group/`
- [ ] Module files created: `main.tf`, `variables.tf`, `outputs.tf`
- [ ] Main project refactored to use the module
- [ ] `terraform validate` passes
- [ ] `terraform plan` shows no unplanned changes
- [ ] Module outputs match original outputs
- [ ] Code is formatted with `terraform fmt`

---

## Next Steps

After completing Task 2:
- Explore additional modules (storage accounts, databases, networking)
- Implement module versioning in CI/CD
- Set up team-based state management and locking
- Create reusable modules for other infrastructure components
