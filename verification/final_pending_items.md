# FINAL PENDING DEPLOYMENT ITEMS
Before executing Phase F Final Production Validation, complete these 3 setup steps:

1. Execute `npx wrangler secret put GEMINI_API_KEY` to set Gemini API key.
2. Execute `npx wrangler secret put R2_ACCESS_KEY` and `R2_SECRET_KEY` for production object storage.
3. Deploy to production via `npx wrangler pages deploy dist`.
