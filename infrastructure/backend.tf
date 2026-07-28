terraform {
  backend "azurerm" {
    resource_group_name  = "team3-rg"
    storage_account_name = "team3tfstate123"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}