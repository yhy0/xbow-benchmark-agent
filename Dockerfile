# syntax=docker/dockerfile:1

# --- 1. Builder Stage ---
# Use uv to build dependencies into a virtual environment
FROM python:3.12.10-alpine AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# --- 2. Final Stage ---
# Build the lean, secure production image
FROM python:3.12.10-alpine

# Add runtime packages and a non-root 'app' user
RUN apk add --no-cache ca-certificates curl git && \
    addgroup -S app && \
    adduser -S app -G app

# Copy the venv from builder and set correct permissions
COPY --from=builder --chown=app:app /app/.venv /opt/venv

# Set work directory
WORKDIR /app

# Copy application code and set permissions
# IMPORTANT: Use a .dockerignore file for fast builds!
COPY --chown=app:app . .

# Switch to the non-root user
USER app

# Set Git safe directory for app user
# This must be done as the app user, not root, to be effective
RUN git config --global --add safe.directory /app

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH"

# Set the entrypoint
ENTRYPOINT [ "python", "-W", "ignore", "-m", "tencent_cloud_hackathon_intelligent_pentest_competition_api_server.server", "--xbow-benchmark-folder", "/app/benchmarks" ]
