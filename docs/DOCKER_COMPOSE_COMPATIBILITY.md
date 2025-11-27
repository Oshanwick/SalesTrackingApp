# Docker Compose Command Compatibility

## Issue

Modern Docker installations use `docker compose` (with a space) as a Docker CLI plugin, while older installations use `docker-compose` (with a hyphen) as a standalone command.

## Solution

All scripts and workflows in this project use `docker compose` (modern syntax).

### If you have the older docker-compose

If your system only has `docker-compose` (standalone), you have two options:

**Option 1: Install Docker Compose V2 (Recommended)**
```bash
# On Raspberry Pi / Debian / Ubuntu
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify
docker compose version
```

**Option 2: Create an alias**
```bash
# Add to ~/.bashrc or ~/.zshrc
alias docker='function _docker() { if [ "$1" = "compose" ]; then shift; docker-compose "$@"; else command docker "$@"; fi }; _docker'

# Reload shell
source ~/.bashrc
```

**Option 3: Use standalone docker-compose**

If you prefer to keep using `docker-compose`, you'll need to update:
- `.github/workflows/ci-cd.yml` - Replace `docker compose` with `docker-compose`
- `deploy.sh` - Replace `docker compose` with `docker-compose`
- Any manual commands you run

## Checking Your Version

```bash
# Check if you have Docker Compose V2 (plugin)
docker compose version

# Check if you have standalone docker-compose
docker-compose --version
```

## Recommendation

Use `docker compose` (V2) as it's the modern standard and is included with recent Docker installations.
