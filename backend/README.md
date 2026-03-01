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

Each service has its own interactive Swagger UI.

- **Gateway Service**: `http://localhost:8000/docs` (Note: Proxy routes show generic parameters)
- **PDF Service**: `http://localhost:8001/docs` (Recommended for testing PDF specific APIs)
- **Image Service**: `http://localhost:8002/docs`

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

### **3. PDF Modification (Synchronous)**
- `POST /pdf/insert-image`: Inserts an image as a new page into an existing PDF.
  - **Inputs (Multipart Form)**: 
    - `pdf_file`: The source PDF.
    - `image_file`: The image to insert (PNG/JPG).
    - `split_index`: The page index where the image should be inserted (0 for the very first page).
  - **Output**: Returns the modified PDF file directly.

- `POST /pdf/split-pdf`: Extracts specific pages or ranges from a PDF into separate files.
  - **Inputs (Multipart Form)**:
    - `file`: The source PDF.
    - `ranges`: A string representing page ranges.
      - **Format**: Comma-separated numbers or ranges (1-based).
      - **Example**: `"1-3, 5"` will extract pages 1-3 into one PDF and page 5 into another.
  - **Output**: Returns a **ZIP archive** containing the separate PDF files (or a single PDF if only one range was requested).

- `POST /pdf/add-page-numbers`: Adds "Page X of Y" labels to the bottom right of every page.
  - **Inputs (Multipart Form)**:
    - `file`: The source PDF.
  - **Output**: Returns the PDF with added page numbers.

- `POST /pdf/merge-pdfs`: Merges multiple PDF files into one.
  - **Inputs (Multipart Form)**:
    - `files`: One or more PDF files.
  - **Output**: Returns the merged PDF file directly.

- `POST /pdf/pdf-to-docx`: Converts a PDF file into a Word document (.docx).
  - **Inputs (Multipart Form)**:
    - `file`: The source PDF.
  - **Output**: Returns the converted .docx file.

---

## 🖼️ Image Service APIs

All image operations are synchronous and available via the Gateway on port `8000`.

### **1. Format & Conversion**
- `POST /image/change-format`: Changes an image's format (e.g., PNG to WEBP).
  - **Params**: `target_format` (PNG, JPG, WEBP, etc.)
- `POST /image/images-to-pdf`: Combines one or more images into a single PDF.
  - **Inputs**: Multiple `files` (images).

### **2. Editing & Manipulation**
- `POST /image/edit-image`: Adjust visual properties.
  - **Params**: `brightness`, `contrast`, `sharpness` (float, 1.0 is default), `grayscale` (bool), `rotate` (int).
- `POST /image/crop-image`: Crops images based on percentage from each side.
  - **Params**: `left`, `right`, `top`, `bottom` (float, 0-100).

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
