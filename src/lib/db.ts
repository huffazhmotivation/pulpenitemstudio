import "server-only";
import { QueryBuilder } from "@/lib/d1/query";
import { storageFrom } from "@/lib/d1/storage";

export { escapeLike } from "@/lib/d1/query";

/**
 * Data access for the whole app (Cloudflare D1 + R2). There is no Row Level
 * Security any more, so rules live in code: public pages go through
 * src/lib/queries.ts (which only returns published fonts and strips master
 * files), and every write goes through a Server Action / Route Handler that
 * calls requireAdmin() first (src/lib/auth.ts).
 */
export interface Db {
  from(table: string): QueryBuilder;
  storage: { from: typeof storageFrom };
}

const db: Db = {
  from: (table) => new QueryBuilder(table),
  storage: { from: storageFrom },
};

export async function createClient(): Promise<Db> {
  return db;
}

export async function createAdminClient(): Promise<Db> {
  return db;
}
