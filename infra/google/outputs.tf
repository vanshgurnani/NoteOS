output "project_id" {
  value = google_project.noteos.project_id
}
output "oauth_setup_next_step" {
  value = "In Google Cloud Console > Google Auth Platform, configure Branding and Audience, then create an OAuth Client ID of type Web application. Add your frontend origins and set the resulting client ID as GOOGLE_CLIENT_ID in the backend and NEXT_PUBLIC_GOOGLE_CLIENT_ID in the frontend."
}
