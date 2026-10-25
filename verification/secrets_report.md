# PRODUCTION SECRETS REPORT
Verified via `npx wrangler pages secret list --project-name=padhakuportal`:
- `VITE_FIREBASE_API_KEY`: Configured (Encrypted)
- `VITE_FIREBASE_APP_ID`: Configured (Encrypted)
- `VITE_GEMINI_API_KEY`: Configured (Encrypted)
- `VITE_NVIDIA_NIM_API_KEY`: Configured (Encrypted)

Unconfigured / Pending Items:
- `SMTP_USERNAME` / `SMTP_PASSWORD`: NOT VERIFIED (Missing production SMTP credentials; email notifications fall back to local token verification).
