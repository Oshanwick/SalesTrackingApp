# Frontend-Backend Connectivity Fix

## Issue
After successful deployment, frontend loads but shows error:
```
Failed to load sales data. Make sure the backend is running on port 5000.
```

## Root Cause
The frontend was built with the default API URL `http://localhost:5000/api`, which doesn't work in the Docker container environment. The frontend needs to use the Nginx proxy path `/api` to reach the backend container.

## Solution

### 1. Updated Frontend Dockerfile
Added build argument to configure API URL at build time:

```dockerfile
# Build argument for API URL
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

### 2. Updated docker-compose.prod.yml
Added build args to pass the correct API URL:

```yaml
frontend:
  build:
    args:
      VITE_API_BASE_URL: /api
```

### 3. Updated CI/CD Workflow
Modified frontend build command to include the build argument:

```bash
docker build --build-arg VITE_API_BASE_URL=/api -t salestracking-frontend:latest ./frontend
```

## How It Works

### Architecture Flow
```
Browser → Frontend (Nginx on port 80)
            ↓
         /api/* requests
            ↓
    Nginx proxy_pass to http://backend:5000/api/
            ↓
         Backend Container (port 5000)
            ↓
         PostgreSQL Container
```

### API Configuration
- **Development**: Frontend uses `http://localhost:5000/api` (direct connection)
- **Production (Docker)**: Frontend uses `/api` (relative path, proxied by Nginx)

## Testing the Fix

After pushing the changes, the CI/CD pipeline will:
1. Build frontend with `VITE_API_BASE_URL=/api`
2. Frontend will make API calls to `/api/sales` (relative path)
3. Nginx will proxy these to `http://backend:5000/api/sales`
4. Backend will respond through the proxy

## Verification Steps

1. **Check frontend console** (browser DevTools):
   - Should see requests to `/api/sales` (not `http://localhost:5000/api/sales`)
   - Should get successful responses (200 OK)

2. **Check Nginx logs**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend
   ```

3. **Check backend logs**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend
   ```

4. **Test API directly**:
   ```bash
   # From Raspberry Pi
   curl http://localhost/api/sales
   
   # Should return JSON array of sales
   ```

## Next Deployment

Push the changes to trigger a new deployment:
```bash
git add .
git commit -m "Fix frontend-backend connectivity with correct API URL"
git push origin main
```

The GitHub Actions workflow will:
1. Run tests
2. Build images with correct API URL
3. Deploy to Raspberry Pi
4. Frontend should now connect to backend successfully

## Troubleshooting

### If frontend still can't connect:

**Check Nginx proxy configuration**:
```bash
docker exec salestracking-frontend cat /etc/nginx/conf.d/default.conf
```

Should contain:
```nginx
location /api/ {
    proxy_pass http://backend:5000/api/;
    ...
}
```

**Check backend is accessible from frontend container**:
```bash
docker exec salestracking-frontend wget -O- http://backend:5000/health
```

Should return: `{"status":"healthy","timestamp":"..."}`

**Check network connectivity**:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

All containers should be on the same network: `salestracking-network`

## Related Files
- [frontend/Dockerfile](file:///d:/Antigravity/Antigravity%20project/Envato/SalesTrackingApp/frontend/Dockerfile)
- [docker-compose.prod.yml](file:///d:/Antigravity/Antigravity%20project/Envato/SalesTrackingApp/docker-compose.prod.yml)
- [.github/workflows/ci-cd.yml](file:///d:/Antigravity/Antigravity%20project/Envato/SalesTrackingApp/.github/workflows/ci-cd.yml)
- [frontend/nginx.conf](file:///d:/Antigravity/Antigravity%20project/Envato/SalesTrackingApp/frontend/nginx.conf)
- [frontend/src/services/api.ts](file:///d:/Antigravity/Antigravity%20project/Envato/SalesTrackingApp/frontend/src/services/api.ts)
