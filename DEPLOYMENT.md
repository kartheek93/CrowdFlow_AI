# Deploying CrowdFlow X to Google Cloud Run

To make this an impactful submission for the Hackathon and utilize your $300 Google Cloud Credits, we've set up two scalable microservices that will run seamlessly on Cloud Run.

## Prerequisites
1. Ensure you have the [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install) installed.
2. Initialize and authenticate your session:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Enable necessary APIs:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

---

## Step 1: Deploying the Backend (Python FastAPI)

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Build and Deploy directly using the Cloud Run source deployment feature:
   ```bash
   gcloud run deploy crowdflow-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8000
   ```
3. **Capture the Backend URL**: Once deployed, it will give you a public URL (e.g., `https://crowdflow-backend-xyz.a.run.app`).

---

## Step 2: Deploying the Frontend (Next.js React)

1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Open `src/app/page.tsx` and `src/components/AIAssistant.tsx`, and update the `http://localhost:8000` strings to the **Backend URL** you just received in Step 1.
3. Build and Deploy:
   ```bash
   gcloud run deploy crowdflow-frontend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000
   ```
4. **Done!** Click the Frontend URL to access your massive, end-to-end Hackathon-winning project. 

## Demonstrating to Judges
When you show this application:
1. Provide your live **Frontend URL**.
2. Explain that the AI Agent is hitting the Backend architecture to use the **Vertex AI Gemini Model** combined with dynamic physics-engine simulated data.
3. Use your Event Simulator in the UI to effortlessly prove the front-end and back-end are talking to each other natively through your own API!
