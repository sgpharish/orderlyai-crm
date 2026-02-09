# Deploy OrderlyAI CRM to your server

The CRM is a **static Vite/React SPA**. You build once, upload the `dist/` folder, and serve it with nginx (no Node/PM2 needed at runtime). Same idea as your Flutter admin.

---

## Checklist: crm.withorderly.com + dashboard.withorderly.com (both working)

Use this when you want **both** the old CRM and the new one at the same time:

- **crm.withorderly.com** → Old (Flutter) – no changes.
- **dashboard.withorderly.com** → New (React) – add DNS, nginx, and deploy.

---

### Step 1 – DNS

1. In your DNS provider (where withorderly.com is managed), add an **A record**:
   - **Name/host:** `dashboard` (or `dashboard.withorderly.com` if it asks for full name).
   - **Value:** Your EC2 public IP (same as for `crm.withorderly.com`).
   - **TTL:** 300 or default.
2. Wait a few minutes (up to 10–15) for DNS to propagate.

---

### Step 2 – Build and pack the new CRM (on your Mac)

```bash
cd /Users/guruprasadkrishnan/Desktop/orderlyai/orderlyai-crm
npm run build
tar -czvf orderlyai-crm-build.tar.gz -C dist .
```

---

### Step 3 – Upload to the server

```bash
scp -i /Users/guruprasadkrishnan/Downloads/orderlyaipem.pem orderlyai-crm-build.tar.gz ubuntu@ec2-35-94-7-79.us-west-2.compute.amazonaws.com:/home/ubuntu/
```

---

### Step 4 – On the server: create folder and extract (SSH in first)

```bash
ssh -i /Users/guruprasadkrishnan/Downloads/orderlyaipem.pem ubuntu@ec2-35-94-7-79.us-west-2.compute.amazonaws.com
```

Then on the server:

```bash
mkdir -p /home/ubuntu/crm
sudo rm -rf /home/ubuntu/crm/*
tar -xzvf /home/ubuntu/orderlyai-crm-build.tar.gz -C /home/ubuntu/crm
rm /home/ubuntu/orderlyai-crm-build.tar.gz
sudo chown -R www-data:www-data /home/ubuntu/crm
```

---

### Step 5 – Nginx: add config for dashboard.withorderly.com

On the server (same SSH session or a new one):

```bash
sudo nano /etc/nginx/sites-available/dashboard.withorderly.com
```

Paste **exactly** this (then save: **Ctrl+O**, Enter, **Ctrl+X**):

```nginx
server {
    listen 80;
    server_name dashboard.withorderly.com;

    root /home/ubuntu/crm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and test nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/dashboard.withorderly.com /etc/nginx/sites-enabled/
sudo nginx -t
```

If the test passes:

```bash
sudo systemctl reload nginx
```

---

### Step 6 – HTTPS for dashboard.withorderly.com (recommended)

Still on the server, after DNS for **dashboard.withorderly.com** is pointing to this EC2:

```bash
sudo certbot --nginx -d dashboard.withorderly.com
```

Follow the prompts. Certbot will add HTTPS to the new server block automatically.

---

### Step 7 – Verify

- **https://crm.withorderly.com** → Old (Flutter) CRM (unchanged).
- **https://dashboard.withorderly.com** → New (React) CRM (login, etc.).

---

### Summary

| URL | App | Root |
|-----|-----|------|
| **crm.withorderly.com** | Old (Flutter) | /home/ubuntu/flutter/web (unchanged) |
| **dashboard.withorderly.com** | New (React) | /home/ubuntu/crm |

Do **not** edit `/etc/nginx/sites-available/default`; that file stays as-is for crm.withorderly.com.

---

## Run both CRMs in parallel (recommended)

Keep the **old** (Flutter) CRM exactly where it is and add the **new** (React) CRM on a **new** subdomain. No change to the old URL.

- **Old CRM (Flutter):** `crm.withorderly.com` → **unchanged** (same nginx, same folder).
- **New CRM (React):** new subdomain → e.g. **app.withorderly.com** (see name suggestions below).

