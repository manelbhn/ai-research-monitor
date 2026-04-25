# Waitlist Deploy Guide (Render + PostgreSQL)

## 1) Create PostgreSQL on Render

1. In Render dashboard: **New** -> **PostgreSQL**.
2. Pick the free tier and create the database.
3. After creation, copy the **External Database URL** (or Internal URL if app is on same Render network).

## 2) Deploy Next.js app on Render

1. Push this repository to GitHub.
2. In Render: **New** -> **Web Service** -> connect your repo.
3. Configure:
   - Build command: `npm ci && npm run build`
   - Start command: `npm run start`
   - Node version: 20+ recommended
4. Add environment variables:
   - `DATABASE_URL` = your Render Postgres URL
   - `WAITLIST_ADMIN_TOKEN` = long random secret string
   - `NODE_ENV` = `production`

## 3) Apply schema

Use Render shell or any PostgreSQL client to run:

```sql
\i backend/waitlist-schema.sql
```

If your SQL tool does not support `\i`, paste the SQL contents manually.

## 4) Verify waitlist submission

Send a POST request:

```bash
curl -X POST https://<your-app-domain>/api/subscribe \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test User\",\"email\":\"test@example.com\",\"companyName\":\"Acme\",\"phoneNumber\":\"+1 555 123 4567\",\"role\":\"researcher\",\"focus\":\"NLP\"}"
```

## 5) Admin access (view + CSV export)

### View all waitlist entries

```bash
curl "https://<your-app-domain>/api/get-emails?token=<WAITLIST_ADMIN_TOKEN>"
```

### Export CSV

Open in browser or use curl:

```bash
curl -L "https://<your-app-domain>/api/export-csv?token=<WAITLIST_ADMIN_TOKEN>" -o waitlist.csv
```

## Security notes

- Never expose `WAITLIST_ADMIN_TOKEN` on the client side.
- Rotate token if leaked.
- For stronger production hardening, place admin routes behind your auth dashboard or IP allowlist.
