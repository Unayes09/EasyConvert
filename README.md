# EasyConvert

A containerized, microservice-oriented document and image processing platform built with FastAPI and Docker. It provides high‑performance PDF and image operations behind a lightweight API gateway, with asynchronous workloads powered by Celery and Redis.

## Highlights

- FastAPI microservices with clean, typed endpoints
- Asynchronous PDF conversions via Celery + Redis
- MySQL persistence for uploads and task statuses
- Reverse‑proxy style API Gateway (single public base URL)
- One‑command local orchestration via Docker Compose
- Next.js frontend (consumes the gateway)

## Architecture

Services are defined in [`docker-compose.yml`](./docker-compose.yml):

- **gateway** (FastAPI, port 8000)
  - Single entrypoint used by the frontend and tools
  - Proxies requests to downstream services
  - Persists uploads/metadata to MySQL
  - Env:
    - `PDF_SERVICE_URL=http://pdf-service:8001`
    - `IMAGE_SERVICE_URL=http://image-service:8002`
    - `DATABASE_URL=mysql+pymysql://root:20020808@mysql:3306/easyconvert`

- **pdf-service** (FastAPI, port 8001) + **pdf-worker** (Celery)
  - Heavy PDF jobs and asynchronous pipelines
  - Uses Celery worker with Redis broker/result backend
  - Persists input and processed artifacts to MySQL
  - Env:
    - `CELERY_BROKER_URL=redis://redis:6379/0`
    - `CELERY_RESULT_BACKEND=redis://redis:6379/0`
    - `DATABASE_URL=mysql+pymysql://root:20020808@mysql:3306/easyconvert`

- **image-service** (FastAPI, port 8002)
  - Synchronous image manipulation and conversions

- **mysql** (MySQL 8, port 3307->3306) and **redis** (port 6379)
  - State and task queue infrastructure

- **frontend** (Next.js, port 3000)
  - Consumes the gateway (`NEXT_PUBLIC_API_GATEWAY=http://localhost:8000`)

All services are joined on the `easyconvert-net` docker network.

## Features

### Gateway (FastAPI)
Path: [`backend/gateway/app`](./backend/gateway/app)

- `POST /upload` — store an uploaded file in MySQL and return an ID
- `/*` proxy to:
  - `/pdf/*` → PDF Service
  - `/image/*` → Image Service

Internally forwards multipart and streaming responses (e.g., PDF, ZIP, images) with proper headers.

### PDF Service (FastAPI + Celery)
Path: [`backend/pdf-service/app`](./backend/pdf-service/app)

- `POST /convert-pdf-async` — enqueue “PDF to images” task; returns a `task_id`
- `GET /status/{task_id}` — query task status (`pending|completed|failed`)
- `GET /download-images/{task_id}` — download ZIP after completion
- `POST /insert-image` — insert an image into a PDF at a specific index (returns modified PDF)
- `POST /split-pdf` — split by page ranges; returns a single PDF or a ZIP of PDFs
- `POST /add-page-numbers` — add page numbers to all pages (bottom‑right)
- `POST /pdf-to-docx` — convert PDF to DOCX
- `POST /merge-pdfs` — merge multiple PDFs (order preserved)

### Image Service (FastAPI)
Path: [`backend/image-service/app`](./backend/image-service/app)

- `POST /change-format` — convert an image to PNG/JPG/JPEG/WEBP
- `POST /images-to-pdf` — combine 1..N images into a single PDF
- `POST /edit-image` — adjust brightness, contrast, sharpness, grayscale, rotate
- `POST /crop-image` — crop image by percentage (left/right/top/bottom)

## Local Development (Docker‑first)

Prerequisites: Docker Desktop or a working Docker Engine.

```bash
# From the project root
docker-compose up --build
```

Exposed ports (host → container):

- Gateway: `8000 → 8000`
- PDF Service: `8001 → 8001`
- Image Service: `8002 → 8002`
- MySQL: `3307 → 3306`
- Redis: `6379 → 6379`
- Frontend: `3000 → 3000`

Frontend will expect the gateway at `http://localhost:8000` (set in compose).

## Quick API Examples

Use the **gateway** as the single base URL: `http://localhost:8000`.

### Upload
```bash
curl -F "file=@/path/to/file.pdf" http://localhost:8000/upload
```

### PDF → Images (async)
```bash
curl -F "file=@/path/to/file.pdf" \
  http://localhost:8000/pdf/convert-pdf-async

# Status polling
curl http://localhost:8000/pdf/status/<task_id>

# Download (when completed)
curl -OJ http://localhost:8000/pdf/download-images/<task_id>
```

### Insert Image into PDF
```bash
curl -F "pdf_file=@/path/to/file.pdf" \
     -F "image_file=@/path/to/image.png" \
     -F "split_index=0" \
     http://localhost:8000/pdf/insert-image -o modified.pdf
```

### Merge PDFs
```bash
curl -F "files=@/path/a.pdf" -F "files=@/path/b.pdf" \
  http://localhost:8000/pdf/merge-pdfs -o merged.pdf
```

### Image Format Change
```bash
curl -F "file=@/path/to/image.jpg" \
  "http://localhost:8000/image/change-format?target_format=png" \
  -o converted.png
```

## Tech Stack

- **FastAPI** — high‑performance Python web framework
- **Celery + Redis** — background tasks and result backend for heavy conversions
- **MySQL** — durable storage for uploads and task states
- **Docker Compose** — reproducible, multi‑container orchestration
- **Next.js** — frontend consuming the gateway APIs

## Notes & Tips

- The gateway and services auto‑initialize their databases on startup.
- For large PDFs, use the async conversion route and poll status, then download ZIP.
- Keep an eye on MySQL volume usage (`mysql-data`). Remove with `docker volume rm` when needed.
- For production, restrict CORS and move secrets to a proper secret store.

---

If you need a new operation (e.g., watermarking PDFs, compressing images), the pattern is:
1) add endpoint in PDF/Image service,
2) expose it via gateway proxy,
3) call from the frontend.

