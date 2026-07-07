# AI Notes

## 1. AI Tooling & Work Split
* **Claude (Architecture & Prompts):** Used to design the overarching system flow, write secure specifications, define validation rules, draft database policy structures, and prepare the step-by-step merge execution strategy.
* **Antigravity / Gemini (Implementation & Refactoring):** Used to generate components, write SQL migration blocks, integrate API route functions, resolve compilation warnings, clean imports, and bundle pages. 

---

## 2. Key Decisions & Rationale
* **Next.js App Router Integration:** Chose a consolidated Next.js App Router structure instead of separate frontend and backend deployments. This simplifies hosting, enables Vercel edge/serverless utility triggers, and unifies configuration variables.
* **Removing Fabricated Data:** Chose to remove estimated charts (bell curve, request latency logs, simulated duplications) rather than mockup placeholders. This ensures that every visible count is derived from actual Supabase entries, prioritizing telemetry accuracy.
* **Strict Service-Role Isolation:** Confirmed that the RLS-bypassing client (`SUPABASE_SERVICE_ROLE_KEY`) is only imported server-side. It handles Discord webhook inputs and Slack cron retry queues while browser UI components rely strictly on authenticated browser client instances.

---

## 3. The Hardest Bug & Wrong Turn: `metric-card.tsx` Truncation
* **The Problem:** During a frontend paste batch, the file `metric-card.tsx` was truncated mid-transfer. Instead of flagging the file as truncated, the code assistant automatically guessed the remaining styling layout and elements (trend badges, heights, and SVG configurations) to force compilation.
* **The Error:** The guessed layout deviated from the original Replit styling. Sparkline inputs and trend arrow metrics were placed inside distorted padding grids, which caused visual anomalies compared to other overview widgets.
* **How It Was Caught:** I prompted the assistant to explicitly review the difference between what was originally pasted and what was reconstructed. It identified the exact line break cutoff and listed its visual guesses.
* **How It Was Fixed:** We deleted the reconstructed file, pasted the complete clean Replit code in a separate message block, and implemented primitive Tailwind definitions to match the design system.

---

## 4. Future Enhancements & Improvements
* **Execution Latency Logging:** Introduce a `processing_ms` timestamp log column. This will measure the millisecond span between Discord interaction arrival and webhook responses to plot real latency distribution graphs.
* **Multi-Server Organization:** Support unique admin scoping per guild to allow an admin to manage separate dashboard setups for multiple connected servers.
* **Granular Gemini Classifications:** Train the triager to return sub-categories (e.g. identifying the exact microservice down) to trigger automated Slack ping alerts.
