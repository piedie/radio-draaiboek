# Deploy op VPS (draaiboek.landstede.live)

Dit project is een **Vite + React** webapp (SPA) met **Supabase** als backend (auth + database). 
Op een VPS hoef je dus alleen **statische bestanden** te hosten (de `dist/` map). De database blijft bij Supabase.

## Wat deze app doet (op basis van de code)
- Inloggen/registreren via **Supabase Auth**
- Meerdere **draaiboeken/runbooks** per gebruiker (`runbooks` tabel)
- Items per draaiboek (`items` tabel) met volgorde (drag & drop)
- **Jingles** beheren (`jingles` tabel)
- **Custom item types** per gebruiker (via utils/components)
- (Optioneel) feedback/admin panel (SQL scripts zitten in repo)

## 0) Voor je begint
- DNS: `draaiboek.landstede.live` A-record → jouw VPS IP
- Nginx draait al (want je hebt `stream.landstede.live` / Owncast)

## 1) Repo naar GitHub (optioneel maar handig)
Op je eigen machine:
```bash
# in de uitgepakte map
git init
git add .
git commit -m "Initial commit"
# maak een lege repo op GitHub en koppel die:
git remote add origin git@github.com:YOURNAME/radio-draaiboek.git
git branch -M main
git push -u origin main
```

## 2) Op de VPS: Node installeren (alleen nodig om te builden)
Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs
node -v
npm -v
```

## 3) Project op de VPS zetten
Bijv. in `/opt`:
```bash
sudo mkdir -p /opt/draaiboek
sudo chown -R $USER:$USER /opt/draaiboek
cd /opt/draaiboek

# optie A: clone via GitHub
git clone https://github.com/YOURNAME/radio-draaiboek.git .

# optie B: upload zip en unzip
# unzip radio-draaiboek-vps.zip -d /opt/draaiboek
```

## 4) Supabase env vars zetten (BELANGRIJK)
Vite leest deze bij het builden.
```bash
cd /opt/draaiboek
cp .env.example .env
nano .env
```
Vul in:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 5) Build maken
```bash
cd /opt/draaiboek
npm install
npm run build
```
Na dit commando heb je `/opt/draaiboek/dist`.

## 6) Nginx virtualhost voor draaiboek
Maak webroot:
```bash
sudo mkdir -p /var/www/draaiboek
sudo rsync -a --delete /opt/draaiboek/dist/ /var/www/draaiboek/dist/
```

Plaats config:
```bash
sudo cp /opt/draaiboek/deploy/nginx-draaiboek.conf /etc/nginx/sites-available/draaiboek.landstede.live
sudo ln -s /etc/nginx/sites-available/draaiboek.landstede.live /etc/nginx/sites-enabled/draaiboek.landstede.live

sudo nginx -t
sudo systemctl reload nginx
```

### Tip: Owncast (stream.landstede.live)
Als je dat nog niet als aparte vhost hebt:
```bash
sudo cp /opt/draaiboek/deploy/nginx-stream.conf /etc/nginx/sites-available/stream.landstede.live
sudo ln -s /etc/nginx/sites-available/stream.landstede.live /etc/nginx/sites-enabled/stream.landstede.live
sudo nginx -t
sudo systemctl reload nginx
```

## 7) HTTPS met Certbot + redirect naar https
Install (Ubuntu):
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```
Certificaten aanvragen + auto-redirect:
```bash
sudo certbot --nginx -d draaiboek.landstede.live
sudo certbot --nginx -d stream.landstede.live
```
Test auto-renew:
```bash
sudo certbot renew --dry-run
```

## 8) Supabase instellingen (anders werkt login/redirect vaak niet)
In Supabase dashboard:
- **Authentication → URL Configuration**
  - Site URL: `https://draaiboek.landstede.live`
  - Redirect URLs: voeg toe:
    - `https://draaiboek.landstede.live/**`
    - (optioneel) `http://localhost:5173/**` voor lokaal ontwikkelen

## 9) Update/deploy in 1 minuut (als je code aanpast)
```bash
cd /opt/draaiboek
git pull
npm install
npm run build
sudo rsync -a --delete dist/ /var/www/draaiboek/dist/
```

---

# Veelvoorkomende problemen
- **Witte pagina / 404 op refresh** → Nginx `try_files ... /index.html` moet aan staan (staat in config)
- **Login werkt niet** → check Supabase Site URL + Redirect URLs
- **Env vars lijken niet te werken** → je moet opnieuw `npm run build` doen na wijziging in `.env`