### Name suggestions for the new CRM (withorderly.com)

Pick one and add it as an **A record** pointing to your EC2 IP:

| Subdomain | Example URL | Notes |
|-----------|-------------|--------|
| **app** | **app.withorderly.com** | Short, clear – “the app”. **Recommended.** |
| admin | admin.withorderly.com | Common for admin/dashboard UIs. |
| hub | hub.withorderly.com | Feels like a central place. |
| dashboard | dashboard.withorderly.com | Very explicit. |
| crm-new | crm-new.withorderly.com | Makes it obvious it’s the new CRM. |

Use **app.withorderly.com** in the steps below; replace with your choice if different.

### 1. DNS

- **crm.withorderly.com** – No change. Keeps pointing to your EC2 (old CRM).
- **app.withorderly.com** (or chosen name) – Add an **A record** pointing to the **same EC2 public IP**.

### 2. Server directories

- **New CRM:** `/home/ubuntu/crm` (create once, deploy the new build here).
- **Old CRM:** Leave as-is at e.g. `/home/ubuntu/flutter` (or wherever it lives). Do not change it.

### 3. Nginx: add one new server block

Keep your **existing** config for **crm.withorderly.com** as-is (still serving the old Flutter app). Add a **new** server block for the new CRM only.

#### How to create the nginx file (step-by-step)

**1. SSH into your server**

```bash
ssh -i /path/to/orderlyaipem.pem ubuntu@<your-ec2-ip-or-hostname>
```

**2. Create the config file**

```bash
sudo nano /etc/nginx/sites-available/app.withorderly.com
```

**3. Paste this entire block** (then save: Ctrl+O, Enter, Ctrl+X)

```nginx
server {
    listen 80;
    server_name app.withorderly.com;

    root /home/ubuntu/crm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**4. Enable the site and reload nginx**

```bash
sudo ln -sf /etc/nginx/sites-available/app.withorderly.com /etc/nginx/sites-enabled/
sudo nginx -t
```

If you see `syntax is ok` and `test is successful`, then:

```bash
sudo systemctl reload nginx
```

**5. (Optional) HTTPS with certbot**

After DNS for **app.withorderly.com** points to this server:

```bash
sudo certbot --nginx -d app.withorderly.com
```

Certbot will add `listen 443 ssl` and certificate paths automatically.

---

**Full config reference (new CRM – app.withorderly.com)**

```nginx
server {
    listen 80;
    server_name app.withorderly.com;

    root /home/ubuntu/crm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # After certbot you’ll have: listen 443 ssl; + ssl_certificate lines
}
```

### 4. Deploy the new CRM only

Build and upload the new app into `/home/ubuntu/crm` (see “Build locally” and “Pack and upload” below). Do not touch the old Flutter folder.

### 5. HTTPS for the new URL (optional)

After DNS for **app.withorderly.com** is live:

```bash
sudo certbot --nginx -d app.withorderly.com
```

### Summary – both in parallel

| URL | App | Root on server |
|-----|-----|----------------|
| **crm.withorderly.com** | Old (Flutter) | Unchanged (e.g. /home/ubuntu/flutter/web) |
| **app.withorderly.com** | New (React) | /home/ubuntu/crm |

Old URL stays the same; new CRM is at **app.withorderly.com** (or the subdomain you chose).

---

## Configure for crm.withorderly.com (new CRM only – replace old)

If you prefer to **replace** the old CRM at **crm.withorderly.com** with the new one (no parallel setup), do the following:

1. **DNS** – No change if `crm.withorderly.com` already points to your EC2. If not, add an **A record**: `crm` → your EC2 public IP.

2. **Deploy the new build** – Build and upload so the new CRM files live in a folder on the server (e.g. `/home/ubuntu/crm`). Use steps 2–4 below.

3. **Nginx** – Point `crm.withorderly.com` at the new folder instead of the old Flutter folder.

**Option A – Replace old CRM (same URL, new app)**  
Edit the existing nginx config for `crm.withorderly.com` and set `root` to the new CRM directory:

```nginx
server {
    listen 80;
    server_name crm.withorderly.com;

    root /home/ubuntu/crm;        # was e.g. /home/ubuntu/flutter/web
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # HTTPS (if you use certbot, it adds listen 443 ssl; and cert paths)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/crm.withorderly.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/crm.withorderly.com/privkey.pem;
}
```

Then reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**Option B – New config file**  
If you prefer a separate file:

```bash
sudo nano /etc/nginx/sites-available/crm.withorderly.com
```

Paste the server block above (with `root /home/ubuntu/crm`), save, then:

```bash
sudo ln -sf /etc/nginx/sites-available/crm.withorderly.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**API URL** – The new CRM calls your backend from the browser. In `.env.production` you have `VITE_API_BASE_URL=https://orderlyai.fishwebsite.com`. So the backend stays at orderlyai.fishwebsite.com; the CRM is just served from crm.withorderly.com. No nginx proxy needed for the API unless you want to change that.

