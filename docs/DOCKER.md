# Docker Guide

This guide covers Docker-specific operations for the Sales Tracking App.

## Architecture

The application consists of three Docker containers:

```
┌─────────────────┐
│   Frontend      │  Nginx serving React SPA
│   Port: 80      │  (salestracking-frontend)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  .NET 9 Web API
│   Port: 5000    │  (salestracking-backend)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  Database
│   Port: 5432    │  (salestracking-postgres)
└─────────────────┘
```

## Building Images Locally

### Backend

```bash
cd Backend
docker build -t salestracking-backend:local .
```

### Frontend

```bash
cd frontend
docker build -t salestracking-frontend:local .
```

### Build All with Docker Compose

```bash
docker-compose build
```

## Running Locally with Docker Compose

### Development Mode

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Mode

```bash
# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Multi-Architecture Builds

For Raspberry Pi deployment, you need ARM64 images. Use Docker Buildx:

### Setup Buildx

```bash
# Create a new builder instance
docker buildx create --name multiarch --use

# Verify
docker buildx inspect --bootstrap
```

### Build for ARM64

```bash
# Backend
docker buildx build --platform linux/arm64 -t salestracking-backend:arm64 ./Backend

# Frontend
docker buildx build --platform linux/arm64 -t salestracking-frontend:arm64 ./frontend
```

### Build for Multiple Platforms

```bash
# Backend - build for both AMD64 and ARM64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t YOUR_USERNAME/salestracking-backend:latest \
  --push \
  ./Backend

# Frontend
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t YOUR_USERNAME/salestracking-frontend:latest \
  --push \
  ./frontend
```

## Environment Variables

### Backend Container

| Variable | Description | Default |
|----------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | Environment (Development/Production) | `Development` |
| `ASPNETCORE_URLS` | URLs to listen on | `http://+:5000` |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | See docker-compose.yml |

### Frontend Container

Build-time variable:
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API base URL | `/api` |

The frontend uses Nginx proxy to forward `/api/*` requests to the backend container.

### PostgreSQL Container

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `salestracking` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` (change in production!) |

## Volumes

### PostgreSQL Data

Persistent volume for database data:
```yaml
volumes:
  postgres-data:
    driver: local
```

Location on host: `/var/lib/docker/volumes/salestracking_postgres-data/_data`

### Backup Volume

```bash
# Create backup
docker run --rm \
  -v salestracking_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore backup
docker run --rm \
  -v salestracking_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

## Networking

All containers are connected via a bridge network `salestracking-network`.

### Container Communication

- Frontend → Backend: `http://backend:5000`
- Backend → PostgreSQL: `postgres:5432`

### External Access

- Frontend: `http://localhost:80`
- Backend: `http://localhost:5000`
- PostgreSQL: `localhost:5432` (exposed for development)

## Health Checks

### Backend Health Check

```bash
# From host
curl http://localhost:5000/health

# From container
docker exec salestracking-backend curl -f http://localhost:5000/health
```

### PostgreSQL Health Check

```bash
docker exec salestracking-postgres pg_isready -U postgres
```

### All Services

```bash
docker-compose ps
```

Healthy services show `Up (healthy)` status.

## Resource Limits (Production)

Configured in `docker-compose.prod.yml`:

| Service | CPU Limit | Memory Limit | CPU Reservation | Memory Reservation |
|---------|-----------|--------------|-----------------|-------------------|
| PostgreSQL | 1.0 | 512M | 0.5 | 256M |
| Backend | 1.0 | 512M | 0.5 | 256M |
| Frontend | 0.5 | 256M | 0.25 | 128M |

These limits are optimized for Raspberry Pi 4 (4GB RAM).

## Debugging

### Access Container Shell

```bash
# Backend
docker exec -it salestracking-backend /bin/bash

# Frontend
docker exec -it salestracking-frontend /bin/sh

# PostgreSQL
docker exec -it salestracking-postgres /bin/bash
```

### View Container Logs

```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Inspect Container

```bash
docker inspect salestracking-backend
```

### Check Resource Usage

```bash
docker stats
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker-compose logs SERVICE_NAME
```

Common issues:
- Port already in use: Change port mapping in docker-compose.yml
- Volume permission issues: Check file ownership
- Out of memory: Increase resource limits or free up memory

### Cannot Connect to Database

Verify PostgreSQL is running:
```bash
docker-compose ps postgres
```

Check connection from backend:
```bash
docker exec salestracking-backend ping postgres
```

Verify credentials in `.env` file.

### Frontend Shows 502 Bad Gateway

Backend is not responding. Check:
```bash
docker-compose logs backend
curl http://localhost:5000/health
```

Verify nginx configuration:
```bash
docker exec salestracking-frontend cat /etc/nginx/conf.d/default.conf
```

### Image Build Fails

Clear build cache:
```bash
docker builder prune -a
```

Build with no cache:
```bash
docker-compose build --no-cache
```

### ARM64 Build Issues on Windows/Mac

Ensure QEMU is installed:
```bash
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```

## Best Practices

1. **Use .dockerignore**: Exclude unnecessary files from build context
2. **Multi-stage builds**: Reduce final image size
3. **Layer caching**: Order Dockerfile commands from least to most frequently changing
4. **Health checks**: Always define health checks for services
5. **Resource limits**: Set appropriate limits for production
6. **Secrets management**: Never commit secrets to version control
7. **Image tagging**: Use semantic versioning for production images
8. **Regular updates**: Keep base images updated for security patches

## Cleaning Up

### Remove Stopped Containers

```bash
docker-compose down
```

### Remove Volumes

```bash
docker-compose down -v
```

### Remove All Unused Resources

```bash
docker system prune -a --volumes
```

### Remove Specific Images

```bash
docker rmi salestracking-backend:local
docker rmi salestracking-frontend:local
```

## Advanced: Custom Nginx Configuration

To customize the frontend Nginx configuration:

1. Edit `frontend/nginx.conf`
2. Rebuild the frontend image:
   ```bash
   docker-compose build frontend
   ```
3. Restart the container:
   ```bash
   docker-compose up -d frontend
   ```

## Advanced: Database Migrations

For production deployments, use proper Entity Framework migrations instead of `EnsureCreated()`:

```bash
# Create migration
docker exec salestracking-backend dotnet ef migrations add MigrationName

# Apply migration
docker exec salestracking-backend dotnet ef database update
```

## Performance Tuning

### PostgreSQL

Add to docker-compose.yml:
```yaml
postgres:
  command: postgres -c shared_buffers=256MB -c max_connections=100
```

### Nginx

Enable gzip compression (already configured in nginx.conf):
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Docker Daemon

Edit `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```
