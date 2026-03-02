# local-chat-integration

A chat application powered by a locally-running Hugging Face language model. The frontend is a Next.js app with a timeline-style chat UI; the backend is a FastAPI service with token streaming over SSE and PostgreSQL for persistence.

---

## Tech Stack

| Layer     | Technology                                                            |
| --------- | --------------------------------------------------------------------- |
| Frontend  | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4        |
| Backend   | Python 3.13, FastAPI, SQLModel, asyncpg, SSE-Starlette                |
| LLM       | Hugging Face Transformers — `HuggingFaceTB/SmolLM2-1.7B-Instruct`     |
| Database  | PostgreSQL 17 with pgvector                                           |
| Container | Docker + Docker Compose                                               |
| Dev tools | uv (Python), pnpm (Node), Taskfile (task runner), Claude code, Cursor |

---

## Required Environment Files

Before starting, create the following two files:

### `api-server/.env`

```env
HF_TOKEN=<your Hugging Face token>
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/chatapp
MODEL_NAME=HuggingFaceTB/SmolLM2-1.7B-Instruct
```

- `HF_TOKEN` — a Hugging Face access token (obtainable at https://huggingface.co/settings/tokens). Required to download model weights at build time.
- `DATABASE_URL` — connection string for the Postgres container; no changes needed when using Docker Compose.
- `MODEL_NAME` — the Hugging Face model to load. Defaults to `SmolLM2-1.7B-Instruct`.

### `web-app/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- `NEXT_PUBLIC_API_URL` — the base URL the browser uses to reach the API. Keep `localhost:8000` when running via Docker Compose.

---

## How to Build, Start, and Run

### Prerequisites

- Docker and Docker Compose (Docker Desktop or Docker Engine ≥ 24)

### Single-command start (recommended)

```bash
# docker
docker compose up --build

# task
task docker-up
```

This will:

1. Build the API image — downloads model weights from Hugging Face into the image using `HF_TOKEN` as a build secret.
2. Build the Next.js image — produces a standalone production build.
3. Start PostgreSQL, the API server, and the web app.

Once all services are healthy, open **http://localhost:3000** in your browser.

> **Note:** The first build downloads ~3 GB of model weights. Subsequent builds are fast because the weights layer is cached.

### Stopping

```bash
docker compose down
```

Add `-v` to also remove the database and model-cache volumes:

```bash
docker compose down -v
```

---

## Local Development (without Docker)

### Requirements

- Python 3.13+, [uv](https://github.com/astral-sh/uv)
- Node.js 22+, [pnpm](https://pnpm.io/)
- PostgreSQL 17 (or run just the database via `database/docker-compose.yml`)
- [Task](https://taskfile.dev/) (optional, but recommended)

### Install dependencies

```bash
task install        # installs both api-server and web-app dependencies
```

Or individually:

```bash
cd api-server && uv sync
cd web-app && pnpm install
```

### Start the database only

```bash
cd database && docker compose up -d
```

### Run the API server

```bash
cd api-server
task serve          # production-style: uvicorn with reload off
# or
task run            # development mode with auto-reload
```

### Run the frontend

```bash
cd web-app
pnpm dev
```

The app is available at **http://localhost:3000**.

---

## Project Structure

```
.
├── api-server/          # FastAPI backend
│   ├── app/
│   │   ├── models/      # SQLModel ORM models (Chat, Message)
│   │   ├── routers/     # HTTP endpoints (chats, messages)
│   │   ├── modules/     # Business logic
│   │   └── services/    # LLM inference service
│   ├── scripts/         # Weight download helper
│   ├── Dockerfile
│   └── pyproject.toml
├── web-app/             # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # Chat UI, sidebar, theme toggle
│   │   ├── hooks/       # SSE streaming hook
│   │   └── lib/         # API client (browser + server)
│   ├── Dockerfile
│   └── package.json
├── database/            # Standalone DB compose for local dev
├── docker-compose.yml
└── Taskfile.yml
```
