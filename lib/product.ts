export const navItems = [
  { href: "/", label: "Overview" },
  { href: "/copilot", label: "AI Copilot" },
  { href: "/rules", label: "Rules Engine" },
  { href: "/journal", label: "Journal" }
];

export const overviewMetrics = [
  {
    label: "Signal Coverage",
    value: "ETF + News + Macro",
    detail: "SoSoValue-backed market context for every execution path."
  },
  {
    label: "Execution Surface",
    value: "SoDEX Testnet",
    detail: "Hard-locked to testnet endpoints and signing flow."
  },
  {
    label: "Copilot Output",
    value: "Entry / TP / SL",
    detail: "Actionable trade plans instead of abstract summaries."
  }
];

export const copilotSteps = [
  "Pull the latest SoSoValue ETF, research, news, and macro signals",
  "Synthesize a trading thesis with confirmation and invalidation logic",
  "Propose entries, take-profit ladders, stop-loss, and sizing",
  "Submit directly to SoDEX testnet and log the decision in the journal"
];

export const sampleRules = [
  {
    name: "BTC ETF Momentum",
    trigger: "BTC ETF inflow > $200M for 3 straight days",
    action: "Open BTC long on SoDEX testnet with fixed 10% risk budget"
  },
  {
    name: "Sector Rotation Catch",
    trigger: "L1 sector leadership flips positive while BTC sentiment is neutral+",
    action: "Buy top-ranked L1 basket proxy with staged take-profit levels"
  },
  {
    name: "Macro Shock Defense",
    trigger: "Macro news category turns risk-off and BTC net inflow weakens",
    action: "Reduce exposure by placing protective closing orders"
  }
];

export const journalEvents = [
  {
    time: "08:15 UTC",
    title: "Signal bundle assembled",
    detail: "ETF, sentiment, sector, and macro streams normalized for thesis generation."
  },
  {
    time: "08:17 UTC",
    title: "Copilot trade plan drafted",
    detail: "BTC long continuation plan with laddered take-profit targets and invalidation."
  },
  {
    time: "08:18 UTC",
    title: "Execution ready",
    detail: "Trade packet prepared for SoDEX testnet signing and journal persistence."
  }
];
