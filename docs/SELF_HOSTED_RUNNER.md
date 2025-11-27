# GitHub Actions Self-Hosted Runner Setup for Raspberry Pi

- Raspberry Pi connected to internet
- At least 1GB free RAM

## Installation Steps

### 1. Prepare Raspberry Pi

Ensure Docker is installed:
```bash
# Run the setup script if you haven't already
sudo ./setup-pi.sh

# Verify Docker is running
docker --version
docker-compose --version
```

### 2. Create Runner Directory

```bash
# Create directory for the runner
mkdir -p ~/actions-runner
cd ~/actions-runner
```

### 3. Download GitHub Actions Runner

Get the latest runner for ARM64:

```bash
# Download the latest runner package for ARM64
curl -o actions-runner-linux-arm64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-arm64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-arm64.tar.gz
```

> **Note**: Check https://github.com/actions/runner/releases for the latest version

### 4. Configure the Runner

#### Get Registration Token

1. Go to your GitHub repository
2. Navigate to **Settings → Actions → Runners**
3. Click **New self-hosted runner**
4. Select **Linux** and **ARM64**
5. Copy the registration token from the configuration command

#### Register the Runner

```bash
# Configure the runner (replace TOKEN with your token)
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN

# When prompted:
# - Enter runner name: raspberrypi (or your preferred name)
# - Enter runner group: Default
# - Enter labels: self-hosted,Linux,ARM64,raspberrypi
# - Enter work folder: _work (default)
```

### 5. Install as a Service

Install the runner as a systemd service to run automatically:

```bash
# Install the service
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

### 6. Verify Runner is Online

1. Go to your GitHub repository
2. Navigate to **Settings → Actions → Runners**
3. You should see your runner listed with a green "Idle" status

## Configure GitHub Secrets

With self-hosted runner building images locally, you need minimal secrets:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `POSTGRES_PASSWORD` | Production database password | ✅ Yes |
| `DOCKER_USERNAME` | Docker Hub username | ⚠️ Optional* |
| `DOCKER_PASSWORD` | Docker Hub password/token | ⚠️ Optional* |
| ~~`RASPBERRY_PI_HOST`~~ | Not needed with self-hosted | ❌ No |
| ~~`RASPBERRY_PI_USER`~~ | Not needed with self-hosted | ❌ No |
| ~~`RASPBERRY_PI_SSH_KEY`~~ | Not needed with self-hosted | ❌ No |

*Docker Hub credentials are optional if you're only building locally. They're only needed if you also want to push images to Docker Hub for backup or multi-architecture builds.

### Add Secrets

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add the three required secrets above

## Deployment Workflow

The updated CI/CD workflow will:

1. **Test** - Run backend and frontend tests on GitHub-hosted runners
2. **Build & Push** (Optional) - Build multi-architecture Docker images on GitHub-hosted runners and push to Docker Hub
3. **Deploy** - Deploy on your Raspberry Pi using the self-hosted runner:
   - Builds Docker images locally on the Pi
   - Stops existing containers
   - Starts new containers
   - Verifies health
   - Cleans up old images

## Testing the Setup

### Trigger a Deployment

```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add .
git commit -m "Test self-hosted runner deployment"
git push origin main
```

### Monitor the Deployment

1. Go to **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Watch the deployment job run on your Raspberry Pi

### Check Logs on Raspberry Pi

```bash
# View runner logs
sudo journalctl -u actions.runner.* -f

# View application logs
cd ~/actions-runner/_work/YOUR_REPO/YOUR_REPO
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

## Managing the Runner

### Start/Stop the Service

```bash
cd ~/actions-runner

# Stop the runner
sudo ./svc.sh stop

# Start the runner
sudo ./svc.sh start

# Restart the runner
sudo ./svc.sh restart

# Check status
sudo ./svc.sh status
```

### View Runner Logs

