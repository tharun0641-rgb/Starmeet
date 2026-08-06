# Multi-stage Docker build for StarMeet FastAPI & Socket.IO server
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn socketio PyJWT pydantic[email] gunicorn

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "main:sio_app"]
