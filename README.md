# Cloud Run GTM Image Updater

A Cloud Function that automatically checks and updates the server-side Google Tag Manager image for your Cloud Run service.

## Deployment

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Usage

Trigger the function via HTTP POST (e.g., with Cloud Scheduler):

```json
{
    "project_id": "your-project-id",
    "region": "us-central1",
    "service_name": "your-service-name"
}
```

## Local Testing

Install dependencies and start the Functions Framework:

```bash
npm install
npm start
```

Then trigger the function locally:

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"project_id":"your-project-id","region":"us-central1","service_name":"your-service-name"}'
```

Make sure you're authenticated with `gcloud auth application-default login` to access GCP resources.

## Recommended Setup

Schedule daily updates using Cloud Scheduler to keep your GTM image current.

**Required Permissions:** To invoke a non-public Cloud Function, the Cloud Scheduler service account needs the `roles/cloudfunctions.invoker` role. Grant this by running:

```bash
gcloud functions add-iam-policy-binding YOUR_FUNCTION_NAME \
  --region=YOUR_REGION \
  --member=serviceAccount:YOUR_SCHEDULER_SA@YOUR_PROJECT.iam.gserviceaccount.com \
  --role=roles/cloudfunctions.invoker
```

