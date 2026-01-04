# SSB Prep - Monorepo

SSB (Services Selection Board) preparation application with FastAPI backend and Next.js frontend.

## Project Structure

```
ssb-prep/
├── backend/          # FastAPI backend
│   ├── app/          # Application code
│   ├── prisma/       # Database schema
│   └── main.py       # FastAPI application
├── frontend/         # Next.js frontend
│   ├── src/          # Application code
│   ├── public/       # Static assets
│   └── package.json
├── worker/           # Background worker (Node.js)
└── README.md         # This file
```

## Quick Start

### Backend (FastAPI)

See [backend/README.md](./backend/README.md) for setup instructions.

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd prisma
prisma generate --generator prisma-client-python
cd ..
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)

See [frontend/README.md](./frontend/README.md) for setup instructions.

```bash
cd frontend
pnpm install
pnpm dev
```

### Worker

The background worker for processing OCR and AI analysis tasks.

```bash
# From project root
cd worker
npm install
npm run worker
# Or from root with tsx
tsx worker/worker.ts
```

## Development

1. Start the backend API server (port 8000)
2. Start the frontend development server (port 3000)
3. Start the worker process (if needed)

## Environment Variables

- Backend: See `backend/.env.example`
- Frontend: See `frontend/.env.example`

## Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
