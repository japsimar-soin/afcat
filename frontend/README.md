# SSB Prep Frontend (Next.js)

Next.js frontend for the SSB Prep application.

## Setup

### Prerequisites

- Node.js 18+ or Bun
- npm, pnpm, or yarn

### Installation

```bash
# Install dependencies
pnpm install
# or
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_API_URL` - FastAPI backend URL (default: http://localhost:8000)

### Development

```bash
# Start development server
pnpm dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Migration Notes

This frontend has been migrated to work with the FastAPI backend instead of Next.js API routes.

### API Integration

- The frontend now calls the FastAPI backend at the URL specified in `NEXT_PUBLIC_API_URL`
- API client utilities are in `src/lib/api.ts`
- Update API calls throughout the codebase to use the new API client or update fetch URLs

### Authentication

- Clerk authentication is still used
- Auth tokens need to be passed to the FastAPI backend
- Update authentication token handling if needed

### Database

- Database operations are now handled by the FastAPI backend
- Prisma schema is in `../backend/prisma/`
