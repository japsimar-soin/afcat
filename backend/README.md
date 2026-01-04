# SSB Prep Backend (FastAPI)

FastAPI backend for the SSB Prep application.

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL database
- Redis (for background workers)

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up Prisma:

```bash
# Install Prisma CLI (if not already installed)
npm install -g prisma

# Generate Prisma Python client
cd prisma
prisma generate --generator prisma-client-python
cd ..
```

**Note:** Prisma Python client may be deprecated. Consider migrating to SQLAlchemy in the future.

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run database migrations:

```bash
cd prisma
prisma migrate deploy
# Or for development:
prisma migrate dev
cd ..
```

6. Start the development server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

See `.env.example` for required environment variables.

## Development Notes

- The Prisma schema uses camelCase field names, but Prisma Python converts them to snake_case
- Authentication uses Clerk JWT tokens
- Storage supports both local filesystem and Supabase
- Background workers use Redis/BullMQ (separate worker process)
