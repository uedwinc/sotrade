import { Pool } from "pg";

import { getDatabaseUrl } from "@/lib/config";

declare global {
  // eslint-disable-next-line no-var
  var sotradePgPool: Pool | undefined;
}

function shouldUseSsl(databaseUrl: string) {
  return !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");
}

export function getPgPool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  if (!globalThis.sotradePgPool) {
    globalThis.sotradePgPool = new Pool({
      connectionString: databaseUrl,
      ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined
    });
  }

  return globalThis.sotradePgPool;
}
