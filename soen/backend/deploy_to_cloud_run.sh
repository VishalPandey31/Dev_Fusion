#!/bin/bash
echo "Starting deployment to Cloud Run..."
# Read environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Deploy with environment variables
gcloud run deploy backend \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI="$MONGODB_URI",JWT_SECRET="$JWT_SECRET"

echo "Deployment command finished."
