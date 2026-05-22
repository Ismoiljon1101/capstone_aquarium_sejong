FROM python:3.10-slim

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies for OpenCV (libgl/glib) and OpenMP (libgomp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Remove hardcoded torch and opencv packages from requirements to optimize for headless/CPU environments
# This prevents downloading massive CUDA-enabled torch libraries or compiling GUI frameworks in docker
RUN sed -i '/torch==/d' requirements.txt && \
    sed -i '/opencv-python==/d' requirements.txt

# Install pip upgrade, CPU-only PyTorch, and headless OpenCV
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir opencv-python-headless && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code and other artifacts
COPY . .

# Expose the FastAPI service port
EXPOSE 8000

# Start the FastAPI application with Uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
