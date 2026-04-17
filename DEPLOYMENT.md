# PoshanPoint Production Deployment Notes

## 1. Environment Setup

- Copy `server/.env.example` to `server/.env` and fill all required secrets.
- Copy `client/.env.example` to `client/.env` and point to deployed API/socket URLs.
- In production:
  - `NODE_ENV=production`
  - `USE_IN_MEMORY_DB=false`
  - `MONGO_URI` must point to managed MongoDB.
  - `JWT_SECRET` must be strong and unique.
  - `ADMIN_PHONES` must include trusted staff/admin numbers.
  - `PUBLIC_SERVER_URL` must be your backend public base URL (used for uploaded menu image links).
  - Configure persistent storage for `server/uploads` so uploaded images are not lost on restart.
  - Password staff auth:
    - `ADMIN_USERNAME`, `ADMIN_PASSWORD`
    - `STAFF_USERNAME`, `STAFF_PASSWORD`
    - `STAFF_LOGIN_RATE_LIMIT_MAX` (optional, default `10` per 10 minutes)

## 2. Server

```bash
cd server
npm ci
npm test
npm start
```

## 3. Client

```bash
cd client
npm ci
npm run build
npm start
```

## 4. Security Defaults Included

- Request ID on every API response (`X-Request-Id`).
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, HSTS in production).
- API and OTP rate limiting.
- Admin route protection via JWT + admin phone/flag.
- Payment verification persistence and order/payment consistency checks.

## 5. Operational Recommendations

- Run server behind HTTPS reverse proxy.
- Enable centralized log shipping with request ID correlation.
- Configure monitoring for:
  - `429` rate-limit spikes
  - `5xx` error rates
  - payment verification failures
  - websocket disconnect rates
