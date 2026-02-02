# YouTube Downloader

Nowoczesna aplikacja do pobierania filmów i muzyki z YouTube, tiktoków, rolek oraz filmów z X, która została zbudowana z wykorzystaniem React + Flask.

99% aplikacji zostało napisane przez sztuczną inteligencję do użytku osobistego i rozwoju vibe codingu. Przestrzegaj licencji pobieranych nagrań!

## 📁 Struktura projektu

```
YT-Downloader-v2/
├── docker-compose.yml
├── Makefile
├── README.md
├── downloads/              
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        └── App.js
```

## 🚀 Szybki start

### Wymagania
- Docker
- Docker Compose

### Instalacja i uruchomienie

1. **Sklonuj repozytorium lub stwórz strukturę katalogów**

2. **Uruchom aplikację**

```bash
# Z użyciem docker-compose
docker-compose up -d

# Lub z użyciem Makefile
make build
make up
```

3. **Otwórz przeglądarkę**

Aplikacja będzie dostępna pod adresem: `http://localhost:18080`

## 🛠️ Komendy

### Z docker-compose:
```bash
# Uruchom kontenery
docker-compose up -d

# Zatrzymaj kontenery
docker-compose down

# Zobacz logi
docker-compose logs -f

# Przebuduj obrazy
docker-compose build

# Restart
docker-compose restart
```

### Z Makefile:
```bash
make build      # Zbuduj obrazy
make up         # Uruchom kontenery
make down       # Zatrzymaj kontenery
make restart    # Restart kontenerów
make logs       # Zobacz wszystkie logi
make logs-backend   # Logi backendu
make logs-frontend  # Logi frontendu
make clean      # Wyczyść wszystko
make rebuild    # Przebuduj i uruchom
make status     # Status kontenerów
```

## 🎯 Funkcjonalności

- ✅ Pobieranie wideo w różnych jakościach (do 4K)
- ✅ Pobieranie audio w formacie MP3
- ✅ Podgląd miniaturki i informacji o filmie
- ✅ Wybór jakości i formatu
- ✅ Nowoczesny, responsywny interfejs
- ✅ Obsługa wielu platform (YouTube, Vimeo, i inne)

## 🏗️ Architektura

### Backend (Flask + Python)
- Port: 5000 (wewnętrzny)
- Framework: Flask
- Biblioteka: yt-dlp
- API endpoints:
  - `POST /api/info` - Pobierz informacje o filmie
  - `POST /api/download` - Pobierz plik

### Frontend (React + Nginx)
- Port: 8080 (zewnętrzny)
- Framework: React
- Ikony: Lucide React
- Styling: Tailwind CSS
- Serwer: Nginx

### Komunikacja
- Frontend → Nginx → Backend
- Nginx działa jako reverse proxy
- Izolacja w sieci Docker (yt-network)

## 📦 Volumes

Pobrane pliki są zapisywane w katalogu `./downloads` na hoście.

## 🔧 Konfiguracja

### Zmiana portu
Edytuj `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "TWÓJ_PORT:80"  # np. "3000:80"
```

### Limity zasobów
Dodaj do `docker-compose.yml`:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

## 🐛 Troubleshooting

### Problem: Kontenery nie startują
```bash
# Sprawdź logi
docker-compose logs

# Sprawdź status
docker-compose ps
```

## 📝 Licencja

Ten projekt jest dostępny na licencji MIT.

## 🤝 Contributing

Pull requesty są mile widziane!

## ⚠️ Disclaimer

Narzędzie przeznaczone wyłącznie do użytku osobistego. Przestrzegaj praw autorskich i regulaminu YouTube.