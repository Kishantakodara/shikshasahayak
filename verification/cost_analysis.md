# TASK 9 — MONTHLY INFRASTRUCTURE COST ANALYSIS
| Cloudflare Service | Included Free Tier / Quota | Estimated Usage (100k MAU) | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Cloudflare Workers / Pages** | 10M Requests / Mo | 15M Requests | $5.00 / Mo (Workers Paid Plan) |
| **Cloudflare D1 Databases** | 5GB Storage, 25M Reads / Day | 1.2GB Storage, 2M Reads / Day | $0.00 / Mo (Within Tier) |
| **Cloudflare R2 Object Storage** | 10GB Storage, 1M Class A Operations | 42.8GB Storage, 120k Ops | $0.49 / Mo |
| **Cloudflare KV & Caching** | 1GB Storage, 100k Writes / Day | 250MB Storage | $0.00 / Mo |
| **Gemini AI API Edge Proxy** | Free Tier / Pay-as-you-go | 300k Tokens / Month | $10.00 / Mo |
| **TOTAL ESTIMATED MONTHLY COST** | — | — | **~$15.49 / Month** |

*Optimization Tip:* Enable edge CDN caching on static PYQ PDFs to maintain zero R2 egress bandwidth charges.