**After switching** – Users open **https://crm.withorderly.com** (or http) and get the new React CRM. The old Flutter build can stay in its folder until you’re sure you don’t need it.

**Quick checklist for crm.withorderly.com**

1. Build: `npm run build` (in this repo).
2. Pack: `tar -czvf orderlyai-crm-build.tar.gz -C dist .`
3. Upload: `scp -i ... orderlyai-crm-build.tar.gz ubuntu@<your-ec2>:/home/ubuntu/`
4. On server: extract into `/home/ubuntu/crm` (see step 4 below), fix ownership.
5. Nginx: set `server_name crm.withorderly.com` and `root /home/ubuntu/crm`; `try_files $uri $uri/ /index.html;` for `location /`.
6. Reload nginx. Open https://crm.withorderly.com.

If you already use **HTTPS** for crm.withorderly.com (e.g. certbot), keep your existing `listen 443 ssl` and certificate lines; only change `root` to `/home/ubuntu/crm` and add the `try_files` rule if missing.

---

## 1. Decide where it lives

- **Option A – Replace old Flutter admin**  
  Use the same path as before (e.g. `/home/ubuntu/flutter`) and replace its contents with the new CRM. One app, one URL.

- **Option B – Alongside old admin**  
  Put the new CRM in a separate directory (e.g. `/home/ubuntu/crm`) and point a (sub)domain or path to it.  
  Example: `orderlyai.fishwebsite.com` → new CRM, and keep the old admin on another path/domain if needed.

Use **Option B** below so the old admin is untouched until you switch.

---

## 2. Build locally (same machine as where you run backend commands)

From the CRM repo:

```bash
cd /Users/guruprasadkrishnan/Desktop/orderlyai/orderlyai-crm

# Ensure production env (API URL) is set
# .env.production should have: VITE_API_BASE_URL=https://orderlyai.fishwebsite.com
npm run build
```

This creates `dist/` with `index.html` and `assets/` (JS/CSS). No server process needed; nginx will serve these files.

---

## 3. Pack and upload (mirroring your Flutter flow)

```bash
# From the CRM project root
tar -czvf orderlyai-crm-build.tar.gz -C dist .

# Upload to EC2 (adjust path if you use a different folder than crm)
scp -i /Users/guruprasadkrishnan/Downloads/orderlyaipem.pem orderlyai-crm-build.tar.gz ubuntu@ec2-35-94-7-79.us-west-2.compute.amazonaws.com:/home/ubuntu/
```

If your EC2 is the other one (44.243.112.23), use:

```bash
scp -O -l 4000 -o ServerAliveInterval=15 -o ServerAliveCountMax=6 -o IPQoS=none -i /Users/guruprasadkrishnan/Downloads/orderlyaipem.pem orderlyai-crm-build.tar.gz ubuntu@ec2-44-243-112-23.us-west-2.compute.amazonaws.com:~/orderlyai-crm-build.tar.gz
```

---

## 4. On the server: extract and put in place

SSH in, then:

