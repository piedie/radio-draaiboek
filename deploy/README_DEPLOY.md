# Deploy op VPS (Nginx + certbot)

Deze app is een **Vite + React** single-page app die praat met **Supabase** (auth + tabellen: runbooks, items, jingles, feedback, item types, etc.).

## 0) Voorwaarden
- DNS A-records:
  - `draaiboek.landstede.live` -> jouw VPS IP
  - `stream.landstede.live` -> jouw VPS IP
- Op de VPS: Ubuntu/Debian + Nginx

## 1) Project op server zetten
```bash
sudo mkdir -p /var/www/draaiboek
sudo chown -R $USER:$USER /var/www/draaiboek
cd /var/www/draaiboek

# voorbeeld: clone van GitHub
git clone <JOUW_GITHUB_REPO_URL> .
```

## 2) Environment variables
Maak `.env` in de projectroot:
```bash
cd /var/www/draaiboek
cp .env.example .env
nano .env
```
Vul minimaal `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`.

## 3) Build (Node)
```bash
cd /var/www/draaiboek
# Node 18+ aanbevolen
npm ci
npm run build
```
Na build staat de site in: `/var/www/draaiboek/dist`

## 4) Nginx virtual host
### Draaiboek
```bash
sudo cp deploy/nginx-draaiboek.conf /etc/nginx/sites-available/draaiboek.landstede.live
sudo ln -s /etc/nginx/sites-available/draaiboek.landstede.live /etc/nginx/sites-enabled/ || true
```

### Owncast (als je dit nog niet zo hebt)
```bash
sudo cp deploy/nginx-stream.conf /etc/nginx/sites-available/stream.landstede.live
sudo ln -s /etc/nginx/sites-available/stream.landstede.live /etc/nginx/sites-enabled/ || true
```

Test en herlaad:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5) HTTPS via certbot
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# beide domeinen tegelijk kan ook:
sudo certbot --nginx -d draaiboek.landstede.live -d stream.landstede.live
```
Kies bij de vraag van certbot: **Redirect** (HTTP -> HTTPS).

## 6) Supabase Auth (belangrijk!)
In Supabase moet je de URL’s updaten:
- **Site URL**: `https://draaiboek.landstede.live`
- **Redirect URLs** (voeg toe):
  - `https://draaiboek.landstede.live/**`
  - (optioneel dev) `http://localhost:5173/**`

Anders kan login/registratie of magic links misgaan.

## 7) Update flow
Bij elke update:
```bash
cd /var/www/draaiboek
git pull
npm ci
npm run build
sudo systemctl reload nginx
```
