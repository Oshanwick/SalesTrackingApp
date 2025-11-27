# Sales Tracking App

A full-stack web application for tracking sales data, built with .NET 9 and React, containerized with Docker for easy deployment.

## Features

- 📊 **Sales Dashboard**: View and manage all sales in a clean, modern interface
- ➕ **Add/Edit Sales**: Easy-to-use forms for managing sales records
- 📁 **CSV Import**: Bulk import sales data from CSV files
- 🔍 **Search & Filter**: Quickly find sales records
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🐳 **Docker Ready**: Fully containerized for easy deployment
- 🚀 **CI/CD Pipeline**: Automated testing and deployment to Raspberry Pi

## Tech Stack

### Backend
- **.NET 9** - Web API framework
- **Entity Framework Core** - ORM for database operations
- **PostgreSQL** - Relational database
- **Swagger** - API documentation

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline
- **Nginx** - Web server for frontend

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- (For development) .NET 9 SDK and Node.js 20+

### Run with Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SalesTrackingApp.git
   cd SalesTrackingApp
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env and set your passwords
   ```

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/swagger

### Development Setup

#### Backend

```bash
cd Backend
dotnet restore
dotnet run
```

Backend will run on http://localhost:5000

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

## Deployment

### Raspberry Pi Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions on deploying to Raspberry Pi.

Quick deployment:

1. Run setup script on Raspberry Pi:
   ```bash
   sudo ./setup-pi.sh
   ```

2. Configure environment variables and deploy:
   ```bash
   cd /opt/salestracking
   cp .env.example .env
   # Edit .env
   ./deploy.sh
   ```

### CI/CD Pipeline

The project includes a GitHub Actions workflow that automatically:
- Runs tests on push/PR
- Builds Docker images locally on Raspberry Pi (ARM64)
- Deploys to Raspberry Pi using self-hosted runner
- No Docker Hub required (images built and stored locally)

**Quick Setup:**
1. Install self-hosted runner on Raspberry Pi ([guide](./docs/SELF_HOSTED_RUNNER.md))
2. Configure 1 GitHub secret (database password)
3. Push to main branch to deploy automatically

## Documentation

- [Self-Hosted Runner Guide](./docs/SELF_HOSTED_RUNNER.md) - **Start here** for Raspberry Pi deployment
- [Deployment Guide](./docs/DEPLOYMENT.md) - Comprehensive deployment instructions
- [Docker Guide](./docs/DOCKER.md) - Docker-specific operations and troubleshooting

## Project Structure

```
SalesTrackingApp/
├── Backend/                    # .NET 9 Web API
│   ├── Controllers/           # API controllers
│   ├── Data/                  # Database context
│   ├── Models/                # Data models
│   ├── Migrations/            # EF Core migrations
│   ├── Dockerfile             # Backend Docker image
│   └── Program.cs             # Application entry point
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   └── types/             # TypeScript types
│   ├── Dockerfile             # Frontend Docker image
│   └── nginx.conf             # Nginx configuration
├── docs/                       # Documentation
├── .github/workflows/          # CI/CD workflows
├── docker-compose.yml          # Development compose file
├── docker-compose.prod.yml     # Production overrides
├── deploy.sh                   # Deployment script
├── setup-pi.sh                 # Raspberry Pi setup script
└── .env.example                # Environment variables template
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | Get all sales |
| GET | `/api/sales/{id}` | Get sale by ID |
| POST | `/api/sales` | Create new sale |
| PUT | `/api/sales/{id}` | Update sale |
| DELETE | `/api/sales/{id}` | Delete sale |
| DELETE | `/api/sales/all` | Delete all sales |
| POST | `/api/sales/bulk` | Bulk import sales |
| GET | `/health` | Health check |

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `POSTGRES_PASSWORD` - Database password
- `DOCKER_USERNAME` - Docker Hub username (for CI/CD)
- `VITE_API_BASE_URL` - Frontend API URL (build-time)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [Deployment Guide](./docs/DEPLOYMENT.md#troubleshooting) for common problems
- Review [Docker Guide](./docs/DOCKER.md#troubleshooting) for Docker-specific issues

## Acknowledgments

- Built with modern web technologies
- Optimized for Raspberry Pi deployment
- Designed for ease of use and deployment