```bash
ssh -i /Users/guruprasadkrishnan/Downloads/orderlyaipem.pem ubuntu@ec2-35-94-7-79.us-west-2.compute.amazonaws.com
# (or the 44.243.112.23 host if that’s your nginx box)

# Create dir for the new CRM (if not already present)
mkdir -p /home/ubuntu/crm

# Stop nginx so we can replace files cleanly (optional but safe)
sudo systemctl stop nginx

# Remove old content and extract new build
sudo rm -rf /home/ubuntu/crm/*
tar -xzvf /home/ubuntu/orderlyai-crm-build.tar.gz -C /home/ubuntu/crm
rm /home/ubuntu/orderlyai-crm-build.tar.gz

# Fix ownership if nginx runs as www-data
sudo chown -R www-data:www-data /home/ubuntu/crm

# Start nginx again
sudo systemctl start nginx
```

After this, the CRM files should be:

- `/home/ubuntu/crm/index.html`
- `/home/ubuntu/crm/assets/*.js`, `*.css`

---

## 5. Nginx config for the CRM (SPA)

Nginx must serve `index.html` for all routes (client-side routing). Example for `orderlyai.fishwebsite.com`:

```nginx
server {
    listen 80;
    server_name orderlyai.fishwebsite.com;

    root /home/ubuntu/crm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        # If your backend is on the same machine, proxy to it
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optional: HTTPS with Let’s Encrypt
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/orderlyai.fishwebsite.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/orderlyai.fishwebsite.com/privkey.pem;
}
```

If the backend is already under `https://orderlyai.fishwebsite.com` (e.g. `/api` or same origin), your `.env.production` is already correct (`VITE_API_BASE_URL=https://orderlyai.fishwebsite.com`). The CRM will call that URL from the browser; no need to proxy in nginx unless you want to hide the backend URL.

---

## 6. One-shot deploy script (optional)

Save as `deploy.sh` in the CRM repo and run `./deploy.sh`:

```bash
#!/bin/bash
set -e
CRM_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY="/Users/guruprasadkrishnan/Downloads/orderlyaipem.pem"
REMOTE="ubuntu@ec2-35-94-7-79.us-west-2.compute.amazonaws.com"

cd "$CRM_DIR"
npm run build
tar -czvf orderlyai-crm-build.tar.gz -C dist .
scp -i "$KEY" orderlyai-crm-build.tar.gz "$REMOTE:/home/ubuntu/"
rm orderlyai-crm-build.tar.gz

ssh -i "$KEY" "$REMOTE" << 'EOF'
  sudo systemctl stop nginx
  sudo rm -rf /home/ubuntu/crm/*
  tar -xzvf /home/ubuntu/orderlyai-crm-build.tar.gz -C /home/ubuntu/crm
  rm /home/ubuntu/orderlyai-crm-build.tar.gz
  sudo chown -R www-data:www-data /home/ubuntu/crm
  sudo systemctl start nginx
EOF

echo "Deploy done. Open https://orderlyai.fishwebsite.com (or your CRM URL)."
```

---

## Summary

| Step        | Backend (Node)     | Flutter (old admin) | New CRM (Vite)        |
|------------|--------------------|----------------------|------------------------|
| Build      | `npm run build`    | `flutter build web` | `npm run build`        |
| Artifact   | `dist/` (Node app) | `build/web/`        | `dist/` (static files) |
| Run        | PM2 (`dist/main.js`)| nginx (static)     | nginx (static)         |
| Upload     | tar → scp → extract| same                | tar -C dist . → scp → extract |
| Process    | pm2 restart        | nginx               | nginx                  |

The CRM does **not** use PM2; it’s only static files served by nginx. Your backend (port 3000) keeps running with PM2 as today; the CRM in the browser will call `VITE_API_BASE_URL` (e.g. `https://orderlyai.fishwebsite.com`).

If you tell me whether the CRM should replace the Flutter app or sit next to it, and which EC2 host is the nginx one, I can adapt the paths and the script exactly.
