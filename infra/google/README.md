# NOTE OS Google Cloud bootstrap

This Terraform stack creates a dedicated Google Cloud project and enables the APIs used by NOTE OS Google Identity integration. It does not create, link, modify, or request access to any billing account.

## Prerequisites
- Google Cloud account with permission to create projects and enable project services. No billing-account permissions are requested by this Terraform configuration.
- Terraform >= 1.6.
- Application Default Credentials: `gcloud auth application-default login`.

## Apply
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit project_id, optional org_id and frontend_origins.
terraform init
terraform plan
terraform apply
```

## OAuth client is a deliberate manual step
Google's OAuth consent/branding and OAuth web client setup should be reviewed in Google Auth Platform. After Terraform finishes:
1. Open Google Cloud Console > Google Auth Platform.
2. Configure Branding and Audience (choose Internal only if all users belong to your Workspace organization; otherwise External).
3. Create an OAuth Client ID of type Web application.
4. Add every exact frontend origin to Authorized JavaScript origins. Do not add wildcard origins.
5. Copy the client ID (never the client secret) into backend `GOOGLE_CLIENT_ID` and frontend `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
6. Set `APP_URL`, SMTP settings, and the frontend/backend deployment URLs.

Terraform does not create a downloadable OAuth client secret or pretend that an OAuth consent screen is verified. Google requires consent-screen and domain verification decisions that must be made by the project owner.
