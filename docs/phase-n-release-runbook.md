# ShikshaSahayak 2.0 Production Release Runbook

This document details pre-release verification steps, Cloudflare Pages deployment commands, and rollback procedures.

---

## 🚀 Pre-Release Verification Protocol

1. **Local Compilation Check**:
   ```bash
   npm run build
   ```
2. **Automated Audit Suite Pass**:
   ```bash
   npm run platform:audit && npm run platform:verify
   npm run teacher:audit && npm run teacher:verify
   npm run assessment:audit && npm run assessment:verify
   npm run ai:audit && npm run ai:verify
   npm run pwa:audit && npm run pwa:verify
   npm run notifications:audit && npm run notifications:verify
   npm run monetization:audit && npm run monetization:verify
   npm run launch:audit && npm run launch:verify
   ```
3. **Cloudflare Deployment**:
   ```bash
   npx wrangler pages deploy dist --project-name=padhakuportal
   ```
4. **Cache Purge Procedure**:
   Purge Cloudflare Edge CDN cache via dashboard or automated script (`scripts/purge-cache.js`).

---

# ROLLBACK PROCEDURE
If a P0 incident occurs post-deployment, trigger instant Cloudflare Pages rollback to the previous deployment ID via dashboard in < 60 seconds.
