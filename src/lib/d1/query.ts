import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * A small, dependency-free query builder over Cloudflare D1 whose surface
 * mirrors the subset of supabase-js the app already uses (from/select/
 * insert/update/upsert/delete, eq/neq/in/not/or filters, order/limit,
 * single/maybeSingle, count/head, and PostgREST-style embedded selects like
 * `category:categories(*)`). It keeps every call site readable and lets the
 * storefront and admin run on Cloudflare's free tier with no external DB.
 *
 * All identifiers are validated against a whitelist / `\w+` pattern and all
 * values are bound parameters, so nothing user-supplied is ever interpolated
 * into SQL text.
 */

type Row = Record<string, any>;
type Cond = { sql: string; params: unknown[] };
export type QueryResult = { data: any; error: { message: string; code?: string } | null; count?: number | null };

interface TableMeta {
  json?: string[];
  bool?: string[];
  updatedAt?: boolean;
  intId?: boolean;
}

const TABLES: Record<string, TableMeta> = {
  admin_profiles: {},
  categories: {},
  licenses: {},
  fonts: {
    json: ["tags", "language_support", "font_features"],
    bool: ["is_on_sale", "is_featured", "is_new"],
    updatedAt: true,
  },
  font_styles: { bool: ["is_italic"] },
  font_files: {},
  font_images: {},
  license_prices: {},
  site_settings: { intId: true },
  homepage_settings: { intId: true },
  hero_images: {},
};

const REL: Record<string, Record<string, { kind: "one" | "many"; fk: string }>> = {
  fonts: {
    categories: { kind: "one", fk: "category_id" },
    font_styles: { kind: "many", fk: "font_id" },
    font_files: { kind: "many", fk: "font_id" },
    font_images: { kind: "many", fk: "font_id" },
    license_prices: { kind: "many", fk: "font_id" },
  },
  license_prices: {
    licenses: { kind: "one", fk: "license_id" },
  },
  font_images: {
    fonts: { kind: "one", fk: "font_id" },
  },
};

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_PARAMS = 90; // D1 allows 100 bound parameters per statement

function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return name;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function bindable(v: unknown): unknown {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
}

function serialize(table: string, row: Row): Row {
  const meta = TABLES[table];
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue;
    ident(k);
    out[k] = meta.json?.includes(k) && Array.isArray(v) ? JSON.stringify(v) : bindable(v);
  }
  return out;
}

function deserialize(table: string, row: Row): Row {
  const meta = TABLES[table];
  const out: Row = { ...row };
  for (const k of meta.json ?? []) {
    if (k in out) {
      try {
        out[k] = out[k] ? JSON.parse(out[k]) : [];
      } catch {
        out[k] = [];
      }
    }
  }
  for (const k of meta.bool ?? []) {
    if (k in out) out[k] = Boolean(out[k]);
  }
  return out;
}

// ---------------------------------------------------------------------
// select-string parsing ("*, styles:font_styles(*), license_prices(*, license:licenses(*))")
// ---------------------------------------------------------------------

interface SelNode {
  cols: string[];
  star: boolean;
  embeds: { alias: string; target: string; sub: SelNode }[];
}

