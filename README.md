# TaskFlow — Full-Stack Project Management App

A production-ready project management tool inspired by Trello and Asana, built with React, Node.js, Prisma, and PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Recharts |
| Validation | React Hook Form + Zod (frontend & backend) |
| Backend | Node.js + Express.js (REST API) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (httpOnly cookie + Bearer header) |
| Icons | Lucide React |

---

## Features

### Authentication
- Signup / Login with JWT (stored in httpOnly cookie + localStorage)
- Auto-refresh on page load, persistent sessions across tabs
- Profile update (name, email) and password change

### Project Management
- Create projects — creator is automatically set as Admin
- Admins can edit the project, add/remove members, promote/demote roles
- Members see only projects they belong to

### Task Management (Kanban + List view)
- Create tasks with: Title, Description, Due Date, Priority, Status, Assignee
- **Kanban board** with To Do / In Progress / Done columns
- **List view** grouped by status
- Filter by Status and Priority simultaneously
- Inline status update via dropdown (no page refresh)
- Overdue task highlighting + "Due soon" warnings

### Dashboard
- Stat cards: Total Projects, Tasks, Overdue, My Tasks
- Donut chart for tasks by status
- Bar chart for tasks by priority
- Project progress bars with % completion
- Tasks-per-member leaderboard
- Recent activity feed

### Role-Based Access Control (per-project)

| Action | Admin | Member |
|---|---|---|
| Create / Edit / Delete tasks | ✅ | ❌ |
| Update task status | ✅ | Own tasks only |
| Add / Remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Edit / Delete project | ✅ | ❌ |
| View project & tasks | ✅ | ✅ |

---

## Project Structure

```
project-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # DB schema (User, Project, ProjectMember, Task)
│   │   └── seed.js                # Sample data seeder
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT verification
│   │   │   └── role.middleware.js  # Per-project RBAC
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── task.routes.js
│   │   │   └── dashboard.routes.js
│   │   └── validators/             # Zod schemas
│   │       ├── auth.validator.js
│   │       ├── project.validator.js
│   │       └── task.validator.js
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/             # Sidebar, Header, AppLayout
        │   └── ui/                 # Toast, Modal, Button, Badge, Avatar
        ├── context/
        │   └── AuthContext.jsx     # Global auth state
        ├── lib/
        │   ├── api.js              # Axios client + typed API methods
        │   └── utils.js            # Helpers, color maps, date formatters
        └── pages/
            ├── LoginPage.jsx
            ├── SignupPage.jsx
            ├── DashboardPage.jsx
            ├── ProjectsPage.jsx
            ├── ProjectDetailPage.jsx
            ├── MyTasksPage.jsx
            └── ProfilePage.jsx
```

---

## Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** (or yarn)

---

### 1. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### 2. Create the Database

```sql
-- In psql or any PostgreSQL client
CREATE DATABASE project_manager_db;
```

---

### 3. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/project_manager_db"
JWT_SECRET="your-random-secret-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

---

### 4. Migrate & Seed Database

```bash
cd backend

# Create all tables
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with sample users, projects, and tasks
npm run db:seed
```

---

### 5. Start the Servers

```bash
# Terminal 1 — Backend API (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Visit **http://localhost:5173** 🎉

---

## Test Accounts (after seeding)

| Email | Password | Role |
|---|---|---|
| alice@example.com | password123 | Admin on "Website Redesign" |
| bob@example.com | password123 | Admin on "Mobile App v2" |
| carol@example.com | password123 | Member on both projects |

---

## API Reference

### Auth Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/signup` | Register new user | — |
| POST | `/api/auth/login` | Login, returns JWT | — |
| POST | `/api/auth/logout` | Clear session | ✅ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| PUT | `/api/auth/profile` | Update name/email | ✅ |
| PUT | `/api/auth/password` | Change password | ✅ |

### Project Endpoints

| Method | Path | Role Required |
|---|---|---|
| GET | `/api/projects` | Any authenticated |
| POST | `/api/projects` | Any authenticated |
| GET | `/api/projects/:id` | Member |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin |
| POST | `/api/projects/:id/members` | Admin |
| PUT | `/api/projects/:id/members/:mid` | Admin |
| DELETE | `/api/projects/:id/members/:mid` | Admin |
| POST | `/api/projects/:id/leave` | Member |

### Task Endpoints

| Method | Path | Role Required |
|---|---|---|
| GET | `/api/tasks?projectId=` | Member |
| GET | `/api/tasks/my` | Any authenticated |
| GET | `/api/tasks/:id` | Member |
| POST | `/api/tasks` | Admin |
| PUT | `/api/tasks/:id` | Admin (full) / Member (status only) |
| DELETE | `/api/tasks/:id` | Admin |

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Aggregated stats for the logged-in user |

---

## Database Schema

```
User ─────────┐
              │ 1:N
              ▼
        ProjectMember ─── Project
         (role: ADMIN        │
               MEMBER)       │ 1:N
                             ▼
                           Task
                     (assignee → User)
                     (creator  → User)
```

### Enums
- **Role**: `ADMIN` | `MEMBER`
- **TaskStatus**: `TODO` | `IN_PROGRESS` | `DONE`
- **TaskPriority**: `LOW` | `MEDIUM` | `HIGH` | `URGENT`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (32+ chars) |
| `JWT_EXPIRES_IN` | — | Token expiry (default: `7d`) |
| `PORT` | — | API server port (default: `5000`) |
| `CLIENT_URL` | — | Frontend URL for CORS (default: `http://localhost:5173`) |
| `NODE_ENV` | — | `development` or `production` |

---

## Production Deployment

### 1. Database (e.g., Neon / Supabase / AWS RDS)
- Provision a PostgreSQL database.
- Obtain the connection string and set it as `DATABASE_URL` in your backend environment.

### 2. Backend Deployment (e.g., Render / Heroku / Railway)
- Connect your repository to the hosting provider.
- Set the Root Directory to `backend` (if supported) or use custom start commands.
- Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start Command: `npm run start`
- Environment Variables required:
  - `DATABASE_URL` (your production DB URL)
  - `JWT_SECRET` (a strong, 32+ character random string)
  - `JWT_EXPIRES_IN` (e.g., `7d`)
  - `PORT` (usually set automatically by the provider, otherwise `5000`)
  - `CLIENT_URL` (the URL where your frontend will be hosted, e.g., `https://my-taskflow.vercel.app`)
  - `NODE_ENV=production`

### 3. Frontend Deployment (e.g., Vercel / Netlify)
- Connect your repository to Vercel/Netlify.
- Set the Framework Preset to **Vite**.
- Set the Root Directory to `frontend`.
- Build Command: `npm run build`
- Output Directory: `dist`
- Add an environment variable (or Vite proxy configuration) so your frontend knows where the backend is hosted. E.g., `VITE_API_URL=https://your-backend-url.onrender.com/api` (You may need to update your `api.js` base URL to use `import.meta.env.VITE_API_URL || "/api"` if you deploy them separately).

## Scripts Reference

### Backend

```bash
npm run dev          # Start with nodemon (hot reload)
npm run start        # Start production server
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio (DB GUI)
```

### Frontend

```bash
npm run dev     # Vite dev server with HMR
npm run build   # Production build → dist/
npm run preview # Preview production build locally
```

---

## License

MIT
