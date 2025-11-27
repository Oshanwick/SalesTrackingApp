# Local Docker Image Building on Raspberry Pi

This document explains how the CI/CD pipeline builds Docker images locally on your Raspberry Pi instead of pulling from Docker Hub.

## Overview

With the self-hosted runner approach, Docker images are built directly on your Raspberry Pi during deployment. This provides several advantages:

✅ **No Docker Hub dependency** - No need for Docker Hub account or credentials
✅ **Faster deployments** - No image download time
✅ **Complete control** - Full control over the build process
✅ **Cost-effective** - No Docker Hub storage costs
✅ **Privacy** - Images stay on your infrastructure

## How It Works

### Deployment Flow

```
1. Push to GitHub main branch
   ↓
2. GitHub Actions triggers workflow
   ↓
3. Tests run on GitHub-hosted runners
   ↓
4. Self-hosted runner (on Raspberry Pi) starts deployment
   ↓
5. Checkout code on Raspberry Pi
   ↓
6. Build backend Docker image locally
   ↓
7. Build frontend Docker image locally
   ↓
8. Stop existing containers
   ↓
9. Start new containers with fresh images
   ↓
10. Health checks and verification
   ↓
11. Clean up old/dangling images
```

### Build Commands

The CI/CD workflow runs these commands on your Raspberry Pi:

```bash
# Build backend image
docker build -t salestracking-backend:latest ./Backend

# Build frontend image
docker build -t salestracking-frontend:latest ./frontend
```

### Image Storage

Images are stored locally on your Raspberry Pi:

```bash
# View stored images
docker images | grep salestracking

# Expected output:
# salestracking-backend   latest   abc123def456   2 minutes ago   250MB
# salestracking-frontend  latest   def456abc123   1 minute ago    50MB
```

## Build Time Considerations

### First Deployment

The first deployment will take longer because:
- Base images need to be downloaded (dotnet:9.0, node:20-alpine, nginx:alpine)
- Dependencies need to be installed
- Application needs to be compiled

**Expected time**: 10-20 minutes

### Subsequent Deployments

Later deployments are much faster because:
- Base images are cached
- Docker layer caching speeds up builds
- Only changed layers are rebuilt

**Expected time**: 2-5 minutes

## Optimizing Build Performance

### Enable BuildKit

BuildKit provides faster builds and better caching:

```bash
# Add to /etc/docker/daemon.json
{
  "features": {
    "buildkit": true
  }
}

# Restart Docker
sudo systemctl restart docker
```

### Increase Swap (if needed)

For Raspberry Pi with limited RAM:

```bash
# Check current swap
free -h

# Increase to 2GB
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Monitor Build Progress

Watch the build in real-time:

```bash
# View runner logs
sudo journalctl -u actions.runner.* -f

# In another terminal, watch Docker
watch -n 1 docker images
```

## Disk Space Management

### Check Available Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df
```

### Clean Up Old Images

The CI/CD workflow automatically cleans up dangling images after deployment:

```bash
docker image prune -f
```

For more aggressive cleanup:

```bash
# Remove all unused images (not just dangling)
docker image prune -a -f

# Remove everything unused (images, containers, volumes, networks)
docker system prune -a --volumes -f
```

### Automated Cleanup

Add to crontab for weekly cleanup:

```bash
crontab -e

# Add this line for Sunday 2 AM cleanup
0 2 * * 0 docker system prune -af --volumes
```

## Troubleshooting

### Build Fails with "No Space Left on Device"

**Solution**: Clean up Docker resources

```bash
# Check space
df -h

# Clean up
docker system prune -a --volumes -f

# If still needed, clean package cache
sudo apt-get clean
sudo apt-get autoclean
```

### Build is Very Slow

**Possible causes**:
1. Limited RAM - increase swap
2. Slow SD card - consider using SSD
3. Network issues downloading base images

**Check resource usage**:
```bash
# During build
htop
docker stats
```

### Build Fails with Memory Error

**Solution**: Increase swap space (see above) or reduce concurrent builds

Edit `~/actions-runner/.runner`:
```json
{
  "maxParallelism": 1
}
```

### Old Images Accumulating

**Solution**: Enable automatic cleanup in workflow (already configured) or set up cron job

## Comparison: Local Build vs Docker Hub

| Aspect | Local Build | Docker Hub |
|--------|-------------|------------|
| Setup | Simpler (no Docker Hub account) | Requires Docker Hub account |
| Secrets | 1 secret (database password) | 3 secrets (+ Docker credentials) |
| Build time | First: 10-20 min, Later: 2-5 min | First: 2-5 min, Later: 1-2 min |
| Deployment time | Faster (no download) | Slower (download images) |
| Disk usage | ~500MB on Pi | ~500MB on Pi + Docker Hub |
| Privacy | Images stay local | Images on Docker Hub |
| Multi-device | Single device | Can deploy to multiple devices |
| Backup | Manual backup needed | Automatic backup on Docker Hub |

## When to Use Docker Hub

Consider using Docker Hub (in addition to local builds) if:

- You want to deploy to multiple Raspberry Pis
- You want automatic image backups
- You need multi-architecture builds (AMD64 + ARM64)
- You want faster first-time deployments

To enable Docker Hub pushing, uncomment the `build-and-push` job in `.github/workflows/ci-cd.yml` and add Docker Hub secrets.

## Manual Local Build

To build images manually on your Raspberry Pi:

```bash
cd /path/to/SalesTrackingApp

# Build backend
docker build -t salestracking-backend:latest ./Backend

# Build frontend
docker build -t salestracking-frontend:latest ./frontend

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Monitoring Builds

### View Build Logs

```bash
# Runner logs
sudo journalctl -u actions.runner.* -f

# Docker build logs (during build)
docker ps -a
docker logs <container-id>
```

### Check Image Details

```bash
# List images with details
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Inspect image
docker inspect salestracking-backend:latest

# View image history
docker history salestracking-backend:latest
```

## Summary

Building Docker images locally on your Raspberry Pi:
- ✅ Simplifies setup (no Docker Hub needed)
- ✅ Reduces secrets to just 1
- ✅ Provides complete control
- ✅ Keeps images private
- ⚠️ First build takes longer
- ⚠️ Requires adequate disk space
- ⚠️ Limited to single device deployment

This approach is ideal for single Raspberry Pi deployments where simplicity and privacy are priorities.
