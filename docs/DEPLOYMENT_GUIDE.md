# ShikshaSahayak OS — Deployment Guide

**Version**: 1.0 | **Sprint**: 10 | **Last Updated**: 2026-08-04

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.x | Runtime |
| npm | 10.x | Package manager |
| Wrangler CLI | 4.x | Cloudflare deployment |
| Git | 2.x | Source control |

---

## Environment Variables

### Required Cloudflare Worker Secrets
Set these in the **Cloudflare dashboard → Pages → Settings → Environment variables**:

| Secret | Where to Get | Used By |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings | JWT verification in `auth.ts` |
| `GEMINI_API_KEY` | Google AI Studio | Server-side AI calls (NOT in frontend) |

### Local Development (`.env.local`)
```bash
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

> ⚠️ Never commit `.env`, `.env.local`, or actual keys to Git.

---

## Local Development

```bash
# Install dependencies
npm ci

# Start Vite dev server (frontend only)
npm run dev

# Start with Cloudflare Workers API (requires build first)
npm run build
npm run dev:api
```

---

## Database Migration Runbook

### Initial Setup (first time only)
```bash
# Apply all migrations to LOCAL DB
npm run db:migrate:local

# Apply all migrations to REMOTE D1 (production)
# ⚠️ Requires explicit user permission before running
npm run db:migrate:remote

# Apply Assessment DB migrations
npm run db:assessment:migrate:local
npm run db:assessment:migrate:remote
```

### Adding a New Migration
1. Create `migrations/NNN_description.sql` with `IF NOT EXISTS` guards
2. Use only `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `INSERT OR IGNORE`
3. **Never use** `DROP TABLE`, `TRUNCATE`, or destructive DDL
4. Test locally: `npm run db:migrate:local`
5. Get explicit approval before running remote

### Migration Files (Complete List)
| Range | Description |
|---|---|
| 001–014 | Initial schema: branches, materials, documents, blogs |
| 015–020 | Architecture Registry, Content Engine, Search |
| 021–036 | Master Integration, Security, Performance, Analytics |
| 037–038 | Phase 2 Sprints 1–3: Identity, Personalization |
| 039–041 | Phase 2 Sprints 4–6: Study Materials, Assessment, Teacher |
| 042–044 | Phase 2 Sprints 7–9: Admin, AI Intelligence, Performance |

---

## Production Deployment

> ⚠️ **Per AGENTS.md**: Do NOT deploy without explicit permission from the platform owner.

```bash
# Step 1: Build and validate
npm run build

# Step 2: Deploy (only after explicit approval)
npm run deploy
# Equivalent to: wrangler pages deploy dist --project-name=padhakuportal --branch main
```

---

## Rollback Procedure

### Frontend Rollback
1. Go to **Cloudflare Dashboard → Pages → Deployments**
2. Find the last known-good deployment
3. Click **"Rollback to this deployment"**

### Database Rollback
> D1 does not support automatic schema rollback. All migrations are **strictly additive** by design. To undo a migration:
1. Write a new forward migration that removes only the added objects
2. Get explicit approval
3. Apply: `npm run db:migrate:remote`

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on:
- **Pull Requests** → TypeScript check + production build
- **Push to main** → TypeScript check + production build + artifact upload

No automated deployment is triggered. All production deployments are manual.

---

## Cloudflare Bindings Reference

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 Database | Primary application data |
| `ASSESSMENT_DB` | D1 Database | Quiz and assessment data |
| `MATERIALS_BUCKET` | R2 Storage | PDF and file storage |
