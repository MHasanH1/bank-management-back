#!/bin/bash

echo "Available backups:"
ls -1 backups/*.tar.gz
echo ""

read -p "Enter backup filename: " BACKUP_FILE

if [ ! -f "backups/$BACKUP_FILE" ]; then
    echo "❌ Backup file not found!"
    exit 1
fi

PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
PG_VOLUME="${PROJECT_NAME}_pg-data"

echo "Stopping containers..."
docker compose down

echo "Removing old volume..."
docker volume rm $PG_VOLUME 2>/dev/null

echo "Restoring PostgreSQL data..."
docker run --rm \
  -v $PG_VOLUME:/var/lib/postgresql/data \
  -v $(pwd)/backups:/backups:ro \
  alpine sh -c "
    mkdir -p /tmp/restore
    tar xzf /backups/$BACKUP_FILE -C /tmp/restore
    cp -a /tmp/restore/backup/pg-data/. /var/lib/postgresql/data/
    chown -R 70:70 /var/lib/postgresql/data
    echo 'PostgreSQL data restored'
  "

echo "Starting containers..."
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U db-user -d db-proj > /dev/null 2>&1; do
    sleep 2
done

echo "✅ Data restored successfully!"
echo "PostgreSQL is running with restored data."