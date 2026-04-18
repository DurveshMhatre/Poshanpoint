# PoshanPoint

PoshanPoint is a full-stack food ordering app for smoothie bowls, shakes, and healthy snacks.

Customers can:
- browse the menu on mobile
- customize items
- place online orders with Razorpay
- track live order status

Staff/Admin can:
- manage menu and availability
- process incoming orders
- update order status in real-time

## Tech Stack

- Frontend: Next.js (`client/`)
- Backend: Node.js + Express + Socket.IO (`server/`)
- Database: MongoDB (Atlas in production)
- Payments: Razorpay

## Repository Structure

```text
.
|-- client/   # Next.js app
|-- server/   # Express API + Socket.IO
|-- Images/   # branding/product assets
|-- DEPLOYMENT.md
|-- CONTRIBUTING.md
```

## Quick Start (Local)

### 1) Install dependencies

```bash
cd client && npm ci
cd ../server && npm ci
```

### 2) Configure environment variables

Create these files:
- `client/.env` from `client/.env.example`
- `server/.env` from `server/.env.example`

### 3) Run backend

```bash
cd server
npm run dev
```

### 4) Run frontend

```bash
cd client
npm run dev
```

Open `http://localhost:3000`.

## Deploy (Free) - Vercel + Render (Single Repo)

This repo is monorepo-style (`client` + `server`).
Use:
- Vercel for `client`
- Render Web Service for `server`
- MongoDB Atlas Free for DB

### Step 1: Push this repo to GitHub

Already done for this project at:
- `https://github.com/DurveshMhatre/Poshanpoint.git`

### Step 2: Create MongoDB Atlas Free cluster

1. Create an Atlas account and a free shared cluster.
2. Create a database user and password.
3. Add network access (allow your Render service or `0.0.0.0/0` while testing).
4. Copy the connection string for `MONGO_URI`.

### Step 3: Deploy backend on Render

1. Open Render dashboard -> `New` -> `Web Service`.
2. Connect GitHub and select this repository.
3. Set **Root Directory** = `server`.
4. Build command: `npm ci`
5. Start command: `npm start`
6. Add environment variables:

Required:
- `NODE_ENV=production`
- `PORT=10000` (or leave Render default)
- `MONGO_URI=mongodb+srv://<username>:<urlencoded_password>@<cluster-host>/poshanpoint?retryWrites=true&w=majority&appName=Cluster0`
- `USE_IN_MEMORY_DB=false`
- `SEED_ON_STARTUP=false`
- `JWT_SECRET=<strong-random-secret>`
- `CLIENT_URLS=https://<your-vercel-app>.vercel.app`
- `PUBLIC_SERVER_URL=https://<your-render-service>.onrender.com`

Auth and ops:
- `ADMIN_PHONES=<comma-separated phones>`
- `ADMIN_USERNAME=<value>`
- `ADMIN_PASSWORD=<value>`
- `STAFF_USERNAME=<value>`
- `STAFF_PASSWORD=<value>`
- `RATE_LIMIT_MAX=300`
- `OTP_RATE_LIMIT_MAX=5`

Payments (if enabled):
- `RAZORPAY_KEY_ID=<value>`
- `RAZORPAY_KEY_SECRET=<value>`

7. Deploy and test:
- `https://<your-render-service>.onrender.com/api/health`

### Step 4: Deploy frontend on Vercel

1. Open Vercel dashboard -> `Add New...` -> `Project`.
2. Import this GitHub repository.
3. Set **Root Directory** = `client`.
4. Framework preset should auto-detect Next.js.
5. Add environment variables:

- `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api`
- `NEXT_PUBLIC_SOCKET_URL=https://<your-render-service>.onrender.com`
- `NEXT_PUBLIC_API_TIMEOUT_MS=15000`

6. Deploy.

### Step 5: Final CORS wiring

After Vercel gives your live URL:
1. Go back to Render service env vars.
2. Ensure `CLIENT_URLS` contains that exact Vercel URL.
3. Redeploy Render.

### Step 6: Share customer URL

Use and share:
- Home: `https://<your-vercel-app>.vercel.app`
- Direct order page: `https://<your-vercel-app>.vercel.app/menu`
- Order tracking: `https://<your-vercel-app>.vercel.app/track`

## Important Notes

- Never commit `.env` files or secrets.
- `server/uploads` is local disk storage; free Render instances have ephemeral filesystem.
- Render free services can sleep when idle and cold-start on first request.

## For Viewers

If you are visiting this repository:
- Check `client/src/app` for pages and customer flow.
- Check `server/routes` for API endpoints.
- Check `server/socket/orderSocket.js` for real-time tracking events.

## For Contributors

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before creating a PR.

## Security

If you find a security issue, avoid opening public issues with secrets or exploit details.
Contact repository maintainer directly.
