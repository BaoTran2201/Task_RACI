# README_DEPLOY

## 1. Overview
CHECK NHÂN SỰ RACI: React (Vite + TypeScript + Tailwind) frontend, ASP.NET Core (.NET 6+) backend (Clean Architecture), PostgreSQL database, JWT auth with Admin/User roles.

## 2. Frontend deploy (Vite)
- Install: Node 18+; `npm install` in repo root.
- Build: `npm run build`.
- Output: `dist/` (static assets to serve behind any static host/CDN).
- Required env: `VITE_API_BASE_URL` (e.g., `http://localhost:5000/api`).

## 3. Backend deploy (ASP.NET Core)
- Restore/build: `dotnet restore` then `dotnet build CheckRaci.sln`.
- Run (dev): `dotnet run --project CheckRaci.Api/CheckRaci.Api.csproj`.
- Publish (prod): `dotnet publish CheckRaci.Api/CheckRaci.Api.csproj -c Release -o out`.
- Default ports: HTTP 5000 (HTTPS 5001 if enabled).
- Required env (override appsettings):
  - `ConnectionStrings__Default` (PostgreSQL connection string).
  - `Jwt__Key` (256-bit secret), `Jwt__Issuer`, `Jwt__Audience`, optional `Jwt__ExpiresHours`.
  - `ASPNETCORE_ENVIRONMENT` (Development/Production), optional `ASPNETCORE_URLS` to change ports.

## 4. Database
- PostgreSQL database specified by `ConnectionStrings__Default`.
- Migrations (EF Core): ensure `dotnet-ef` is installed, then run `dotnet ef database update --project CheckRaci.Api/CheckRaci.Api.csproj` (uses `CheckRaciDbContext`).

## 5. Auth notes
- JWT Bearer; roles: Admin vs User.
- Option A: accounts are activated by Admin (no self-signup). Admin creates/activates employee users and shares credentials; users log in to receive JWT and must send `Authorization: Bearer <token>`.

## 6. Local development quick start
1) Start PostgreSQL and set `ConnectionStrings__Default` and JWT env vars.
2) Backend: `dotnet run --project CheckRaci.Api/CheckRaci.Api.csproj` (listens on 5000/5001).
3) Frontend: set `VITE_API_BASE_URL=http://localhost:5000/api`, run `npm install`, then `npm run dev -- --host` (opens http://localhost:5173).
4) Login with admin-provided credentials; use Admin role to manage/activate employees.
