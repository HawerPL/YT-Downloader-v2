FROM python:3.11-slim

WORKDIR /app

# Instalacja ffmpeg i innych zależności
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Kopiowanie plików aplikacji
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Tworzenie katalogu na pobrane pliki
RUN mkdir -p /app/downloads

EXPOSE 5000

ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

CMD ["python", "app.py"]