function splitTop(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(" || ch === "{") depth++;
    if (ch === ")" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function parseSelect(s: string): SelNode {
  const node: SelNode = { cols: [], star: false, embeds: [] };
  for (const raw of splitTop(s)) {
    const t = raw.trim();
    if (!t) continue;
    const m = t.match(/^(?:(\w+):)?(\w+)(?:![a-z]+)?\(([\s\S]*)\)$/);
    if (m) node.embeds.push({ alias: m[1] ?? m[2], target: m[2], sub: parseSelect(m[3]) });
    else if (t === "*") node.star = true;
    else node.cols.push(ident(t));
  }
  if (!node.star && node.cols.length === 0 && node.embeds.length === 0) node.star = true;
  return node;
}

// ---------------------------------------------------------------------
// D1 access
// ---------------------------------------------------------------------

export async function getD1(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is not configured (see wrangler.toml).");
  return env.DB;
}

async function fetchChildren(db: D1Database, table: string, col: string, keys: string[]): Promise<Row[]> {
  const rows: Row[] = [];
  for (const part of chunk(keys, MAX_PARAMS)) {
    const marks = part.map(() => "?").join(",");
    const res = await db
      .prepare(`SELECT * FROM ${ident(table)} WHERE ${ident(col)} IN (${marks}) ORDER BY rowid`)
      .bind(...part)
      .all<Row>();
    rows.push(...(res.results ?? []));
  }
  return rows.map((r) => deserialize(table, r));
}

async function hydrate(db: D1Database, table: string, rows: Row[], node: SelNode): Promise<Row[]> {
  for (const emb of node.embeds) {
    const rel = REL[table]?.[emb.target];
    if (!rel) throw new Error(`No relation from ${table} to ${emb.target}`);
    if (rel.kind === "many") {
      const ids = rows.map((r) => r.id).filter(Boolean);
      const raw = ids.length ? await fetchChildren(db, emb.target, rel.fk, ids) : [];
      const shaped = await hydrate(db, emb.target, raw.map((r) => ({ ...r })), emb.sub);
      const byParent = new Map<string, Row[]>();
      raw.forEach((r, i) => {
        const list = byParent.get(r[rel.fk]) ?? [];
        list.push(shaped[i]);
        byParent.set(r[rel.fk], list);
      });
      for (const r of rows) r[emb.alias] = byParent.get(r.id) ?? [];
    } else {
      const keys = Array.from(new Set(rows.map((r) => r[rel.fk]).filter(Boolean)));
      const parents = keys.length ? await fetchChildren(db, emb.target, "id", keys) : [];
      const shaped = await hydrate(db, emb.target, parents.map((p) => ({ ...p })), emb.sub);
      const byId = new Map<string, Row>();
      parents.forEach((p, i) => byId.set(p.id, shaped[i]));
      for (const r of rows) r[emb.alias] = r[rel.fk] ? byId.get(r[rel.fk]) ?? null : null;
    }
  }
  const aliases = node.embeds.map((e) => e.alias);
  return rows.map((r) => {
    if (node.star) return r;
    const out: Row = {};
    for (const c of node.cols) out[c] = r[c];
    for (const a of aliases) out[a] = r[a];
    return out;
  });
}

// ---------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------

function cond(col: string, op: string, val: unknown): Cond {
  const c = ident(col);
  switch (op) {
    case "eq":
      return val === null ? { sql: `${c} IS NULL`, params: [] } : { sql: `${c} = ?`, params: [bindable(val)] };
    case "neq":
      return val === null ? { sql: `${c} IS NOT NULL`, params: [] } : { sql: `${c} <> ?`, params: [bindable(val)] };
    case "gt":
      return { sql: `${c} > ?`, params: [bindable(val)] };
    case "gte":
      return { sql: `${c} >= ?`, params: [bindable(val)] };
    case "lt":
      return { sql: `${c} < ?`, params: [bindable(val)] };
    case "lte":
      return { sql: `${c} <= ?`, params: [bindable(val)] };
    case "like":
    case "ilike":
      return { sql: `${c} LIKE ? ESCAPE '\\'`, params: [String(val)] };
    case "is": {
      if (val === null || val === "null") return { sql: `${c} IS NULL`, params: [] };
      return { sql: `${c} = ?`, params: [val === true || val === "true" ? 1 : 0] };
    }
    case "cs": {
      const v = String(val).replace(/^\{|\}$/g, "");
      return { sql: `EXISTS (SELECT 1 FROM json_each(${c}) WHERE value = ?)`, params: [v] };
    }
    default:
      throw new Error(`Unsupported filter operator: ${op}`);
  }
}

function parseOr(expr: string): Cond {
  const parts = splitTop(expr).map((p) => {
    const i = p.indexOf(".");
    const j = p.indexOf(".", i + 1);
    if (i < 0 || j < 0) throw new Error(`Bad or() filter: ${p}`);
    const col = p.slice(0, i);
    const op = p.slice(i + 1, j);
    const raw = p.slice(j + 1);
    return cond(col, op, raw === "null" ? null : raw);
  });
  return { sql: `(${parts.map((p) => p.sql).join(" OR ")})`, params: parts.flatMap((p) => p.params) };
}

/** Escape LIKE wildcards in user text, for use with `%${escapeLike(q)}%`. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

// ---------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------

type Op = "select" | "insert" | "update" | "delete" | "upsert";

export class QueryBuilder implements PromiseLike<QueryResult> {
  private op: Op = "select";
  private selectStr = "*";
  private wantCount = false;
  private headOnly = false;
  private conds: Cond[] = [];
  private orders: string[] = [];
  private lim: number | null = null;
  private payload: Row | Row[] | null = null;
  private conflict: string[] = [];
  private returning = false;
  private mode: "many" | "single" | "maybe" = "many";

  constructor(private table: string) {
    if (!(table in TABLES)) throw new Error(`Unknown table: ${table}`);
  }

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    this.selectStr = cols;
    if (this.op !== "select") this.returning = true;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = "insert";
    this.payload = values;
    return this;
  }
  update(values: Row) {
    this.op = "update";
    this.payload = values;
    return this;
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = values;
    this.conflict = (opts?.onConflict ?? "id").split(",").map((s) => ident(s.trim()));
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown) {
    this.conds.push(cond(col, "eq", val));
    return this;
  }
  neq(col: string, val: unknown) {
    this.conds.push(cond(col, "neq", val));
    return this;
  }
  gt(col: string, val: unknown) {
    this.conds.push(cond(col, "gt", val));
    return this;
  }
  gte(col: string, val: unknown) {
    this.conds.push(cond(col, "gte", val));
    return this;
  }
  lt(col: string, val: unknown) {
    this.conds.push(cond(col, "lt", val));
    return this;
  }
  lte(col: string, val: unknown) {
    this.conds.push(cond(col, "lte", val));
    return this;
  }
  is(col: string, val: unknown) {
    this.conds.push(cond(col, "is", val));
    return this;
  }
  in(col: string, vals: unknown[]) {
    if (vals.length === 0) this.conds.push({ sql: "0", params: [] });
    else this.conds.push({ sql: `${ident(col)} IN (${vals.map(() => "?").join(",")})`, params: vals.map(bindable) });
    return this;
  }
  not(col: string, op: string, val: unknown) {
    const inner = cond(col, op, val);
    this.conds.push({ sql: `NOT (${inner.sql})`, params: inner.params });
    return this;
  }
  or(expr: string) {
    this.conds.push(parseOr(expr));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push(`${ident(col)} ${opts?.ascending === false ? "DESC" : "ASC"}`);
    return this;
  }
  limit(n: number) {
    this.lim = Math.max(0, Math.floor(n));
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }
  maybeSingle() {
    this.mode = "maybe";
    return this;
  }

  then<R1 = QueryResult, R2 = never>(
    onfulfilled?: ((value: QueryResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private where(): { sql: string; params: unknown[] } {
    if (!this.conds.length) return { sql: "", params: [] };
    return {
      sql: ` WHERE ${this.conds.map((c) => c.sql).join(" AND ")}`,
      params: this.conds.flatMap((c) => c.params),
    };
  }

  private shapeOne(rows: Row[]): QueryResult {
    if (this.mode === "many") return { data: rows, error: null };
    if (rows.length === 1) return { data: rows[0], error: null };
    if (rows.length === 0 && this.mode === "maybe") return { data: null, error: null };
    return {
      data: null,
      error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
    };
  }

  private async execute(): Promise<QueryResult> {
    try {
      const db = await getD1();
      switch (this.op) {
        case "select":
          return await this.runSelect(db);
        case "insert":
        case "upsert":
          return await this.runWrite(db);
        case "update":
          return await this.runUpdate(db);
        case "delete":
          return await this.runDelete(db);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { data: null, error: { message } };
    }
  }

  private async runSelect(db: D1Database): Promise<QueryResult> {
    const { sql: w, params } = this.where();
    let count: number | null = null;
    if (this.wantCount) {
      const c = await db.prepare(`SELECT COUNT(*) AS c FROM ${this.table}${w}`).bind(...params).first<{ c: number }>();
      count = c?.c ?? 0;
      if (this.headOnly) return { data: null, error: null, count };
    }
    let q = `SELECT * FROM ${this.table}${w}`;
    if (this.orders.length) q += ` ORDER BY ${this.orders.join(", ")}`;
    if (this.lim !== null) q += ` LIMIT ${this.lim}`;
    else if (this.mode !== "many") q += ` LIMIT 2`;
    const res = await db.prepare(q).bind(...params).all<Row>();
    const rows = (res.results ?? []).map((r) => deserialize(this.table, r));
    const shaped = await hydrate(db, this.table, rows, parseSelect(this.selectStr));
    const out = this.shapeOne(shaped);
    if (count !== null) out.count = count;
    return out;
  }

  private async runWrite(db: D1Database): Promise<QueryResult> {
    const meta = TABLES[this.table];
    const list = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
    const statements = list.map((item) => {
      const row = serialize(this.table, item);
      if (!meta.intId && !row.id) row.id = crypto.randomUUID();
      const cols = Object.keys(row);
      let q = `INSERT INTO ${this.table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`;
      if (this.op === "upsert") {
        const sets = cols.filter((c) => !this.conflict.includes(c)).map((c) => `${c} = excluded.${c}`);
        q += ` ON CONFLICT(${this.conflict.join(",")}) ` + (sets.length ? `DO UPDATE SET ${sets.join(", ")}` : "DO NOTHING");
      }
      if (this.returning) q += " RETURNING *";
      return db.prepare(q).bind(...cols.map((c) => row[c]));
    });
    if (!statements.length) return { data: [], error: null };
    const results = await db.batch<Row>(statements);
    if (!this.returning) return { data: null, error: null };
    const rows = results.flatMap((r) => r.results ?? []).map((r) => deserialize(this.table, r));
    return this.shapeOne(await hydrate(db, this.table, rows, parseSelect(this.selectStr)));
  }

  private async runUpdate(db: D1Database): Promise<QueryResult> {
    if (!this.conds.length) throw new Error("update() requires at least one filter");
    const meta = TABLES[this.table];
    const row = serialize(this.table, this.payload as Row);
    if (meta.updatedAt && !("updated_at" in row)) row.updated_at = new Date().toISOString();
    const cols = Object.keys(row);
    if (!cols.length) return { data: null, error: null };
    const { sql: w, params } = this.where();
    let q = `UPDATE ${this.table} SET ${cols.map((c) => `${c} = ?`).join(", ")}${w}`;
    if (this.returning) q += " RETURNING *";
    const stmt = db.prepare(q).bind(...cols.map((c) => row[c]), ...params);
    if (!this.returning) {
      await stmt.run();
      return { data: null, error: null };
    }
    const res = await stmt.all<Row>();
    const rows = (res.results ?? []).map((r) => deserialize(this.table, r));
    return this.shapeOne(await hydrate(db, this.table, rows, parseSelect(this.selectStr)));
  }

  private async runDelete(db: D1Database): Promise<QueryResult> {
    if (!this.conds.length) throw new Error("delete() requires at least one filter");
    const { sql: w, params } = this.where();
    await db.prepare(`DELETE FROM ${this.table}${w}`).bind(...params).run();
    return { data: null, error: null };
  }
}
