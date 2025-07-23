FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies with increased timeout
RUN pip install --no-cache-dir --timeout=120 -r requirements.txt

# Create models directory and copy models FIRST
RUN mkdir -p /app/models
COPY models/ /app/models/

# Verify models were copied correctly
RUN echo "📋 Models copied:" && ls -la /app/models/

# Copy application code
COPY app.py /app/
COPY test_model.py /app/

# Set environment variables for production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Use optimized Gunicorn settings for ML workloads
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--timeout", "600", "--preload", "app:app"]
