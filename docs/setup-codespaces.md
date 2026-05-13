# SoTrade Setup Guide For GitHub Codespaces

This guide is intentionally detailed. Follow it in order and you will have a clean, secure setup for the current SoTrade milestone stack.

## 1. Push this repository to GitHub

Create a new GitHub repository and push the current codebase to it.

Recommended repository settings:

- Keep the repository private until you are comfortable with the code and docs.
- Enable branch protection later when you begin collaborating.
- Do not add secrets directly to files in the repository.

## 2. Open the project in GitHub Codespaces

From the GitHub repository page:

1. Click `Code`
2. Click `Codespaces`
3. Click `Create codespace on main`

Codespaces should detect the `.devcontainer/devcontainer.json` file and provision a Node.js environment for you.

## 3. Install dependencies in Codespaces

Open the integrated terminal in Codespaces and run:

```bash
corepack enable
pnpm install
```

You only need to do this once per fresh Codespace unless you delete the environment.

## 4. Create your environment file

Copy `.env.example` to `.env.local`.

In Codespaces, you can do this from the file explorer:

- Duplicate `.env.example`
- Rename the duplicate to `.env.local`

Do not commit `.env.local`. The `.gitignore` already prevents that.

## 5. Fill in the minimum required values

At the start, focus on:

- `SOSOVALUE_API_KEY`
- `SOSOVALUE_OPENAPI_BASE_URL`
- `SOSOVALUE_BTC_CURRENCY_ID`
- `AWS_REGION`
- `BEDROCK_MODEL_ID`
- `SODEX_ACCOUNT_ID`
- `SODEX_API_KEY_NAME` if SoDEX assigned a distinct API key name
- `SODEX_API_WALLET_ADDRESS`
- `SODEX_PRIVATE_KEY`
- `DATABASE_URL` if you want Copilot and execution persistence

Values you can safely leave blank for now:

- `DATABASE_URL` if you do not want persistence yet
- `NEXTAUTH_SECRET` because authentication is not wired in this milestone

If you do not yet have the final database provider chosen, keep `DATABASE_URL` empty for now. Copilot generation and SoDEX testnet execution preview will still work.

For Milestone 3, Bedrock credentials can be provided in either of these ways:

- IAM role / SSO style AWS credentials available to the Codespace runtime
- Standard environment credentials such as `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optional `AWS_SESSION_TOKEN`

## 6. Start the app

In Codespaces:

```bash
pnpm dev
```

Then open the forwarded port for `3000`.

You should see:

- Landing dashboard
- Copilot workspace
- Rules workspace
- Journal view

## 7. What to test in milestone 1

For this first milestone, test only:

- The app starts without TypeScript or Next.js configuration issues
- Navigation across the four app surfaces works
- The visual system looks polished on desktop and mobile
- No secret values are hard-coded anywhere in the repo

## 8. What to test in milestone 2

After you add a valid `SOSOVALUE_API_KEY`, verify:

- `GET /api/signals` returns a JSON signal bundle
- The overview page shows a live signal snapshot instead of only static placeholder language
- The response status is `ok` or `partial`, not `not_configured`
- BTC ETF flow and market news entries include recent timestamps

If the response errors:

- Recheck the SoSoValue API key
- Recheck `SOSOVALUE_OPENAPI_BASE_URL`
- Recheck outbound network access from your Codespace

## 9. What to test in milestone 3

After Milestone 2 is healthy and Bedrock access is configured, verify:

- The `/copilot` page shows the structured BTC workspace
- You can switch between `Intraday / 1h-1d`, `Swing / 1-7d`, and `Position / 1w-4w`
- You can input account equity and max risk %
- Clicking `Generate BTC trade plan` returns either:
  - a concrete BTC trade plan with entry / stop / take profits, or
  - a clean no-trade decision with rationale
- `POST /api/copilot/thesis` returns structured JSON
- If `DATABASE_URL` is configured and reachable, persistence status becomes `saved`
- If `DATABASE_URL` is empty, persistence status becomes `skipped` without breaking generation

If Copilot generation fails:

- Recheck `AWS_REGION`
- Recheck `BEDROCK_MODEL_ID`
- Recheck that your AWS credentials in Codespaces can access Amazon Bedrock runtime
- Recheck that the chosen model is enabled for your account and region

## 10. What to test in milestone 4

After Copilot generation is healthy and your SoDEX testnet credentials are configured, verify:

- The `/copilot` page exposes the SoDEX execution section once a plan is actionable
- `POST /api/execution/preview` returns a normalized testnet order packet preview
- Preview shows entry, take-profit, stop-loss, account, and symbol details
- `POST /api/execution/submit` returns a signed SoDEX testnet submission result
- If `DATABASE_URL` is configured and reachable, execution persistence returns `saved`
- If `DATABASE_URL` is empty, execution still works and persistence returns `skipped`
- `/journal` only shows real activity after persistence is enabled; trades submitted while persistence is skipped cannot be backfilled there yet

If execution preview or submission fails:

- Recheck `SODEX_ACCOUNT_ID`
- Recheck `SODEX_API_KEY_NAME` if your SoDEX API key name differs from the signer address
- Recheck `SODEX_API_WALLET_ADDRESS`
- Recheck `SODEX_PRIVATE_KEY`
- Recheck that every configured SoDEX endpoint still points to `testnet-gw.sodex.dev`

## 11. What comes next after milestone 4 passes

The next implementation slice should be:

1. Rules engine persistence
2. Rule evaluation and scheduling
3. Auto-triggered testnet trades
4. Journal review and operator controls

## 12. Safety checklist

Before every push:

- Confirm `.env.local` is not staged
- Confirm no log file includes keys or raw signed payloads
- Confirm every SoDEX endpoint still points to `testnet-gw.sodex.dev`
- Confirm you have not added any mainnet toggle to the UI
