# SoTrade Setup Guide For GitHub Codespaces

This guide is intentionally detailed. Follow it in order and you will have a clean, secure setup for the first working milestone.

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
- `SODEX_ACCOUNT_ID`
- `SODEX_API_WALLET_ADDRESS`
- `SODEX_PRIVATE_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

If you do not yet have the final database provider chosen, keep `DATABASE_URL` empty for now. The UI shell will still be usable.

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

## 8. What comes next after milestone 1 passes

Once the shell is running correctly, the next implementation slice should be:

1. SoSoValue server-side data clients
2. Normalized signal models
3. Copilot thesis API route
4. Testnet-only SoDEX execution service

## 9. Safety checklist

Before every push:

- Confirm `.env.local` is not staged
- Confirm no log file includes keys or raw signed payloads
- Confirm every SoDEX endpoint still points to `testnet-gw.sodex.dev`
- Confirm you have not added any mainnet toggle to the UI