```bash
# Real-time logs
sudo journalctl -u actions.runner.* -f

# Last 100 lines
sudo journalctl -u actions.runner.* -n 100
```

### Update the Runner

```bash
cd ~/actions-runner

# Stop the service
sudo ./svc.sh stop

# Download latest version
curl -o actions-runner-linux-arm64.tar.gz -L \
  https://github.com/actions/runner/releases/download/vX.XXX.X/actions-runner-linux-arm64-X.XXX.X.tar.gz

# Extract
tar xzf ./actions-runner-linux-arm64.tar.gz

# Start the service
sudo ./svc.sh start
```

### Remove the Runner

```bash
cd ~/actions-runner

# Stop and uninstall the service
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Remove the runner from GitHub
./config.sh remove --token YOUR_REMOVAL_TOKEN

# Clean up
cd ~
rm -rf ~/actions-runner
```

## Troubleshooting

### Runner Shows Offline

**Check service status:**
```bash
sudo ./svc.sh status
```

**Restart the service:**
```bash
sudo ./svc.sh restart
```

**Check logs:**
```bash
sudo journalctl -u actions.runner.* -n 50
```

### Deployment Fails

**Check Docker:**
```bash
docker ps
docker-compose ps
```

**Check disk space:**
```bash
df -h
```

**Check memory:**
```bash
free -h
```

**View deployment logs:**
```bash
cd ~/actions-runner/_work/YOUR_REPO/YOUR_REPO
docker-compose logs
```

### Runner Uses Too Much Resources

**Limit runner concurrency:**

Edit `~/actions-runner/.runner` and add:
```json
{
  "maxParallelism": 1
}
```

**Monitor resources:**
```bash
# CPU and memory usage
htop

# Docker stats
docker stats
```

### Permission Issues

**Ensure runner user has Docker access:**
```bash
sudo usermod -aG docker $USER
```

**Restart the runner service:**
```bash
sudo ./svc.sh restart
```

## Security Best Practices

1. **Keep runner updated**: Regularly update to latest version
2. **Limit repository access**: Only use runner for trusted repositories
3. **Use secrets**: Never hardcode sensitive data
4. **Monitor logs**: Regularly check runner logs for issues
5. **Firewall**: Ensure only necessary ports are open
6. **Dedicated user**: Consider running runner as dedicated user

## Performance Optimization

### Reduce Docker Image Size

The workflow pulls images from Docker Hub. To speed up deployments:

```bash
# Enable Docker BuildKit
echo '{"features":{"buildkit":true}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

### Clean Up Regularly

```bash
# Add to crontab for weekly cleanup
crontab -e

# Add this line:
0 2 * * 0 docker system prune -af --volumes
```

### Increase Swap (if needed)

```bash
# Check current swap
free -h

# Increase swap to 2GB
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## Monitoring

### Set Up Monitoring Script

Create `~/monitor-runner.sh`:

```bash
#!/bin/bash

echo "=== Runner Status ==="
sudo systemctl status actions.runner.* --no-pager

echo -e "\n=== Docker Containers ==="
docker ps

echo -e "\n=== Resource Usage ==="
free -h
df -h /

echo -e "\n=== Recent Logs ==="
sudo journalctl -u actions.runner.* -n 10 --no-pager
```

Make it executable:
```bash
chmod +x ~/monitor-runner.sh
```

Run it:
```bash
~/monitor-runner.sh
```

## Advanced: Multiple Runners

To run multiple jobs in parallel:

```bash
# Create second runner directory
mkdir -p ~/actions-runner-2
cd ~/actions-runner-2

# Download and configure with different name
# Follow same steps as above but use different runner name
```

## Summary

With the self-hosted runner:
- ✅ Simplified deployment (no SSH needed)
- ✅ Faster deployments (direct access)
- ✅ Better resource utilization
- ✅ Easier troubleshooting

Your Raspberry Pi is now a fully automated deployment target! 🚀
