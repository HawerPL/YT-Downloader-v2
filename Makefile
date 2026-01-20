.PHONY: build up down restart logs clean

# Zbuduj i uruchom kontenery
build:
	docker-compose build

# Uruchom kontenery
up:
	docker-compose up -d

# Zatrzymaj kontenery
down:
	docker-compose down

# Restart kontenerów
restart:
	docker-compose restart

# Zobacz logi
logs:
	docker-compose logs -f

# Zobacz logi backendu
logs-backend:
	docker-compose logs -f backend

# Zobacz logi frontendu
logs-frontend:
	docker-compose logs -f frontend

# Wyczyść wszystko (kontenery, obrazy, volumes)
clean:
	docker-compose down -v --rmi all

# Przebuduj i uruchom
rebuild: down build up

# Status kontenerów
status:
	docker-compose ps