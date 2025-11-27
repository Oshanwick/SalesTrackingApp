# Deployment Guide - Raspberry Pi

This guide covers deploying the Sales Tracking App to a Raspberry Pi Linux server using Docker and automated CI/CD.

## Prerequisites

- Raspberry Pi (3B+ or newer recommended) running 64-bit Linux OS
- At least 2GB RAM
- 8GB+ storage available
- SSH access to the Raspberry Pi
- Docker Hub account
- GitHub repository with Actions enabled

## Initial Raspberry Pi Setup

### 1. Run the Setup Script

On your Raspberry Pi, run the initial setup script:

```bash
# Download the setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-pi.sh

# Make it executable
chmod +x setup-pi.sh

# Run as root
sudo ./setup-pi.sh
```

This script will:
- Update system packages
- Install Docker and Docker Compose
- Configure firewall rules
- Create systemd service for auto-start
- Set up application directory at `/opt/salestracking`

### 2. Log Out and Back In

After the setup script completes, log out and back in for Docker group changes to take effect.

## Manual Deployment

### 1. Copy Application Files

Copy the necessary files to your Raspberry Pi:

```bash
# From your development machine
scp -r docker-compose.yml docker-compose.prod.yml deploy.sh .env.example \
  pi@YOUR_PI_IP:/opt/salestracking/
```

### 2. Configure Environment Variables

On the Raspberry Pi:

```bash
cd /opt/salestracking
cp .env.example .env
nano .env
```

Update the following variables:
- `POSTGRES_PASSWORD`: Set a strong password
- `DOCKER_USERNAME`: Your Docker Hub username
- `RASPBERRY_PI_HOST`: Your Pi's IP address (for reference)

### 3. Run Deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

The deployment script will:
- Pull latest Docker images from Docker Hub
- Stop existing containers
- Start new containers
- Verify backend health
- Display running containers

### 4. Verify Deployment

Check that all services are running:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Access the application:
- Frontend: `http://YOUR_PI_IP`
- Backend API: `http://YOUR_PI_IP:5000`
- Health Check: `http://YOUR_PI_IP:5000/health`

## Automated CI/CD Deployment

> **Recommended**: Use GitHub Actions self-hosted runner for simplified deployment. See [Self-Hosted Runner Guide](./SELF_HOSTED_RUNNER.md) for setup instructions.

### Option 1: Self-Hosted Runner (Recommended)

This approach runs the deployment directly on your Raspberry Pi without SSH configuration. **Docker images are built locally on your Raspberry Pi**, eliminating the need for Docker Hub.

**Setup:**
1. Install GitHub Actions runner on your Raspberry Pi (see [Self-Hosted Runner Guide](./SELF_HOSTED_RUNNER.md))
2. Configure GitHub secret (see below)
3. Push to main branch to deploy

**Required GitHub Secrets:**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `POSTGRES_PASSWORD` | Production database password | `your_secure_password` |

**Optional Secrets** (only if you want to push images to Docker Hub):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `dckr_pat_xxxxx` |

### Option 2: SSH-Based Deployment

Alternative approach using SSH from GitHub Actions to your Raspberry Pi.

**Required GitHub Secrets:**

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `dckr_pat_xxxxx` |
| `RASPBERRY_PI_HOST` | Raspberry Pi IP or hostname | `192.168.1.100` |
| `RASPBERRY_PI_USER` | SSH username | `pi` |
| `RASPBERRY_PI_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----` |
| `POSTGRES_PASSWORD` | Production database password | `your_secure_password` |

### 2. Generate SSH Key for CI/CD

On your development machine:

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Copy public key to Raspberry Pi
ssh-copy-id -i ~/.ssh/github_actions_key.pub pi@YOUR_PI_IP

# Copy private key content for GitHub secret
cat ~/.ssh/github_actions_key
```

Copy the entire private key content (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) to the `RASPBERRY_PI_SSH_KEY` secret.

### 3. Trigger Deployment

The CI/CD pipeline automatically triggers on push to `main` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

The pipeline will:
1. Run backend tests
2. Build frontend
3. Build multi-architecture Docker images (AMD64 + ARM64)
4. Push images to Docker Hub
5. SSH into Raspberry Pi and deploy
6. Verify deployment health

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f postgres
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Stop Services

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Update Application

Simply push changes to the `main` branch, and the CI/CD pipeline will automatically deploy updates.

For manual updates:

```bash
cd /opt/salestracking
./deploy.sh
```

### Backup Database

```bash
# Create backup
docker exec salestracking-postgres pg_dump -U postgres salestracking > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i salestracking-postgres psql -U postgres salestracking < backup_20250127.sql
```

## Troubleshooting

### Backend Not Healthy

Check backend logs:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend
```

Common issues:
- Database connection failed: Check PostgreSQL is running and credentials are correct
- Port already in use: Stop conflicting services or change ports in docker-compose.yml

### Frontend Not Accessible

Check frontend logs:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend
```

Verify nginx configuration:
```bash
docker exec salestracking-frontend cat /etc/nginx/conf.d/default.conf
```

### Database Connection Issues

Check PostgreSQL logs:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs postgres
```

Verify connection:
```bash
docker exec -it salestracking-postgres psql -U postgres -d salestracking
```

### Out of Memory

Raspberry Pi has limited resources. Monitor usage:
```bash
docker stats
```

Adjust resource limits in `docker-compose.prod.yml` if needed.

### CI/CD Pipeline Fails

Check GitHub Actions logs for specific errors:
- Build failures: Check Dockerfile syntax and dependencies
- Push failures: Verify Docker Hub credentials
- Deployment failures: Check SSH connection and Raspberry Pi accessibility

## Performance Optimization

### Enable Docker BuildKit

Add to `/etc/docker/daemon.json`:
```json
{
  "features": {
    "buildkit": true
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

### Limit Log Size

Add to `docker-compose.prod.yml` for each service:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Use Docker System Prune

Regularly clean up unused resources:
```bash
docker system prune -a --volumes
```

## Security Recommendations

1. **Change default passwords**: Update `POSTGRES_PASSWORD` in `.env`
2. **Use SSH keys**: Disable password authentication for SSH
3. **Enable firewall**: Use `ufw` to restrict access
4. **Keep system updated**: Regularly run `sudo apt update && sudo apt upgrade`
5. **Use HTTPS**: Set up reverse proxy with Let's Encrypt (see Advanced section)
6. **Restrict Docker Hub**: Use private repositories for production images

## Advanced: HTTPS with Let's Encrypt

For production deployments, set up HTTPS using Nginx reverse proxy and Let's Encrypt. This requires a domain name pointing to your Raspberry Pi.

See the [Advanced Deployment Guide](./ADVANCED_DEPLOYMENT.md) for details.
