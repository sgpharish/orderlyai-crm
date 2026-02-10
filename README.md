# OrderlyAI CRM

A React CRM for hotel staff: **chat history**, **bookings**, **documents**, and **analytics** (messages, bookings, conversations, guests). Uses the OrderlyAI design system (glass, shadows, soft mid-tone backgrounds, green accent).

## Tech stack

- **React 19** + **TypeScript**
- **Vite 7** + **react-router-dom** + **recharts**

## Getting started

1. **Environment**

   Copy `.env.example` to `.env` and set your backend base URL:

   ```bash
   cp .env.example .env
   # Edit .env: VITE_API_BASE_URL=https://your-api.example.com
   ```

2. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

   Open the URL shown (e.g. http://localhost:5173). Sign in at `/login`; all other routes require a valid JWT and admin role.

## Features

- **Auth:** Login, Forgot password, Reset password (token from email link).
- **Chat history:** List conversations (filters: status, date range, guest phone, search); open a thread to view messages and attachments.
- **Bookings:** List with filters (status, platform, date range) and pagination.
- **Documents:** List property documents; replace a document (file upload) via modal.
- **Analytics:** Four views with shared date range (and optional “by day” / top N):
  - **Messages** – total, by platform, by type (booking vs concierge), daily series.
  - **Bookings** – total, conversion funnel, by platform/source, avg length of stay, over time.
  - **Conversations** – total sessions, peak by hour, sessions per guest, over time.
  - **Guests** – new vs returning, top guests by booking count, channel mix.

All property-scoped requests use `user.propertyId` from the login response. Send `Authorization: Bearer <access_token>` on every request except login, forgot-password, and reset-password.

## Build

```bash
npm run build
```

Output is in `dist/`.

## Deploy to production (dashboard.withorderly.com)

Production is served at **https://dashboard.withorderly.com** from the server folder `/home/ubuntu/orderlyai`. Nginx `root` should be set to `/home/ubuntu/orderlyai`.

**1. Build and pack (local)**

```bash
npm run build
tar -czvf orderlyai-build.tar.gz -C dist .
```

**2. Upload to server**

```bash
scp -i /Users/guruprasadkrishnan/Downloads/orderlyaipem.pem orderlyai-crm-build.tar.gz ubuntu@ec2-44-255-45-196.us-west-2.compute.amazonaws.com:/home/ubuntu/orderlyai
```

**3. On server: extract and fix ownership**

```bash
ssh -i /Users/guruprasadkrishnan/Downloads/orderlyaipem.pem ubuntu@ec2-44-255-45-196.us-west-2.compute.amazonaws.com
```

Then on the server:

```bash
sudo rm -rf /home/ubuntu/orderlyai/*
sudo tar -xzvf /home/ubuntu/orderlyai/orderlyai-build.tar.gz -C /home/ubuntu/orderlyai
sudo chown -R www-data:www-data /home/ubuntu/orderlyai
rm /home/ubuntu/orderlyai/orderlyai-build.tar.gz
```

No nginx reload needed; the new files are served immediately. Optional: remove the local tarball with `rm orderlyai-build.tar.gz`.
