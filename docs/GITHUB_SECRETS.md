# GitHub Secrets Configuration

To enable the CI/CD pipeline, configure the following secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

> **Note**: If using a self-hosted runner on your Raspberry Pi, you only need 3 secrets (Docker Hub credentials + database password). See [Self-Hosted Runner Guide](./SELF_HOSTED_RUNNER.md) for details.

## Required Secrets

### For Self-Hosted Runner (Recommended)

If you're using a self-hosted runner on your Raspberry Pi, you only need these 3 secrets:

#### DOCKER_USERNAME
- **Description**: Your Docker Hub username
- **Example**: `johndoe`
- **How to get**: Your Docker Hub account username

#### DOCKER_PASSWORD
- **Description**: Docker Hub password or access token (recommended)
- **Example**: `dckr_pat_xxxxxxxxxxxxx`
- **How to get**: 
  1. Go to https://hub.docker.com/settings/security
  2. Click "New Access Token"
  3. Give it a name (e.g., "GitHub Actions")
  4. Copy the token

#### POSTGRES_PASSWORD
- **Description**: Production PostgreSQL password
- **Example**: `MySecureP@ssw0rd123!`
- **Recommendation**: Use a strong, randomly generated password
- **Generate random password**:
  ```bash
  openssl rand -base64 32
  ```

---

### For SSH-Based Deployment (Alternative)

If you're using SSH-based deployment instead of self-hosted runner, you need all of the above plus:

#### DOCKER_USERNAME
- **Description**: Your Docker Hub username
- **Example**: `johndoe`
- **How to get**: Your Docker Hub account username

#### DOCKER_PASSWORD
- **Description**: Docker Hub password or access token (recommended)
- **Example**: `dckr_pat_xxxxxxxxxxxxx`
- **How to get**: 
  1. Go to https://hub.docker.com/settings/security
  2. Click "New Access Token"
  3. Give it a name (e.g., "GitHub Actions")
  4. Copy the token

### Raspberry Pi Access

#### RASPBERRY_PI_HOST
- **Description**: IP address or hostname of your Raspberry Pi
- **Example**: `192.168.1.100` or `raspberrypi.local`
- **How to get**: Run `hostname -I` on your Raspberry Pi

#### RASPBERRY_PI_USER
- **Description**: SSH username for Raspberry Pi
- **Example**: `pi`
- **Default**: Usually `pi` for Raspberry Pi OS

#### RASPBERRY_PI_SSH_KEY
- **Description**: Private SSH key for authentication
- **Example**: 
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```
- **How to generate**:
  ```bash
  # On your development machine
  ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key
  
  # Copy public key to Raspberry Pi
  ssh-copy-id -i ~/.ssh/github_actions_key.pub pi@YOUR_PI_IP
  
  # Display private key to copy
  cat ~/.ssh/github_actions_key
  ```
  Copy the **entire output** including the BEGIN and END lines.

### Database

#### POSTGRES_PASSWORD
- **Description**: Production PostgreSQL password
- **Example**: `MySecureP@ssw0rd123!`
- **Recommendation**: Use a strong, randomly generated password
- **Generate random password**:
  ```bash
  openssl rand -base64 32
  ```

## Verification

After adding all secrets, verify they are set correctly:

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. You should see 6 repository secrets:
   - DOCKER_USERNAME
   - DOCKER_PASSWORD
   - RASPBERRY_PI_HOST
   - RASPBERRY_PI_USER
   - RASPBERRY_PI_SSH_KEY
   - POSTGRES_PASSWORD

## Testing the Pipeline

1. Make a small change to your code
2. Commit and push to a feature branch
3. Create a pull request
4. The CI/CD pipeline will run tests
5. Merge to `main` to trigger deployment

## Security Notes

- **Never commit secrets** to your repository
- **Use access tokens** instead of passwords when possible
- **Rotate secrets regularly** (every 90 days recommended)
- **Limit token permissions** to only what's needed
- **Use environment-specific secrets** for staging vs production
