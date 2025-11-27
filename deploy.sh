#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Sales Tracking App - Raspberry Pi Deployment ===${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Load environment variables
source .env

# Pull latest images from Docker Hub
echo -e "${YELLOW}Pulling latest images from Docker Hub...${NC}"
docker pull ${DOCKER_USERNAME}/salestracking-backend:latest || echo "Backend image not found, will build locally"
docker pull ${DOCKER_USERNAME}/salestracking-frontend:latest || echo "Frontend image not found, will build locally"

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down || true

# Start new containers
echo -e "${YELLOW}Starting new containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for backend to be healthy
echo -e "${YELLOW}Waiting for backend to be healthy...${NC}"
RETRIES=30
COUNT=0
while [ $COUNT -lt $RETRIES ]; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is healthy!${NC}"
        break
    fi
    COUNT=$((COUNT+1))
    echo "Waiting... ($COUNT/$RETRIES)"
    sleep 2
done

if [ $COUNT -eq $RETRIES ]; then
    echo -e "${RED}Backend failed to become healthy. Rolling back...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    exit 1
fi

# Check frontend
echo -e "${YELLOW}Checking frontend...${NC}"
if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}Frontend is accessible!${NC}"
else
    echo -e "${RED}Warning: Frontend may not be accessible${NC}"
fi

# Show running containers
echo -e "${YELLOW}Running containers:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "Application is running at:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:5000"
echo "  Health Check: http://localhost:5000/health"
echo ""
echo "To view logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "To stop: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
