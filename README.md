# SSB Prep - Practice Platform

A Next.js 14 application for SSB (Services Selection Board) practice with PPDT and TAT modes, featuring AI-powered analysis and cloud storage.

## Features

- **Practice Modes**: PPDT (Picture Perception and Discussion Test) and TAT (Thematic Apperception Test)
- **Image Management**: Upload and manage practice images
- **OCR Integration**: Google Cloud Vision API for text extraction from images
- **AI Analysis**: OpenAI-powered feedback on responses with detailed scoring
- **Attempt Tracking**: Save and review practice attempts
- **Authentication**: Clerk-based user management
- **Dark Mode**: Theme switching with next-themes
- **Cloud Storage**: Supabase storage with local fallback
- **Background Processing**: Redis + BullMQ for job queues
- **Image Generation**: AI-generated practice images
- **Real-time Processing**: Background job queues for OCR and AI analysis

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **Image Processing**: Sharp, file-type
- **OCR**: Google Cloud Vision API with fallback
- **Storage**: Supabase Storage with local adapter fallback
- **AI Analysis**: Google Gemini 1.5 Flash
- **Background Jobs**: Redis + BullMQ
- **Image Generation**: Replicate (Stable Diffusion XL)

## Setup

### 1. Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Neon recommended)
- Google Cloud Vision API access (optional, for OCR)

### 2. Installation

```bash
# Clone and install dependencies
git clone <repository>
cd ssb-prep
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### 3. Environment Variables

Create `.env.local` with:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Google Cloud Vision API (for OCR)
GCP_PROJECT_ID=your-project-id
VISION_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase Storage (optional - falls back to local if not set)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_BUCKET_NAME=ssb-prep-images

# Redis (for background job processing)
REDIS_URL=redis://localhost:6379

# Google Gemini (for AI analysis)
GEMINI_API_KEY=your-gemini-api-key

# Replicate (for image generation)
REPLICATE_API_KEY=your-replicate-api-key
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed initial data
pnpm prisma db seed
```

### 5. Google Cloud Vision Setup (Optional)

1. **Create a Google Cloud Project**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing

2. **Enable Vision API**

   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API" and enable it

3. **Set up Authentication**

   - Go to "IAM & Admin" > "Service Accounts"
   - Create a new service account
   - Download the JSON key file
   - Extract these values and set in `.env.local`:
     ```bash
     GCP_PROJECT_ID=your-project-id
     VISION_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
     VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     ```

### 6. Redis Setup (for Background Processing)

```bash
# Install Redis (macOS)
brew install redis

# Start Redis
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

### 7. Background Worker Setup

```bash
# Start the background worker (in a separate terminal)
pnpm tsx worker/worker.ts

# Or build and run
pnpm build
node dist/worker/worker.js
```

### 8. Migration to Cloud Storage (Optional)

If you want to migrate from local storage to Supabase:

```bash
# Run the migration script
pnpm tsx scripts/migrate_seed_images.ts
```

### 9. Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## API Endpoints

### Images

- `GET /api/images` - Fetch images with filters
- `POST /api/images/upload` - Upload new images

### Attempts

- `POST /api/attempts` - Create new attempt (with optional textResponse)
- `GET /api/attempts?imageId=xyz` - Get attempts for an image
- `GET /api/attempts/[id]` - Get individual attempt with feedback
- `PATCH /api/attempts/[id]` - Update attempt (triggers AI analysis if text provided)
- `GET /api/my-attempts` - Get user's attempts

### Background Processing

- `POST /api/images/upload` - Upload image (triggers OCR job if answer image)
- OCR jobs are processed in background with retry logic
- AI analysis jobs are queued after OCR completion
- Image generation jobs for creating new practice images

### OCR

- `POST /api/ocr` - Process image with OCR

## OCR Functionality

The OCR system provides:

1. **Google Cloud Vision API**: High-accuracy text extraction
2. **Fallback OCR**: Simulated results when Google Cloud Vision is unavailable
3. **Image Preprocessing**: Grayscale conversion and normalization for better results
4. **Confidence Scoring**: Accuracy metrics for OCR results

### OCR Features

- **Text Detection**: Extracts printed and handwritten text
- **Multi-language Support**: Handles various languages
- **Image Optimization**: Automatic preprocessing for better accuracy
- **Real-time Processing**: Fast response times (2-5 seconds)

## Storage Architecture

The app uses a pluggable storage adapter pattern:

- **Local Storage**: Files saved to `public/uploads/`
- **Future**: Supabase, AWS S3, or other cloud storage

## Development Commands

```bash
# Database
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:migrate     # Run migrations
pnpm prisma:seed        # Seed database
pnpm prisma:studio      # Open Prisma Studio

# Development
pnpm dev                # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (protected)/       # Protected routes
│   └── (public)/          # Public routes
├── components/             # React components
├── lib/                    # Utilities and configurations
│   ├── storage/           # Storage adapters
│   └── db.ts             # Prisma client
└── prisma/                # Database schema and migrations
```

## Future Enhancements

- [ ] Supabase Storage integration
- [ ] AWS S3 storage adapter
- [ ] Advanced image analysis
- [ ] Performance analytics
- [ ] Batch image processing
- [ ] Multi-language OCR support
- [ ] AI-powered feedback on practice attempts
- [ ] Collaborative practice sessions
- [ ] Mobile app (React Native)
- [ ] Advanced image preprocessing for better OCR

## Troubleshooting

### OCR Not Working

1. Check Google Cloud Vision credentials
2. Verify API is enabled in Google Cloud Console
3. Check console logs for authentication errors

### Database Issues

1. Ensure `DATABASE_URL` is correct
2. Run `pnpm prisma generate` after schema changes
3. Check Prisma Studio for data verification

### Build Errors

1. Clear `.next` and `node_modules/.cache`
2. Run `pnpm install` to refresh dependencies
3. Check TypeScript compilation errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
