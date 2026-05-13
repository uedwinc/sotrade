# SoTrade

SoTrade is a SoSoValue-powered signal-to-trade execution app for SoDEX testnet. It combines two flows:

1. AI Copilot: research synthesis into actionable trade plans with entry, take-profit, stop-loss, and risk sizing.
2. Signal Rules Engine: no-code rule definitions that trigger live testnet orders when SoSoValue conditions are met.

This repository is intentionally scaffolded for step-by-step delivery. The first milestone gives you:

- A polished Next.js app shell ready for GitHub Codespaces
- Testnet-only guardrails for SoDEX integrations
- Secure env handling and repo hygiene
- Detailed setup and secrets guidance
- Product architecture docs for the next implementation slices

Milestone 2 adds:

- Server-side SoSoValue ingestion for ETF flow and featured news feeds
- Normalized signal bundle generation for the app
- A live `/api/signals` endpoint for Codespaces verification
- Overview UI panels that surface the current signal snapshot

Milestone 3 adds:

- A structured BTC Copilot workspace on `/copilot`
- `POST /api/copilot/thesis` for Bedrock-powered trade-plan generation
- Coinbase BTC price anchoring for entry / TP / SL proposals
- Optional Postgres persistence for generated Copilot plans

## Core principles

- Testnet only. No mainnet execution is allowed in this codebase at this stage.
- No secrets committed to GitHub.
- Build in slices, test each slice in Codespaces, then move forward.

## App surfaces

- `/` Overview and execution cockpit
- `/copilot` AI trade thesis workspace
- `/rules` No-code signal rules engine
- `/journal` Execution journal and operational timeline
- `/api/signals` Normalized live SoSoValue signal snapshot
- `/api/copilot/thesis` Bedrock-powered BTC thesis and trade-plan generation

## Local setup

Read the following docs in order:

1. [docs/setup-codespaces.md](docs/setup-codespaces.md)
2. [docs/secrets-and-apis.md](docs/secrets-and-apis.md)
3. [docs/architecture.md](docs/architecture.md)

## Suggested milestone sequence

1. Foundation and UI shell
2. SoSoValue data ingestion layer
3. AI Copilot thesis generation flow
4. SoDEX testnet order signing and execution
5. Rules engine evaluation loop
6. Trade journal, audit trail, and operator controls
7. Hardening, testing, and demo prep
