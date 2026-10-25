resource "google_project" "noteos" {
  project_id      = var.project_id
  name            = var.project_name
  org_id          = var.org_id != "" ? var.org_id : null
  deletion_policy = "PREVENT"
}

locals {
  required_apis = toset([
    "serviceusage.googleapis.com",
    "iam.googleapis.com",
    "identitytoolkit.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])
}

resource "google_project_service" "apis" {
  for_each           = local.required_apis
  project            = google_project.noteos.project_id
  service            = each.value
  disable_on_destroy = false
}
