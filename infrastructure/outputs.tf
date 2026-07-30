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

output "postgres_fqdn" {
  description = "The FQDN of the Azure PostgreSQL Flexible Server"
  value       = module.postgres.server_fqdn
}
