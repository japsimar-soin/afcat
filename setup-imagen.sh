#!/bin/bash

# Google Cloud Vertex AI Imagen Setup Script
# This script helps you set up Imagen API for SSB Prep

set -e

echo "🚀 Setting up Google Cloud Vertex AI Imagen API..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please authenticate with Google Cloud..."
    gcloud auth login
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project selected. Please set your project:"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Current project: $PROJECT_ID"
echo ""

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable aiplatform.googleapis.com
gcloud services enable generativelanguage.googleapis.com

echo "✅ APIs enabled successfully!"
echo ""

# Check if Imagen is available
echo "🔍 Checking Imagen API availability..."
if gcloud ai models list --region=us-central1 --filter="displayName:imagen" --format="value(name)" | grep -q imagen; then
    echo "✅ Imagen API is available in your project!"
else
    echo "⚠️  Imagen API might not be available yet."
    echo "   Please visit: https://console.cloud.google.com/vertex-ai/studio"
    echo "   Navigate to Vision > Image Generation to request access."
fi

echo ""
echo "🎯 Next steps:"
echo "1. Add these to your .env.local file:"
echo "   GCP_PROJECT_ID=$PROJECT_ID"
echo "   GCP_LOCATION=us-central1"
echo ""
echo "2. If you haven't already, set up authentication:"
echo "   gcloud auth application-default login"
echo ""
echo "3. Restart your development server:"
echo "   pnpm dev"
echo ""
echo "4. Test the AI image generation in your app!"
echo ""
echo "🎉 Setup complete! Check IMAGEN_SETUP.md for detailed instructions."





