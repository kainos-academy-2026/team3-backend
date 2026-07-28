---
applyTo: "infrastructure/**"
description: "First Terraform deployment workflow for Azure. Covers setup, configuration, planning, and deployment of infrastructure as code with Terraform."
---

# Terraform Deployment Instructions

## Objective

Create your first Infrastructure as Code project using Terraform to deploy Azure resources. Learn the fundamentals of Terraform workflow and state management.

---

## Prerequisites

Before starting, verify you have:
- Terraform installed (or use Azure Cloud Shell)
- Azure CLI logged in (`az login`)
- VS Code with Terraform extension (recommended)
- AI assistant available for guidance

---

## Part A: Set Up Terraform

Install and configure Terraform for Azure development.

**Steps:**
1. Install Terraform CLI (skip if using Azure Cloud Shell)
2. Verify installation by running:
   ```bash
   terraform version
   ```
3. Verify Azure CLI authentication:
   ```bash
   az login
   ```

---

## Part B: Create Your Terraform Project Structure

Set up a basic project directory and define your first resource.

**Create directory structure:**
```
infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
└── terraform.tfvars
```

**In `main.tf`, define:**
- Azure provider configuration
- A resource group with a meaningful name
- Deploy to your preferred location

**Example:**
```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
  }
}
```

---

## Part C: Add Variables

Make your configuration flexible and reusable.

**In `variables.tf`, create variables for:**
- Resource group name
- Location (e.g., "UK South", "East US")
- Environment (dev/test/prod)
- Any other parameterized values

**Good practices:**
- Add descriptions to all variables
- Set sensible defaults where appropriate
- Use appropriate variable types (string, number, bool, list, map)
- Add validation rules if needed

**Example:**
```hcl
variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "team3-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "UK South"
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  default     = "dev"
}
```

---

## Part D: Add Outputs

Export useful information from your infrastructure for reference and downstream use.

**In `outputs.tf`, output:**
- Resource group name
- Resource group ID
- Location

**Example:**
```hcl
output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_id" {
  description = "ID of the created resource group"
  value       = azurerm_resource_group.main.id
}

output "location" {
  description = "Azure region of the resource group"
  value       = azurerm_resource_group.main.location
}
```

---

## Part E: Initialize Terraform

Initialize your Terraform working directory to download providers and set up state management.

**Execute:**
```bash
terraform init
```

**Verify successful initialization:**
- See provider downloads complete
- Message: "Terraform has been successfully initialized!"
- `.terraform/` directory created
- `.terraform.lock.hcl` created (commit this file)

---

## Part F: Format and Validate

Ensure your code is clean, consistent, and syntactically correct.

**Run formatting:**
```bash
terraform fmt -recursive
```
- Automatically fixes formatting
- Makes code consistent across files
- Should be run before every commit

**Validate syntax:**
```bash
terraform validate
```
- Checks for syntax errors
- Validates resource configurations
- Catches configuration mistakes early
- Must run successfully before planning

---

## Part G: Plan Your Infrastructure

Preview what Terraform will create without making changes.

**Execute:**
```bash
terraform plan -out=tfplan
```

**Review the plan for:**
- Resources marked with `+` (will be created) — should be green
- No resources marked with `-` (will be deleted)
- All attributes reviewed for correctness
- No error messages

**Understanding plan output:**
- `+` = create new resource
- `-` = destroy resource
- `~` = update in-place
- `-/+` = destroy and recreate

---

## Part H: Apply Your Configuration

Create your infrastructure in Azure.

**Execute:**
```bash
terraform apply tfplan
```

**Verify in Azure:**
- Check the Azure Portal to confirm resources exist
- Use Azure CLI: `az group list --query "[?name=='<resource-group-name>']"`
- Compare with Terraform outputs: `terraform output`

---

## ⚠️ Important State File Guidelines

The `terraform.tfstate` file contains sensitive data and infrastructure state:
- **Never** commit to Git
- **Never** push to repositories
- Ensure `.gitignore` includes `*.tfstate` and `*.tfstate.*`
- Use remote state (Azure Storage, Terraform Cloud) for team collaboration
- Losing state = losing track of infrastructure

---

## Part I: Practice the Terraform Workflow

Reinforce your learning by making a change to your infrastructure.

**Modify your infrastructure:**
1. Add a tag to your resource group
2. Change a variable value
3. Or add another resource

**Run the full workflow:**
1. Update your `.tf` files
2. `terraform fmt`
3. `terraform validate`
4. `terraform plan` (review what will change)
5. `terraform apply` (apply the change)

---

## Part J: Explore Terraform Commands

Learn additional useful commands for management and troubleshooting.

**Commands to explore:**
```bash
terraform show              # Display current state
terraform output            # Show all output values
terraform state list        # List all resources in state
terraform providers         # Show installed providers
terraform console           # Interactive console for expressions
```

---

## Part K: Destroy Resources

Clean up infrastructure properly to avoid unexpected costs.

**⚠️ Warning:** This will delete your Azure resources!

**Execute:**
```bash
terraform destroy
```

**Verify deletion:**
- Confirm prompt and enter `yes`
- Resources removed from Azure
- State file updated
- Check Azure Portal to confirm

---

## Pre-Deployment Checklist

Before committing Terraform code:

- [ ] Ran `terraform fmt`
- [ ] Ran `terraform validate` (no errors)
- [ ] Ran `terraform plan` (reviewed output)
- [ ] Tested `terraform apply` and verified Azure resources
- [ ] Added `.tfstate*` to `.gitignore`
- [ ] Added `override.tf` to `.gitignore`
- [ ] Added `.terraform/` to `.gitignore`
- [ ] Committed `terraform.lock.hcl`
- [ ] Tested `terraform destroy` workflow (if applicable)

---

## Resources

**Official Documentation:**
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm)
- [Terraform Language](https://terraform.io/language)
- [Azure Resource Types](https://learn.microsoft.com/azure/templates)
- [Terraform Best Practices](https://terraform.io/cloud-docs/recommended-practices)
