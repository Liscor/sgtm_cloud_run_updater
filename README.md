# Cloud Function - Serverside Google Tag Manager Image Updater
This is a Cloud Function designed to check and update the GTM image currently deployed to the specified Cloud Run service.
## Getting Started

1. Clone this repository
2. Deploy with `gcloud builds deploy` to your GCP project
3. Trigger the Cloud Function (e.g. Cloud Scheduler once a day)

The function takes three parameters from the post body to work as expected
```
{
    "project_id": YOUR_PROJECT_ID,
    "region": REGION_OF_THE_CR_SERVICE,
    "service_name: SERVICE_NAME
}
```

