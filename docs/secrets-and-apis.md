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

Base URLs currently configured:

```env
SOSOVALUE_API_BASE_URL=https://api.sosovalue.xyz
SOSOVALUE_OPENAPI_BASE_URL=https://openapi.sosovalue.com
```

Optional but recommended for the current BTC-focused news snapshot:

```env
SOSOVALUE_BTC_CURRENCY_ID=1673723677362319866
```

Note:

- The default `BTC` currency ID above is taken from SoSoValue's official news endpoint example.
- If SoSoValue gives you a different BTC currency ID later, replace it in `.env.local`.

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

## 5. Amazon Bedrock configuration

Purpose:

- Run the SoTrade AI Copilot with Claude Sonnet 4.6 on Amazon Bedrock

Required values:

```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-6
```

Authentication options:

- Preferred: IAM role / SSO credentials available to the Codespace runtime
- Alternative: standard AWS environment credentials

If you use environment credentials, place them in `.env.local` or Codespaces secrets:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SESSION_TOKEN=your_optional_session_token
```

Important:

- The model ID above is the official Bedrock programmatic model ID for Claude Sonnet 4.6.
- Your AWS account and region must have Bedrock runtime access for this model.
- If your account uses a different approved inference profile or regional routing ID later, update `BEDROCK_MODEL_ID`.

## 6. Coinbase public price anchor

Purpose:

- Anchor BTC entry / stop / take-profit levels to a current market spot price

Current source:

- Coinbase public spot price endpoint for `BTC-USD`

No secret is required for this source in the current milestone.

## 7. Rules for handling secrets

- Only store real secrets in `.env.local`
- Never paste secrets into source files
- Never log full private keys, authorization headers, or raw signed requests
- Use a dedicated testnet wallet with minimal privileges
- Rotate any key immediately if it is accidentally exposed
