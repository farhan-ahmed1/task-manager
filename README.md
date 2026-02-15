# Task Manager - Cloud-Native Task Management System

A modern, full-stack task management application built with Node.js, Express, React, and PostgreSQL. Designed for production deployment with Docker, comprehensive testing, and professional-grade architecture.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.5.2-blue)
![CI](https://github.com/YOUR_USERNAME/task-manager/workflows/CI/badge.svg)
![Security](https://github.com/YOUR_USERNAME/task-manager/workflows/Security%20Scanning/badge.svg)
![Docker](https://github.com/YOUR_USERNAME/task-manager/workflows/Docker%20Build%20%26%20Push/badge.svg)

## Features

### Core Functionality
- **User Authentication** - JWT-based secure authentication with password hashing
- **Task Management** - Create, update, delete, and organize tasks
- **Project Organization** - Group tasks into projects with statistics
- **Project Sharing** - Invite team members and collaborate on projects
- **Sections/Lists** - Organize tasks within projects using sections
- **Smart Filters** - Filter by status, priority, date, and project
- **Responsive Design** - Mobile-first UI with modern design principles

### Technical Highlights
- **Containerized** - Docker and Docker Compose ready
- **Security** - Helmet, CORS, rate limiting, input validation
- **Monitoring** - Winston logging with request tracking
- **Database Resilience** - Connection retry with exponential backoff, migration tracking
- **Tested** - Comprehensive unit and integration tests (285 tests) + load testing
- **API Documentation** - Swagger/OpenAPI documentation
- **Performance** - Connection pooling, caching, optimized queries, load tested
- **CI/CD** - GitHub Actions with automated testing, security scanning, and Docker builds

## Architecture

```
task-manager/
├── src/                    # Backend source code
│   ├── routes/            # Express route handlers
│   ├── middleware/        # Auth, logging, validation
│   ├── db/               # Database pool and queries
│   ├── validation/       # Zod schemas
│   └── utils/            # Error classes, utilities
├── frontend/              # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages
│       ├── services/     # API service layer
│       ├── context/      # React context (Auth)
│       └── hooks/        # Custom React hooks
├── migrations/           # Database migrations
├── tests/               # Backend tests
└── docker-compose.yml   # Local development stack
```

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd task-manager
npm run install:all  # Installs backend + frontend dependencies
```

### 2. Environment Setup

**Backend:**
```bash
cp .env.example .env
# Edit .env and set:
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - POSTGRES credentials
# - CORS_ORIGIN (your frontend URL)
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edit .env and set:
# - VITE_API_URL (your backend URL)
```

### 3. Database Setup

```bash
# Start PostgreSQL with Docker
npm run db:docker

# Run migrations
npm run db:migrate

# Seed development data (optional)
npm run db:seed
```

### 4. Run Development Servers

```bash
# Terminal 1: Start backend (port 3000)
npm run dev:backend

# Terminal 2: Start frontend (port 5173)
npm run dev:frontend

# Or run both concurrently:
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

## Docker Deployment

### Development with Docker Compose

```bash
docker-compose up -d
```

### Production Build

**Backend:**
```bash
docker build -t task-manager-backend .
docker run -p 3000:3000 \
  -e DATABASE_URL=<your-db-url> \
  -e JWT_SECRET=<your-secret> \
  task-manager-backend
```

**Frontend:**
```bash
cd frontend
docker build --build-arg VITE_API_URL=https://api.yourdomain.com -t task-manager-frontend .
docker run -p 80:80 task-manager-frontend
```

## Testing

```bash
# Backend tests
npm test                # Run all tests
npm run test:coverage   # With coverage report
npm run test:watch      # Watch mode

# Frontend tests
cd frontend
npm test

# All tests
npm run test:all
```

## Available Scripts

### Backend
- `npm run dev:backend` - Start development server with hot reload
- `npm run build:backend` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking

### Frontend
- `npm run dev:frontend` - Start Vite dev server
- `npm run build:frontend` - Production build
- `npm run preview` - Preview production build

### Database
- `npm run db:docker` - Start PostgreSQL container
- `npm run db:migrate` - Run database migrations (with tracking)
- `npm run db:migrate:status` - Check which migrations have been applied
- `npm run db:seed` - Seed development data
- `npm run db:reset` - Reset database (drop, create, migrate, seed)

**Migration System Features:**
- ✅ Automatic tracking of applied migrations
- ✅ Prevents duplicate migration execution
- ✅ Detects modifications to applied migrations
- ✅ Shows execution time and history
- 📚 See [docs/MIGRATIONS.md](docs/MIGRATIONS.md) for details

### Load Testing
- `npm run perf:validate` - Validate load testing environment
- `npm run perf:test:smoke` - Quick smoke test (30s, single user)
- `npm run perf:test` - Full load test (validated environment)
- `npm run perf:test:report` - Generate HTML report

**Load Testing Features:**
- ✅ Environment-based configuration (local/staging/production)
- ✅ Automated validation before testing
- ✅ Smoke tests for quick validation
- ✅ Full load tests with multiple scenarios
- ✅ Performance thresholds and SLA monitoring
- ✅ HTML reports with detailed metrics

## CI/CD Pipeline

This project includes a complete CI/CD pipeline using GitHub Actions:

### Automated Workflows

**Continuous Integration** (`.github/workflows/ci.yml`)
- ✅ Backend tests with PostgreSQL
- ✅ Frontend tests and builds
- ✅ Code linting and type checking
- ✅ Test coverage reporting
- Runs on: Push and Pull Requests to main/develop

**Security Scanning** (`.github/workflows/security.yml`)
- 🔒 npm audit for vulnerabilities
- 🔒 Secret scanning with TruffleHog
- 🔒 CodeQL security analysis
- 🔒 Dockerfile linting
- Runs on: Push, PR, and daily at 2 AM UTC

**Docker Build & Push** (`.github/workflows/docker.yml`)
- 🐳 Multi-platform builds (amd64, arm64)
- 🐳 Automatic versioning and tagging
- 🐳 GitHub Container Registry publishing
- 🐳 Image testing on PRs
- Runs on: Push to main and version tags

### Using Docker Images

Pull the latest images from GitHub Container Registry:

```bash
# Backend
docker pull ghcr.io/YOUR_USERNAME/task-manager-backend:latest

# Frontend
docker pull ghcr.io/YOUR_USERNAME/task-manager-frontend:latest

# Run containers
docker run -d -p 3000:3000 \
  -e DATABASE_URL=your_db_url \
  -e JWT_SECRET=your_secret \
  ghcr.io/YOUR_USERNAME/task-manager-backend:latest

docker run -d -p 80:80 \
  ghcr.io/YOUR_USERNAME/task-manager-frontend:latest
```

📚 **Full Documentation:** [docs/CI_CD.md](docs/CI_CD.md)

## API Endpoints

### Authentication

- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login and get JWT token
- `POST /auth/logout` - Logout (client-side token deletion)
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password

### Tasks

- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Projects

- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/stats` - Get project statistics
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/invite` - Invite user to project
- `POST /api/projects/accept-invitation/:token` - Accept invitation
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Sections

- `GET /api/sections` - List sections
- `GET /api/sections/:id` - Get section
- `POST /api/sections` - Create section
- `PUT /api/sections/:id` - Update section
- `DELETE /api/sections/:id` - Delete section

### System

- `GET /health` - Health check with service status
- `GET /metrics` - Application metrics (dev only)

## Security

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs with salt rounds
- **Helmet** - Security headers (CSP, HSTS, etc.)
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Request throttling per IP
- **Input Validation** - Zod schemas for all inputs
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Output sanitization

## Database Schema

### Core Tables
- `users` - User accounts with authentication
- `projects` - Project containers for tasks
- `tasks` - Individual task items
- `sections` - Task organization within projects
- `project_members` - Project collaboration
- `project_invitations` - Invitation management
- `task_assignments` - Task-to-user assignments

See [docs/db-schema.md](docs/db-schema.md) for detailed schema documentation.

## Performance

- **Connection Pooling** - PostgreSQL connection pool (max 10)
- **Query Optimization** - Indexed queries for fast lookups
- **Response Caching** - Client-side caching with TTL
- **Compression** - gzip compression for responses
- **Code Splitting** - Lazy loaded React routes (planned)

## Load Testing

The application includes comprehensive load testing with Artillery to validate performance and reliability.

### Quick Start

```bash
# 1. Validate your environment is ready
npm run perf:validate

# 2. Set up the test user (run once)
npm run perf:setup

# 3. Run a quick smoke test (30 seconds)
npm run perf:test:smoke

# 4. Run full load test
npm run perf:test

# 5. Generate HTML report
npm run perf:test:report
```

### Test Scenarios

**Smoke Test** (`performance/smoke-test.yml`)
- Duration: 30 seconds
- Load: 1 user
- Purpose: Quick validation that all endpoints work
- Use: After deployments, before full testing

**Full Load Test** (`performance/load-test.yml`)
- Phases:
  - Warm-up: 60s @ 1 req/s
  - Ramp-up: 120s, 1→10 req/s
  - Sustained: 180s @ 10 req/s
  - Spike: 60s @ 20 req/s
- Scenarios:
  - Health checks (10% weight)
  - User registration/login (20% weight)
  - Task operations (40% weight)
  - Project operations (30% weight)

### Performance Thresholds

```yaml
P95 Response Time: < 500ms    # 95% of requests
P99 Response Time: < 1000ms   # 99% of requests
Max Response Time: < 2000ms   # No request should exceed this
Request Rate: > 100 req/s     # Minimum throughput
```

### Environment Configuration

Set the target URL for different environments:

```bash
# Local testing (default)
TEST_TARGET_URL=http://localhost:3000 npm run perf:test

# Staging
TEST_TARGET_URL=https://staging-api.example.com npm run perf:test

# Production (use with caution!)
TEST_TARGET_URL=https://api.example.com npm run perf:test
```

### Test Data

Load tests use CSV data (`performance/test-data.csv`) for realistic scenarios:
- 10 test users with credentials
- Unique task titles
- Diverse project names

### Validation Checks

The `perf:validate` script ensures:
- ✅ Artillery is installed
- ✅ Test data file is valid
- ✅ Target server is healthy and responding
- ✅ Database is connected

### Interpreting Results

Artillery provides real-time metrics:

```
Summary report @ 14:23:45(+0000)
  Scenarios launched:  1000
  Scenarios completed: 1000
  Requests completed:  8000
  Mean response/sec:   66.67
  Response time (msec):
    min: 12
    max: 234
    median: 45
    p95: 89
    p99: 156
```

**What to look for:**
- ✅ All scenarios complete successfully
- ✅ P95 response time < 500ms
- ✅ No timeout errors
- ⚠️ Error rate < 1%
- ❌ Any 5xx errors indicate server issues

### Troubleshooting

**Target not responding:**
```bash
# Make sure the app is running
npm run dev:backend

# Check health endpoint
curl http://localhost:3000/health
```

**Test data errors:**
- Verify `performance/test-data.csv` exists
- Check CSV format (headers: email, password, taskTitle, projectName)

**Artillery not found:**
```bash
npm install
```

**Database connection errors:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations: `npm run db:migrate`

## Roadmap

### In Progress
- [ ] Project editing/deletion UI (TODOs in IndividualProjectPage)
- [ ] E2E tests with Cypress
- [ ] CI/CD pipeline with GitHub Actions

### Planned
- [ ] Real-time updates with WebSockets
- [ ] File attachments for tasks
- [ ] Recurring tasks
- [ ] Task dependencies
- [ ] Email notifications
- [ ] Mobile app (React Native)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Developer

Built as a learning project to demonstrate:
- Modern full-stack development
- Cloud-native architecture
- Professional DevOps practices
- Production-ready code quality

## Support

For questions:
- Check documentation in `/docs`
- Review API documentation at `/api-docs`

## Acknowledgments

- Express.js community
- React and Vite teams
- PostgreSQL documentation

---

**Test Credentials (Development)**
- Email: admin@taskmanager.com
- Password: Password55

WARNING: Do not use these credentials in production!
