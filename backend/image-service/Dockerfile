FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default port is 8002 for image-service
ENV PORT=8002

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
