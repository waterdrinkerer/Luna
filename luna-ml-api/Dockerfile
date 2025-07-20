# Use Python 3.11 (more stable for ML packages)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create models directory
RUN mkdir -p models

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Use Gunicorn as WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "300", "app:app"]