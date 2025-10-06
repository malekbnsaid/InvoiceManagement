# Docker Setup for Invoice Management System

Simple Docker setup for development with backend API, SQL Server database, and optional frontend.

## 🚀 Quick Start (Recommended for Development)

### Backend + Database Only (Most Common)
```bash
# Start backend and database
docker compose up --build -d sqlserver adminer backend

# Run frontend locally (your preferred way)
cd invoicemanagement.client
npm install
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173 (local)
- Backend API: http://localhost:5000
- Database UI: http://localhost:8080

### Full Stack in Docker (Alternative)
```bash
# Everything in Docker
docker compose --profile dev up --build -d
```

**Access Points:**
- Frontend: http://localhost:5173 (Docker)
- Backend API: http://localhost:5000
- Database UI: http://localhost:8080

## 🗄️ Database Connection (Adminer UI)

**Access:** http://localhost:8080

| Field | Value |
|-------|-------|
| System | MS SQL |
| Server | sqlserver |
| Username | sa |
| Password | YourStrong@Passw0rd123 |
| Database | InvoiceManagementDb |

## 📋 Common Commands

```bash
# Start backend + database (recommended)
docker compose up --build -d sqlserver adminer backend

# Start everything in Docker
docker compose --profile dev up --build -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Restart specific service
docker compose restart backend

# View running containers
docker compose ps
```

## 🔄 Development Workflow

### When You Change Backend Code:
```bash
# Rebuild and restart backend only
docker compose up --build -d backend
```

### When You Change Frontend Code:
```bash
# If running frontend locally (recommended)
# No command needed - Vite hot reload handles it automatically!

# If running frontend in Docker
docker compose up --build -d frontend-dev
```

### When You Change Database/Config:
```bash
# Rebuild everything
docker compose up --build -d sqlserver adminer backend
```

## 🔧 Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| API Swagger | 5000 | http://localhost:5000/swagger |
| Database | 1433 | localhost:1433 |
| Database UI | 8080 | http://localhost:8080 |
| Frontend | 5173 | http://localhost:5173 |

## 🔄 Port Configuration

The application automatically detects the environment and uses the correct API port:

- **Docker Environment**: API calls go to `http://localhost:5000/api`
- **Local Development**: API calls go to `http://localhost:5274/api` (if running backend locally)

The frontend will automatically use the correct port based on how you're running the backend.

## 📁 Key Files

```
├── docker-compose.yml              # Main orchestration
├── InvoiceManagement.Server/
│   ├── Dockerfile                 # Backend container
│   └── appsettings.Docker.json    # Docker config
└── invoicemanagement.client/
    ├── Dockerfile                 # Frontend container
    └── vite.config.docker.ts      # Docker Vite config
```

## 🐛 Quick Troubleshooting

### Backend Not Working?
```bash
# Check logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Database Issues?
```bash
# Check database logs
docker compose logs sqlserver

# Test connection
docker compose exec sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd123" -Q "SELECT @@VERSION"
```

### Reset Everything
```bash
# Stop and clean
docker compose down -v

# Start fresh
docker compose up --build -d sqlserver adminer backend
```

## 💡 Development Tips

- **Recommended:** Backend + Database in Docker, Frontend locally
- **Database UI:** Use Adminer at http://localhost:8080 for easy database management
- **API Testing:** Use Swagger at http://localhost:5000/swagger
- **Hot Reload:** Frontend runs locally for instant updates
- **Data Persistence:** Database data survives container restarts

## 🔐 Environment Configuration

The Docker setup uses the following environment variables:

### Backend (.NET)
- `ASPNETCORE_ENVIRONMENT=Development`
- `ASPNETCORE_URLS=http://+:5000`
- `ConnectionStrings__DefaultConnection` (automatically set for Docker)

### Database (SQL Server)
- `ACCEPT_EULA=Y`
- `SA_PASSWORD=YourStrong@Passw0rd123`
- `MSSQL_PID=Express`

## 🚀 Production Deployment

For production deployment, use the production profile:

```bash
# Build and run production containers
docker compose --profile prod up --build -d
```

This will use:
- Nginx for frontend serving
- Optimized production builds
- Production-ready configurations

## 📝 Notes

- The `Documents` folder is mounted as a volume for file uploads
- Database data persists in a Docker volume named `sqlserver_data`
- All services are connected via a custom Docker network `invoice-network`
- CORS is configured to allow frontend access from localhost:5173
