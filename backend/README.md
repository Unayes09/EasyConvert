# EasyConvert - Microservices Backend

EasyConvert is a modular microservices-based application designed for high-performance file conversions. It uses a distributed architecture with asynchronous background processing to handle heavy tasks like PDF-to-Image conversion without blocking the user interface.

## 🚀 Architecture Overview

The project is built using a "Nervous System" design where multiple specialized containers communicate over a internal Docker network.

### **Core Components**
- **API Gateway (Port 8000)**: The single entry point for all client requests. It handles file staging and acts as a reverse proxy for internal microservices.
- **PDF Service (Port 8001)**: Manages PDF-specific operations, including metadata and conversion orchestration.
- **PDF Worker (Celery)**: A dedicated background worker that performs CPU-intensive PDF-to-PNG conversions using `PyMuPDF`.
- **Image Service (Port 8002)**: (In development) Specialized service for image processing and manipulation.
- **MySQL 8.0**: Centralized persistent storage for file blobs and processing metadata.
- **Redis (Alpine)**: The message broker and task queue for Celery.

---

## 🛠️ API Documentation

All services are accessible through the Gateway on port `8000`.

### **1. Gateway & Upload**
- `POST /upload`: Staging area. Upload any file to store it in the database and receive a unique `id`.

### **2. PDF Conversion (Asynchronous)**
- `POST /pdf/convert-pdf-async`: Starts the PDF-to-Image conversion task.
  - **Input**: `file` (PDF), `dpi` (integer).
  - **Output**: `{"task_id": "uuid-string"}`.
- `GET /pdf/status/{task_id}`: Check the progress of your conversion.
  - **Statuses**: `pending`, `processing`, `completed`, `failed`.
- `GET /pdf/download-images/{task_id}`: Downloads a `.zip` archive containing all converted pages as PNGs.
  - *Note: This endpoint automatically triggers a cleanup, deleting the original PDF and images from the database after a successful download.*

---

## 📂 Project Structure

Both services follow a clean, modular architecture:
```text
app/
├── main.py          # Service entry point & routes
├── database.py      # SQLAlchemy connection & session management
├── models.py        # Database table definitions
├── schemas/         # Pydantic models (Request/Response validation)
├── services/        # Business logic (The "Brain" of the service)
└── utils/           # Helper functions (e.g., ZIP creation)
```

---

## 🚦 Getting Started

### **Prerequisites**
- Docker & Docker Compose
- Redis (for local testing without Docker, see instructions in terminal)

### **Run with Docker**
```bash
# Start all services
docker-compose up --build

# View logs for the PDF worker
docker-compose logs -f pdf-worker
```

### **Database Access**
- **Host**: `localhost`
- **Port**: `3307` (Mapped from internal 3306 to avoid local conflicts)
- **Database**: `easyconvert`
- **User**: `root` / `20020808`
