# User Assigned Managed Identities — one per app (least privilege).
#
# On their own these have zero permissions. Part D grants each identity
# only the specific role assignments it actually needs (ACR pull, and for
# backend only, Key Vault secret read).

resource "azurerm_user_assigned_identity" "backend" {
  name                = "team3-backend-identity"
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.location

  tags = {
    Project     = "team3-backend"
    Environment = var.environment
    App         = "backend"
  }
}

resource "azurerm_user_assigned_identity" "frontend" {
  name                = "team3-frontend-identity"
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.location

  tags = {
    Project     = "team3-backend"
    Environment = var.environment
    App         = "frontend"
  }
}
