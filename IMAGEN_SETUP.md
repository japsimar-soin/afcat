# Google Cloud Vertex AI Imagen API Setup Guide

## 🚀 **Step-by-Step Setup Instructions**

### **1. Prerequisites**

- Google Cloud Project with billing enabled
- Google Cloud CLI installed (`gcloud`)
- Your existing Google Cloud credentials

### **2. Enable Required APIs**

#### **Option A: Using Google Cloud Console (Recommended)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Library**
4. Search and enable these APIs:
   - **Vertex AI API** (`aiplatform.googleapis.com`)
   - **Vertex AI Generative AI API** (`generativelanguage.googleapis.com`)

#### **Option B: Using Google Cloud CLI**

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable generativelanguage.googleapis.com
```

### **3. Set Up Authentication**

#### **Option A: Service Account (Recommended for Production)**

```bash
# Create a service account
gcloud iam service-accounts create ssb-prep-imagen \
    --description="Service account for SSB Prep Imagen API" \
    --display-name="SSB Prep Imagen"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:ssb-prep-imagen@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create ssb-prep-key.json \
    --iam-account=ssb-prep-imagen@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### **Option B: Application Default Credentials (For Development)**

```bash
# Set up application default credentials
gcloud auth application-default login
```

### **4. Environment Variables**

Add these to your `.env.local` file:

```env
# Google Cloud Configuration
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1

# If using service account key file
GOOGLE_APPLICATION_CREDENTIALS=./ssb-prep-key.json

# Or if using existing credentials (same as your OCR setup)
GCP_PROJECT_ID=your-project-id
VISION_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### **5. Enable Imagen API Access**

#### **Check Imagen Availability**

```bash
# Check if Imagen is available in your region
gcloud ai models list --region=us-central1 --filter="displayName:imagen"
```

#### **Request Access (If Not Available)**

1. Go to [Vertex AI Studio](https://console.cloud.google.com/vertex-ai/studio)
2. Navigate to **Vision** > **Image Generation**
3. If prompted, request access to Imagen API
4. Wait for approval (usually instant for most projects)

### **6. Test the Setup**

#### **Test in Vertex AI Studio**

1. Go to [Vertex AI Studio](https://console.cloud.google.com/vertex-ai/studio)
2. Click **Vision** > **Image Generation**
3. Enter a test prompt: "A professional military officer in uniform"
4. Click **Generate** to test

#### **Test via API**

```bash
# Test API access
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/imagegeneration@006:predict" \
  -d '{
    "instances": [{
      "prompt": "A professional military officer in uniform",
      "parameters": {
        "sampleCount": 1,
        "aspectRatio": "1:1"
      }
    }]
  }'
```

### **7. Troubleshooting**

#### **Common Issues:**

1. **"Permission denied"**

   - Ensure your service account has `roles/aiplatform.user` role
   - Check that billing is enabled on your project

2. **"API not enabled"**

   - Enable Vertex AI API: `gcloud services enable aiplatform.googleapis.com`

3. **"Imagen not available"**

   - Request access through Vertex AI Studio
   - Try different regions (us-central1, us-east1, europe-west1)

4. **"Quota exceeded"**
   - Check your quota limits in Google Cloud Console
   - Request quota increase if needed

#### **Check Your Setup:**

```bash
# Verify APIs are enabled
gcloud services list --enabled --filter="name:aiplatform.googleapis.com"

# Check service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:ssb-prep-imagen@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

### **8. Cost Considerations**

- **Imagen API Pricing**: ~$0.02-0.05 per generated image
- **Free Tier**: Usually includes some free usage per month
- **Monitoring**: Set up billing alerts in Google Cloud Console

### **9. Production Deployment**

For production, consider:

- Using service account keys (not user credentials)
- Setting up proper IAM roles and permissions
- Implementing rate limiting and caching
- Monitoring usage and costs

## 🎯 **Quick Start Commands**

```bash
# 1. Enable APIs
gcloud services enable aiplatform.googleapis.com

# 2. Set project
gcloud config set project YOUR_PROJECT_ID

# 3. Test access
gcloud auth application-default login

# 4. Add to .env.local
echo "GCP_PROJECT_ID=YOUR_PROJECT_ID" >> .env.local
echo "GCP_LOCATION=us-central1" >> .env.local

# 5. Restart your app
pnpm dev
```

## ✅ **Verification**

Once set up, you should see:

- No more "Google Cloud not configured" messages
- Console logs showing "Calling Vertex AI Imagen API..."
- Success messages: "Successfully generated image with Vertex AI Imagen"
- Real AI-generated images instead of placeholders

---

**Need Help?** Check the [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs) or [Imagen API Reference](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview).




