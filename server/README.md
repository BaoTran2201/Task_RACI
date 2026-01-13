# RACI Task Management Backend

Backend API for RACI-based task management system built with Node.js, Express, Prisma, and SQLite.

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your `JWT_SECRET`.

3. **Initialize database:**
   ```bash
   npm run migrate
   ```

4. **Import existing data (optional):**
   ```bash
   npm run migrate:data
   ```
   This will import data from your existing JSON files and create a default admin user.

   Default credentials:
   - Username: `admin`
   - Password: `admin123`

## Development

Start the dev server with hot reload:
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user

### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### RACI Assignments
- `GET /api/raci?taskId=&employeeId=` - List RACI assignments
- `POST /api/raci` - Create RACI assignment
- `PUT /api/raci/:id` - Update RACI role
- `DELETE /api/raci/:id` - Delete RACI assignment

All endpoints (except `/api/auth/*`) require JWT Bearer token in Authorization header.

## Database Management

View database in browser:
```bash
npm run db:studio
```

Reset database (warning: deletes all data):
```bash
npm run db:reset
```

## Production

Build and run:
```bash
npm start
```

## Migration to PostgreSQL

To migrate to PostgreSQL later:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```

3. Run migration:
   ```bash
   npm run migrate:deploy
   ```

No code changes needed - Prisma handles the database abstraction.
