# Deploying AirScope to Vercel

Your AirScope Air Quality Dashboard is fully configured for 1-click deployment on Vercel with serverless API integration to your Neo4j Aura Graph Database.

---

## 1. Prerequisites
- A [Vercel](https://vercel.com/) account
- A GitHub repository with this code pushed
- A running [Neo4j AuraDB](https://neo4j.com/cloud/platform/aura-graph-database/) instance

---

## 2. Steps to Deploy on Vercel

### Step 1: Import Repository
1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository for this project.

### Step 2: Configure Project Settings
Vercel will automatically detect the settings:
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Neo4j Aura Environment Variables (Critical)
Before clicking deploy, expand the **Environment Variables** section and add:
- `NEO4J_URI`: `neo4j+s://6c9873be.databases.neo4j.io`
- `NEO4J_USERNAME`: `6c9873be` (or your Aura username)
- `NEO4J_PASSWORD`: `<your-neo4j-password>`
- `NEO4J_DATABASE`: `6c9873be` (or your Aura database name)

### Step 4: Click "Deploy"
1. Click **Deploy**.
2. Within ~30 seconds, Vercel will build the frontend and deploy the serverless functions in `/api/`.
3. Your live application will be available at:
   `https://<your-project-name>.vercel.app`

---

## 3. Architecture on Vercel
- **Frontend SPA**: Vite-compiled static bundle hosted on Vercel Global Edge Network.
- **Serverless API Routes**:
  - `GET /api/overview` — Computes KPIs, trends, and rankings from Neo4j Aura via Cypher.
  - `GET /api/cities` — Returns station metrics and latest readings across all 10 cities.
  - `GET /api/analytics` — Statistical calculations and CSV export data.
- **Database**: Neo4j Aura Cloud Graph Database.
