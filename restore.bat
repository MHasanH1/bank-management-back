@echo off
echo Available backups:
dir backups\*.tar.gz /b
echo.
set /p BACKUP_FILE="Enter backup filename: "

echo Stopping containers...
docker compose down

echo Removing old volume...
docker volume rm bank-management-back_pg-data 2>nul

echo Restoring PostgreSQL data...
docker run --rm -v bank-management-back_pg-data:/var/lib/postgresql/data -v ./backups:/backups:ro alpine sh -c "mkdir -p /tmp/restore && tar xzf /backups/%BACKUP_FILE% -C /tmp/restore && cp -a /tmp/restore/backup/pg-data/. /var/lib/postgresql/data/ && chown -R 70:70 /var/lib/postgresql/data"

echo Starting containers...
docker compose up -d

echo Waiting for PostgreSQL to be ready...
:wait_loop
docker compose exec -T postgres pg_isready -U db-user -d db-proj > nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak > nul
    goto wait_loop
)

echo Data restored successfully!