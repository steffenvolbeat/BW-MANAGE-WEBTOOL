# Vercel + Prisma Postgres – Vollständige Deployment-Dokumentation

> Erstellt: 9. März 2026 | Zuletzt aktualisiert: 15. März 2026  
> Projekt: `bw-manage-webtool`  
> Live-URL: **https://bw-manage-webtool.vercel.app**

---

## Inhaltsverzeichnis

1. [Übersicht & Architektur](#1-übersicht--architektur)
2. [Schritt-für-Schritt via Vercel-Website](#2-schritt-für-schritt-via-vercel-website)
3. [Pflichtänderungen im Code](#3-pflichtänderungen-im-code)
4. [Abhängigkeits-Konflikte beheben](#4-abhängigkeits-konflikte-beheben)
5. [Environment Variables – vollständige Übersicht](#5-environment-variables--vollständige-übersicht)
6. [Prisma Postgres verknüpfen](#6-prisma-postgres-verknüpfen)
7. [Vercel Blob Store einrichten](#7-vercel-blob-store-einrichten)
8. [Deployment via CLI](#8-deployment-via-cli)
9. [Fehler & Lösungen aus diesem Deployment](#9-fehler--lösungen-aus-diesem-deployment)
10. [Security-Checkliste](#10-security-checkliste)
11. [Nach dem Deployment](#11-nach-dem-deployment)

---

## 1. Übersicht & Architektur

```
GitHub Repo
    │
    ▼
Vercel (Next.js 16, SSR + Static)
    │
    ├── Build: prisma generate → prisma migrate resolve --rolled-back → prisma migrate deploy → next build
    │
    ├── Prisma Postgres (db.prisma.io:5432)
    │         └── Datenbank: bewerbungs_management_db / postgres
    │
    └── Vercel Blob Store (bw-uploads)
              └── Persistente Datei-Uploads via @vercel/blob
```

| Komponente       | Wert                                                       |
|------------------|------------------------------------------------------------|
| Framework        | Next.js 16 (App Router)                                    |
| Datenbank        | Prisma Postgres (Vercel-Integration)                       |
| ORM              | Prisma 7.x                                                 |
| Dateispeicher    | Vercel Blob Store (`bw-uploads`, `store_NKKNQ6BO1IgaA1Au`) |
| Auth             | JWT + WebAuthn + TOTP                                      |
| Node.js Ziel     | 20.x (Vercel Standard)                                     |
| React Version    | 18.2.0 (fix auf 18, nicht 19!)                             |

---

## 2. Schritt-für-Schritt via Vercel-Website

### 2.1 GitHub-Repository anlegen und Code hochladen

1. Auf [github.com](https://github.com) ein neues Repository erstellen (z. B. `BW-MANAGE-WEBTOOL`)
2. Lokal initialisieren und pushen:

```bash
git init
git add .
git commit -m "First Commit"
git remote add origin git@github.com:DEIN_USERNAME/BW-MANAGE-WEBTOOL.git
git push -u origin main
```

> **Wichtig:** Sicherstellen, dass `.env`, `.env.local`, `.env.*.local` **niemals** im Repository landet. Prüfen via `git check-ignore -v .env.local`

---

### 2.2 Vercel-Konto verbinden

1. [vercel.com](https://vercel.com) aufrufen → **Sign Up** oder **Log In**
2. Mit GitHub-Account verbinden (OAuth)
3. Im Dashboard: **Add New → Project**
4. **GitHub-Repository importieren** → `BW-MANAGE-WEBTOOL` auswählen
5. Framework wird automatisch erkannt: **Next.js**
6. **Deploy** noch NICHT klicken – zuerst Datenbank und Env Vars konfigurieren!

---

### 2.3 Prisma Postgres Datenbank anlegen

1. Im Vercel-Projekt-Dashboard: linke Seitenleiste → **Storage**
2. **Create Database** → **Prisma Postgres** auswählen
3. Name vergeben: z. B. `bw-manage-prisma-postres`
4. Region wählen (z. B. `Washington DC (iad1)`)
5. **Create** klicken
6. Status zeigt **Available** → auf **Installation** Tab klicken
7. Die Dashboard-Seite zeigt dann die Quickstart-Secrets:

```
DATABASE_URL="postgres://USER:TOKEN@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgres://USER:TOKEN@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="postgres://USER:TOKEN@db.prisma.io:5432/postgres?sslmode=require"
```

8. **Connect Project** Button klicken → Wähle das Vercel-Projekt → Bestätigen

> Dadurch werden `DATABASE_URL`, `POSTGRES_URL` und `PRISMA_DATABASE_URL` automatisch als Vercel Environment Variables gesetzt (Production + Preview + Development).

---

### 2.4 Weitere Environment Variables setzen

Im Vercel-Projekt → **Settings** → **Environment Variables**:

| Name            | Wert                           | Umgebung           |
|-----------------|--------------------------------|--------------------|
| `DATABASE_URL`  | (automatisch von Prisma Postgres) | Production, Preview, Development |
| `POSTGRES_URL`  | (automatisch von Prisma Postgres) | Production, Preview, Development |
| `PRISMA_DATABASE_URL` | (automatisch von Prisma Postgres) | Production, Preview, Development |
| `JWT_SECRET`    | Mind. 64-Byte Zufallsstring    | Production         |
| `JWT_EXPIRES_IN`| `7d`                           | Production         |

**Neuen JWT_SECRET generieren:**
```bash
openssl rand -hex 64
# Ausgabe z.B.: 1543793f3efce56d9e2...
```

Jeden Wert per **Add** in Vercel eintragen, Typ = **Secret (Encrypted)**.

---

### 2.5 Ersten Deploy starten

1. In Vercel → Projekt → **Deployments** Tab
2. **Redeploy** (oder automatisch via Git Push nach dem ersten Deploy)
3. Build-Logs beobachten → Muss grün enden

---

## 3. Pflichtänderungen im Code

Diese Änderungen **müssen im Code** vorhanden sein, damit das Deployment auf Vercel funktioniert:

---

### 3.1 `prisma.config.ts` – `process.env` statt `env()`

Das strikte `env()` aus `prisma/config` wirft beim `postinstall` auf Vercel einen Fehler wenn `DATABASE_URL` nicht gesetzt ist. Lösung: `process.env` verwenden.

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",   // ← process.env statt env()
  },
});
```

> **Hintergrund:** Vercel führt `npm install` (inkl. `postinstall: prisma generate`) aus bevor die Env Vars vollständig geladen sind. Das strikte `env()` bricht dann ab.

---

### 3.2 `package.json` – Build-Script und Postinstall

```json
{
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "db:seed": "prisma db seed"
  }
}
```

- **`postinstall: prisma generate`** – sorgt dafür, dass Vercel den Prisma Client nach `npm install` erzeugt
- **`build: prisma generate && prisma migrate deploy && next build`** – führt Migrationen auf der Cloud-DB aus **bevor** Next.js baut

---

### 3.3 `prisma/schema.prisma` – `url` auf `env()` gesetzt

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

> Ohne `url = env("DATABASE_URL")` weiß Prisma nicht, welche Datenbank zu verwenden ist.

---

### 3.4 React-18-kompatible Paketversionen in `package.json`

Vercel installiert alle Dependencies neu. React-19-Pakete brechen den Install, wenn im Projekt `react@18` verwendet wird:

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.17.10",
    "react-leaflet": "^4.2.1"
  }
}
```

| Paket | Falsch (React 19 only) | Richtig (React 18) |
|---|---|---|
| `@react-three/drei` | `^10.x` | `^9.122.0` |
| `@react-three/fiber` | `^9.x` | `^8.17.10` |
| `react-leaflet` | `^5.x` | `^4.2.1` |

---

### 3.5 `useSearchParams()` in Suspense wrappen

Next.js 16 bricht beim Build ab, wenn `useSearchParams()` ohne `<Suspense>` in einer Seite verwendet wird.

**`src/app/auth/login/page.tsx`:**
```tsx
import { Suspense } from "react";

function LoginPageContent() {
  const searchParams = useSearchParams();
  // ... restlicher Code
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-linear-to-br from-blue-950 via-slate-900 to-slate-800" />}>
      <LoginPageContent />
    </Suspense>
  );
}
```

**`src/app/notes/page.tsx`:**
```tsx
import { Suspense } from "react";
import NotesManagement from "@/components/notes/NotesManagement";

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <NotesManagement />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  );
}
```

> **Regel:** Jede Komponente die `useSearchParams()` nutzt, muss von `<Suspense>` umschlossen sein, wenn die Seite statisch prerendered wird.

---

### 3.6 TypeScript-Ref-Typen in Three.js Komponenten

```tsx
// src/components/ai/AvatarScene.tsx

// FALSCH – bricht TypeScript Build
function Eye({ blinkRef }: { blinkRef: React.RefObject<THREE.Mesh | null> }) {}
const headRef = useRef<THREE.Mesh>(null);  // war Mesh statt Group

// RICHTIG
function Eye({ blinkRef }: { blinkRef: React.Ref<THREE.Mesh> }) {}
const headRef = useRef<THREE.Group>(null); // <group ref={...}> braucht Group
```

---

### 3.7 `.gitignore` – Secrets niemals committen

```gitignore
# Umgebungsvariablen – NIEMALS einchecken!
.env
.env.local
.env.*.local

# Vercel-Projektdaten (enthält Projekt-IDs)
.vercel
```

---

### 3.8 `.vercelignore` – Secrets nicht ins Vercel-Build

```
.env
.env.*
!.env.example
```

---

## 4. Abhängigkeits-Konflikte beheben

```bash
# Fehler war: ERESOLVE could not resolve @react-three/drei@10.x requires react@19
npm install  # schlägt fehl mit Exit Code 1

# Lösung 1 (empfohlen): React-18-kompatible Versionen pinnen
# In package.json die oben genannten Versionen eintragen, dann:
npm install

# Lösung 2 (Notfall): Legacy Peer Deps
npm install --legacy-peer-deps  # nicht empfohlen für Production
```

---

## 5. Environment Variables – vollständige Übersicht

| Variable | Zweck | Wo setzen |
|---|---|---|
| `DATABASE_URL` | Prisma DB-Verbindung (Prisma Postgres) | Vercel (auto via Storage Connect) |
| `POSTGRES_URL` | Alias für DB-Verbindung | Vercel (auto via Storage Connect) |
| `PRISMA_DATABASE_URL` | Alias für Prisma Studio | Vercel (auto via Storage Connect) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Store Zugriff für Datei-Uploads | Vercel (auto via Blob Store Connect) |
| `JWT_SECRET` | Signierung der JWT-Tokens | Vercel → Settings → Env Vars |
| `JWT_EXPIRES_IN` | Gültigkeitsdauer der Tokens | Vercel → Settings → Env Vars |

**Lokal (`.env.local`)** – wird nie committed:
```dotenv
DATABASE_URL="postgresql://user:password@localhost:5432/bewerbungs_management_db?schema=public&sslmode=verify-full"
JWT_SECRET="YOUR_STRONG_SECRET_MIN_64_CHARS"
JWT_EXPIRES_IN="7d"
BLOB_READ_WRITE_TOKEN="eyJ2IjoidjIi..."   # aus Vercel Blob Store Dashboard
```

> **Hinweis zu SSL:** `sslmode=require` → `sslmode=verify-full` für alle Prisma-DB-URLs (lokal + Prod). Das stärkere Verify-Full verhindert Man-in-the-Middle-Angriffe.

---

## 6. Prisma Postgres verknüpfen

### Variante A: Über Vercel-Website (empfohlen)
1. Storage → Prisma Postgres → **Connect Project** → Projekt auswählen
2. Env Vars werden automatisch in alle Environments eingetragen

### Variante B: CLI
```bash
# Env Vars manuell setzen
DB_URL="postgres://USER:TOKEN@db.prisma.io:5432/postgres?sslmode=verify-full"
printf "%s" "$DB_URL" | npx vercel env add DATABASE_URL production
printf "%s" "$DB_URL" | npx vercel env add DATABASE_URL preview
printf "%s" "$DB_URL" | npx vercel env add DATABASE_URL development
printf "%s" "$DB_URL" | npx vercel env add POSTGRES_URL production
printf "%s" "$DB_URL" | npx vercel env add PRISMA_DATABASE_URL production
```

### Migrationen auf Cloud-DB ausführen
```bash
# Env vars lokal pullen, dann Migrationen laufen lassen
npx vercel env pull .env.vercel.local
export $(cat .env.vercel.local | grep DATABASE_URL | xargs)
npx prisma migrate deploy
rm .env.vercel.local  # SOFORT löschen! Enthält Secrets
```

---

## 7. Vercel Blob Store einrichten

Dateien, die Nutzer hochladen (Lebenslauf, Anschreiben etc.), müssen persistent gespeichert werden.
Vercel's `/tmp`-Verzeichnis wird nach jeder Serverless-Invokation geleert – daher **Vercel Blob Store**.

### 7.1 Store über Vercel Dashboard
1. Vercel Projekt → **Storage** → **Create Database** → **Blob**
2. Name vergeben: z. B. `bw-uploads`
3. Region: `Washington DC (iad1)` (passend zur DB-Region)
4. **Create** → danach **Connect Project** → alle 3 Environments wählen
5. `BLOB_READ_WRITE_TOKEN` wird automatisch als Env Var gesetzt

### 7.2 Store über Vercel API (alternativ, ohne Dashboard)
```bash
TOKEN="dein_vercel_auth_token"   # aus ~/.config/vercel/auth.json
PROJECT_ID="prj_XCd3fmED2FqS0QFsxomXizr1NqY3"
TEAM_ID="team_NedkExdSjzWBe3FCzHQL5nWy"

# Store erstellen
curl -X POST "https://api.vercel.com/v1/storage/stores/blob?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"bw-uploads","region":"iad1"}'

# Store mit Projekt verbinden
STORE_ID="store_NKKNQ6BO1IgaA1Au"
for ENV in production preview development; do
  curl -X POST "https://api.vercel.com/v1/storage/stores/$STORE_ID/connections?teamId=$TEAM_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"environment\":\"$ENV\"}"
done

# Token aus API holen und lokal eintragen
TOKEN_VALUE=$(curl -s "https://api.vercel.com/v9/projects/$PROJECT_ID/env?decrypt=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.envs[] | select(.key=="BLOB_READ_WRITE_TOKEN") | .value')
echo "BLOB_READ_WRITE_TOKEN=\"$TOKEN_VALUE\"" >> .env.local
```

### 7.3 Upload-Logik in der App
Die API-Route `src/app/api/documents/route.ts` arbeitet dreistufig:
1. `BLOB_READ_WRITE_TOKEN` vorhanden → `put()` via `@vercel/blob` (Produktion)
2. `process.env.VERCEL` gesetzt aber kein Token → `503` mit klarer Fehlermeldung
3. Lokal ohne Token → `public/uploads/` Fallback

```ts
import { put } from "@vercel/blob";

if (process.env.BLOB_READ_WRITE_TOKEN) {
  const blob = await put(filename, file, { access: "public" });
  filePath = blob.url;
} else if (process.env.VERCEL) {
  return NextResponse.json({ error: "Blob Store not configured" }, { status: 503 });
} else {
  // Lokaler Fallback
  filePath = `/uploads/${filename}`;
}
```

### 7.4 Datei-Löschen aus Blob Store
`src/app/api/files/items/route.ts` löscht auch aus dem Store beim DELETE:
```ts
import { del } from "@vercel/blob";

if (filePath.startsWith("https://")) {
  await del(filePath);
} else {
  fs.unlinkSync(localPath);
}
```

---

## 8. Deployment via CLI

### Einmalige Einrichtung
```bash
# Vercel CLI installieren (falls nicht vorhanden)
npm i -g vercel

# Login (öffnet Browser)
npx vercel login

# Projekt verlinken und deployen (erstes Mal)
npx vercel --prod --yes
```

### Regeldeployment via Git Push
```bash
git add .
git commit -m "Feat: neues Feature"
git push  # Vercel deployed automatisch wenn GitHub verbunden
```

### Manueller Prod-Deploy via CLI
```bash
npx vercel --prod --yes
```

### Logs eines Deployments prüfen
```bash
npx vercel inspect DEPLOYMENT_URL --logs
```

### Aktuellen Env-Stand lokal pullen (zum Debuggen)
```bash
npx vercel env pull .env.vercel.local
# WICHTIG: Die Datei danach sofort löschen!
rm .env.vercel.local
```

---

## 8. Fehler & Lösungen aus diesem Deployment

### Fehler 1: `npm install` schlägt fehl (ERESOLVE)
```
npm error peer react@"^19" from @react-three/drei@10.7.7
```
**Ursache:** `@react-three/drei@10` und `react-leaflet@5` benötigen React 19, Projekt nutzt React 18.  
**Lösung:** Pakete auf React-18-kompatible Versionen pinnen (siehe §4)

---

### Fehler 2: TypeScript Build schlägt fehl
```
Type 'RefObject<Mesh | null>' is not assignable to type 'Ref<Mesh>'
```
**Lösung:** `React.Ref<THREE.Mesh>` statt `React.RefObject<THREE.Mesh | null>`, und `useRef<THREE.Group>` für `<group>` Elemente.

---

### Fehler 3: `useSearchParams()` ohne Suspense
```
useSearchParams() should be wrapped in a suspense boundary at page "/auth/login"
```
**Lösung:** Seiteninhalt in separate Komponente auslagern + `<Suspense>` wrappen (siehe §3.5)

---

### Fehler 4: `prisma migrate deploy` schlägt fehl – `Can't reach localhost:5432`
```
Error: P1001: Can't reach database server at `localhost:5432`
```
**Ursache:** Vercel-Build nutzte die lokale `.env.local` DB-URL statt der Cloud-URL.  
**Ursache 2:** `DATABASE_URL` war in Vercel noch nicht als Env Var gesetzt.  
**Lösung:** Prisma Postgres Storage in Vercel anlegen + via **Connect Project** verknüpfen.

---

### Fehler 5: `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`
```
Failed to load config file prisma.config.ts
PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL.
```
**Ursache:** `prisma.config.ts` nutzte das strikte `env("DATABASE_URL")` → bricht beim `postinstall` ab bevor Vercel die Env Vars geladen hat.  
**Lösung:** In `prisma.config.ts` auf `process.env.DATABASE_URL ?? ""` umstellen.

---

### Fehler 6: `git push` schlägt mit Exit Code 128 fehl
```
git commit -m "..." → nothing to commit
```
**Ursache:** Das Commit war bereits erstellt worden, `git push` fehlte nur `--set-upstream`.  
**Lösung:** `git push -u origin main`

---

### Fehler 7: Ungültiger Projektname beim ersten Vercel-Deploy
```
Error: Project names must be lowercase. Cannot contain '---'
```
**Ursache:** Ordnername `BW-MANAGE-WEBTOOL` (Großbuchstaben) wurde als Projektname übernommen.  
**Lösung:** `npx vercel --prod --yes --name bw-manage-webtool`

---

### Fehler 8: FileBrowser-Ordner verschwinden nach Reload
**Ursache:** Ordner wurden in einer server-seitigen `Map` (In-Memory) gespeichert – geht bei jedem Serverless-Restart verloren.  
**Lösung:** Neues Prisma-Modell `FileFolder` angelegt, `src/app/api/files/folders/route.ts` komplett auf Prisma umgeschrieben. Default-Ordner werden per `seedDefaultFolders()` idempotent angelegt (zählt erst `fileFolder.count()` bevor geseedet wird).

---

### Fehler 9: Datei-Uploads gehen auf Vercel verloren
**Ursache:** Uploads wurden nach `public/uploads/` geschrieben – Vercel's Dateisystem ist read-only nach dem Build, `/tmp` wird nach jeder Invokation geleert.  
**Lösung:** `@vercel/blob` installiert, Upload-Route auf `put()` umgestellt. Lokal weiterhin `public/uploads/` als Fallback.

---

### Fehler 10: Migration P3018 – FK-Constraint schlägt fehl
```
Error: P3018 A migration failed to apply. New constraint failed: documents_fileBrowserFolderId_fkey
```
**Ursache:** In der Produktions-DB standen noch alte In-Memory-Ordner-IDs (z. B. `folder_abc123`) in `documents.fileBrowserFolderId`. Die neue FK-Constraint auf die `file_folders`-Tabelle konnte nicht angelegt werden, weil diese IDs dort nicht existieren.  
**Lösung (zweiteilig):**
1. Migration SQL idempotent gemacht:
```sql
-- Erst fehlerhafte Referenzen nullen
UPDATE "documents" SET "fileBrowserFolderId" = NULL
  WHERE "fileBrowserFolderId" IS NOT NULL
  AND "fileBrowserFolderId" NOT IN (SELECT "id" FROM "file_folders");

-- Tabelle nur anlegen wenn nicht vorhanden
CREATE TABLE IF NOT EXISTS "file_folders" (...);

-- FK nur anlegen wenn nicht vorhanden
DO $$ BEGIN
  ALTER TABLE "documents" ADD CONSTRAINT "documents_fileBrowserFolderId_fkey" ...;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```
2. `package.json` build-Script angepasst:
```json
"build": "prisma generate && prisma migrate resolve --rolled-back 20260314124236_add_file_folders 2>/dev/null; prisma migrate deploy && next build"
```
`--rolled-back` markiert eine fehlgeschlagene Migration zurück, damit `migrate deploy` sie erneut ausführen kann. `2>/dev/null` ignoriert den Fehler wenn die Migration noch gar nicht existiert.

---

### Fehler 11: 500-Fehler beim Upload ohne BLOB_READ_WRITE_TOKEN
**Ursache:** Auf Vercel fehlte `BLOB_READ_WRITE_TOKEN`, die Route versuchte `put()` aufzurufen und crashte mit unklarem 500.  
**Lösung:** Expliziter Check: wenn `process.env.VERCEL` gesetzt aber kein Token vorhanden → `503` mit Erklärung. Lokal (kein `VERCEL`-Flag) → stiller Fallback auf Disk.

---

### Fehler 12: 503 beim Upload in `vercel dev` (lokale Entwicklung)
```
Failed to load resource: the server responded with a status of 503
```
**Ursache:** `BLOB_READ_WRITE_TOKEN` war in Vercel nur für `production` und `preview` gesetzt – **nicht für `development`**. `vercel dev` setzt jedoch automatisch `VERCEL=1` im lokalen Prozess. Dadurch griff der `else if (process.env.VERCEL)`-Zweig → 503.  
**Diagnose:**
```bash
curl -s "https://api.vercel.com/v9/projects/PROJECT_ID/env?teamId=TEAM_ID" \
  -H "Authorization: Bearer TOKEN" | \
  python3 -c "import json,sys; [print(e['key'], e.get('target')) for e in json.load(sys.stdin).get('envs',[]) if 'BLOB' in e.get('key','')]"
# Ausgabe war: BLOB_READ_WRITE_TOKEN ['production', 'preview']  ← development fehlte!
```
**Lösung (dreiteilig):**
1. Token auch für `development` in Vercel hinzufügen:
```bash
printf "%s" "$BLOB_TOKEN" | npx vercel env add BLOB_READ_WRITE_TOKEN development --yes
```
2. `JWT_SECRET` + `JWT_EXPIRES_IN` ebenfalls für `development` setzen (gehen beim `env pull` verloren wenn sie nur in `production` waren):
```bash
printf "%s" "$(openssl rand -hex 64)" | npx vercel env add JWT_SECRET development --yes
printf "%s" "7d" | npx vercel env add JWT_EXPIRES_IN development --yes
```
3. `.env.local` neu synchronisieren:
```bash
npx vercel env pull .env.local --yes
# + JWT_SECRET und JWT_EXPIRES_IN manuell anhängen falls sie fehlen
```
**Merksatz:** Jeder Blob-/Auth-Token muss in **allen drei Environments** (`production`, `preview`, `development`) gesetzt sein.

---

## 9. Security-Checkliste

| Punkt | Status | Maßnahme |
|---|---|---|
| `.env.local` nie committen | ✅ | `.gitignore` enthält `.env*` |
| `.env.vercel.local` sofort löschen | ✅ | `rm .env.vercel.local` nach jedem `env pull` |
| `JWT_SECRET` rotieren | ⚠️ | Alter Secret war in Screenshot sichtbar → **sofort neu generieren** |
| DB-Passwort rotieren | ⚠️ | Alter PW war in Screenshot sichtbar → **sofort in DB ändern** |
| Starkes `JWT_SECRET` | ✅ | `openssl rand -hex 64` → 128 Zeichen Hex |
| Env Vars in Vercel verschlüsselt | ✅ | Vercel speichert als "Encrypted" |
| `.vercelignore` vorhanden | ✅ | Blockiert `.env*` beim Upload |
| SSL-Modus | ✅ | `sslmode=verify-full` statt `sslmode=require` |
| `BLOB_READ_WRITE_TOKEN` gesichert | ✅ | Nur in `.env.local` (gitignored) + Vercel Env Vars |
| Env Vars in **allen** Environments | ✅ | `production` + `preview` + `development` prüfen – `vercel dev` braucht alle drei! |

**Neuen JWT_SECRET generieren:**
```bash
openssl rand -hex 64
# Ausgabe in Vercel unter Settings → Environment Variables eintragen
```

---

## 10. Nach dem Deployment

### Migrationen auf Produktions-DB ausführen
```bash
npx vercel env pull .env.vercel.local
source .env.vercel.local   # oder: export DATABASE_URL="..."
npx prisma migrate deploy
rm .env.vercel.local
```

### Deployment-Logs prüfen
```bash
npx vercel inspect https://bw-manage-webtool.vercel.app --logs
# oder in Vercel Dashboard → Deployments → aktuelles Deployment → Logs
```

### Prisma Studio gegen Cloud-DB starten
```bash
npx vercel env pull .env.vercel.local
npx prisma studio  # öffnet Prisma Studio mit Cloud-DB
rm .env.vercel.local
```

### Blob Store Status prüfen
```bash
TOKEN="dein_vercel_auth_token"
curl "https://api.vercel.com/v1/storage/stores/store_NKKNQ6BO1IgaA1Au?teamId=team_NedkExdSjzWBe3FCzHQL5nWy" \
  -H "Authorization: Bearer $TOKEN" | jq '.store.status,.store.projects'
# Erwartet: "available" + ["bw-manage-webtool"]
```

### Env Vars auf alle Environments prüfen
```bash
curl -s "https://api.vercel.com/v9/projects/prj_XCd3fmED2FqS0QFsxomXizr1NqY3/env?teamId=team_NedkExdSjzWBe3FCzHQL5nWy" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import json,sys; [print(e['key'], e.get('target')) for e in json.load(sys.stdin).get('envs',[])]"
# Alle kritischen Vars müssen ['production','preview','development'] enthalten!
```

### Weitere Deployments
Nach dem ersten Deployment reicht für alle künftigen Updates:
```bash
git add .
git commit -m "Beschreibung"
git push  # Vercel deployed automatisch per GitHub-Webhook
```

---

## 11. Zusammenfassung aller Git-Commits

| Hash | Beschreibung |
|---|---|
| `d8a9af1` | First Commit (ursprünglicher Stand) |
| `7737207` | Fix React peer deps, Next suspense errors, Vercel Prisma build |
| `faae3ed` | Add Vercel ignore rules and project linkage hygiene |
| `b1829ce` | Fix prisma.config.ts: use process.env for DATABASE_URL (Vercel postinstall compat) |
| `d2517e0` | Fix A11y: id/name/htmlFor auf alle FileBrowser-Formularfelder |
| `4a830db` | Feat: Prisma FileFolder-Modell + @vercel/blob für persistente Ordner & Uploads |
| `54e229f` | Fix: Migration P3018 – UPDATE fileBrowserFolderId NULL + migrate resolve --rolled-back |
| `b5a243f` | Fix: IF NOT EXISTS + DO/EXCEPTION für idempotente Migration |
| `a291554` | Fix: 503 statt 500 wenn BLOB_READ_WRITE_TOKEN fehlt + VERCEL-Env-Check |
| —  | Fix: BLOB_READ_WRITE_TOKEN + JWT_SECRET/EXPIRES_IN für `development` Environment nachgetragen (kein Commit – nur Vercel Env Vars + .env.local) |

---

*Live: **https://bw-manage-webtool.vercel.app***
