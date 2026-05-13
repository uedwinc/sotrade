# SoTrade Architecture

## Product north star

SoTrade turns SoSoValue research signals into executable SoDEX testnet trades through two operating modes:

1. AI Copilot for analyst-style, on-demand decision support
2. Signal Rules Engine for automated event-driven execution

## Phase 1 architecture

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Custom presentation-grade UI

### Backend

- Next.js server routes for internal APIs
- Server-side integrations for SoSoValue and SoDEX
- Strict environment-based config validation

### Data flows

1. SoSoValue ingestion
2. Signal normalization
3. Copilot thesis generation
4. Risk sizing
5. SoDEX testnet order creation
6. Execution journal persistence

## Main domain modules

### `signals`

Responsibilities:

- ETF inflow adapters
- News/research feed adapters
- Macro event adapters
- Sector rotation models
- Unified scoring and normalization

### `copilot`

Responsibilities:

- Build market context from latest signals
- Generate a trade thesis
- Propose entries, stop-loss, and take-profit levels
- Explain confidence, invalidation, and timing

### `execution`

Responsibilities:

- Testnet-only environment enforcement
- SoDEX signing and nonce handling
- Order submission and status reconciliation
- Kill-switches and operator safeguards

### `rules`

Responsibilities:

- Human-readable rule builder
- Rule persistence
- Condition evaluation
- Trigger throttling
- Execution dispatch

### `journal`

Responsibilities:

- Save generated trade plans
- Save order submissions and fills
- Save rule trigger history
- Create audit-friendly timelines

## Guardrails

- Hard fail if `SODEX_ENV` is not `testnet`
- Hard fail if any configured SoDEX URL does not contain `testnet`
- No paper mode in this phase
- No mainnet toggle in UI

## Implementation roadmap

### Milestone 1

- Secure scaffold
- UI shell
- Codespaces setup

### Milestone 2

- SoSoValue API clients
- Signal normalization
- Sample live signal fetches
- Normalized `/api/signals` endpoint

### Milestone 3

- Copilot generation endpoint
- Structured thesis response
- Trade-plan cards

### Milestone 4

- SoDEX signing service
- Testnet order placement
- Execution confirmations

### Milestone 5

- Rules engine persistence
- Scheduler/evaluator
- Auto-triggered testnet trades
