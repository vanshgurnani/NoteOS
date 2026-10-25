variable "project_id" {
  description = "Globally unique Google Cloud project ID"
  type        = string
}
variable "project_name" {
  description = "Human-readable Google Cloud project name"
  type        = string
  default     = "NOTE OS Authentication"
}
variable "billing_account" {
  description = "Billing account ID to attach to the project"
  type        = string
}
variable "org_id" {
  description = "Google Cloud organization ID; leave empty for a personal account"
  type        = string
  default     = ""
}
variable "region" {
  type    = string
  default = "asia-south1"
}
variable "frontend_origins" {
  description = "Exact browser origins allowed for the OAuth web client"
  type        = list(string)
  default     = ["http://localhost:3000"]
}
