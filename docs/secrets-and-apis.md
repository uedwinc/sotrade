# SoTrade Secrets And API Guide

This document tells you exactly what you need to obtain, where to get it, and where each value belongs.

## 1. SoSoValue API key

Purpose:

- Read ETF inflows
- Read research/news feeds
- Pull signal inputs for the Copilot and Rules Engine

Where to get it:

- Go to [SoSoValue Developer Dashboard](https://sosovalue.com/developer/dashboard)
- Create or log in to your SoSoValue account
- Apply for an API key from the dashboard
- Wait for approval if required

Where to place it:

```env
SOSOVALUE_API_KEY=your_key_here
```

Base URL currently configured:

```env
SOSOVALUE_API_BASE_URL=https://api.sosovalue.xyz
```

## 2. SoDEX testnet trading credentials

Purpose:

- Sign authenticated SoDEX testnet orders
- Connect the app to your SoDEX testnet account
- Execute live orders on testnet only

What you need:

- A SoDEX testnet account
- Your SoDEX `accountID`
- An API wallet address for signing
- The corresponding private key for that API wallet

Important:

- Do not use a mainnet wallet.
- Use a dedicated testnet signing wallet only.
- Never commit the private key to GitHub.

Where to get started:

- Review the SoDEX developer docs: [Overview](https://sodex.com/documentation/api/api)
- Review REST endpoints: [REST API v1](https://sodex.com/documentation/api/rest-v1)
- Review WebSocket endpoints: [WebSocket API v1](https://sodex.com/documentation/api/websocket-v1)
- If your testnet access is not active yet, review the testnet access note: [Why Join the SoDEX Testnet?](https://sodex-support.zendesk.com/hc/en-us/articles/13036653314959-Why-Join-the-SoDEX-Testnet)

Where to place the values:

```env
SODEX_ENV=testnet
SODEX_SPOT_REST_URL=https://testnet-gw.sodex.dev/api/v1/spot
SODEX_PERPS_REST_URL=https://testnet-gw.sodex.dev/api/v1/perps
SODEX_SPOT_WS_URL=wss://testnet-gw.sodex.dev/ws/spot
SODEX_PERPS_WS_URL=wss://testnet-gw.sodex.dev/ws/perps
SODEX_ACCOUNT_ID=your_account_id_here
SODEX_API_WALLET_ADDRESS=0xyourtestnetsigner
SODEX_PRIVATE_KEY=your_private_key_here
```

## 3. Database URL

Purpose:

- Persist user rules
- Store execution history
- Save copilot-generated trade plans
- Keep a journal and audit trail

Recommended first choice:

- Neon Postgres or Supabase Postgres

Where to place it:

```env
DATABASE_URL=postgresql://username:password@host:5432/dbname
```

## 4. App secret

Purpose:

- Session signing
- Secure server-side authentication flows later in the project

Where to place it:

```env
NEXTAUTH_SECRET=generate_a_long_random_secret
```

Recommended way to generate it in Codespaces later:

- Use a long random string of at least 32 characters

## 5. Rules for handling secrets

- Only store real secrets in `.env.local`
- Never paste secrets into source files
- Never log full private keys, authorization headers, or raw signed requests
- Use a dedicated testnet wallet with minimal privileges
- Rotate any key immediately if it is accidentally exposed
