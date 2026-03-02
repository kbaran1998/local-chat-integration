# Stage 1: base — install uv and project dependencies
FROM python:3.13-slim AS base

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml ./
RUN uv sync --no-dev --no-install-project

COPY . .
RUN uv sync --no-dev --no-install-project

# Stage 2: weights — download model weights (.env mounted as a secret, never stored in any layer)
FROM base AS weights

RUN --mount=type=secret,id=envfile,target=/app/.env \
    uv run python scripts/download_weights.py

# Stage 3: runtime — final image without HF_TOKEN
FROM base AS runtime

COPY --from=weights /app/model_weights ./model_weights

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
