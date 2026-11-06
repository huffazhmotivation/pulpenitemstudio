#!/usr/bin/env node
// One-time migration: Supabase (Postgres + Storage) -> Cloudflare D1 + R2.
//
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/migrate-from-supabase.mjs [--remote] [--skip-files] [--dry]
//
// What it does
//   1. Reads every table over the Supabase REST API (service-role key).
//   2. Writes migration-out/data.sql (INSERTs in foreign-key order) with
//      arrays -> JSON, booleans -> 0/1 and storage URLs rewritten to /media/...
//   3. Downloads every object from the three storage buckets into
//      migration-out/objects/<bucket>/<path>.
//   4. Unless --dry: applies data.sql to D1 and uploads the objects to R2
//      (local dev state by default, the real Cloudflare account with --remote).
//
// Admin passwords can't be exported from Supabase Auth, so admin accounts are
// imported with a locked password. Set a new one afterwards with:
//   node scripts/create-admin.mjs you@example.com 'new-password' --remote
//
// It only READS from Supabase; nothing there is changed or deleted.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const args = new Set(process.argv.slice(2));
const remote = args.has("--remote");
const dry = args.has("--dry");
const skipFiles = args.has("--skip-files");

if (!SUPABASE_URL || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}

const OUT = "migration-out";
const R2_BUCKET = "pulpenitem-media";
const BUCKETS = ["font-previews", "font-images", "font-masters"];
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// D1 columns per table, in foreign-key-safe import order.
const TABLES = [
  ["categories", ["id", "name", "slug", "description", "sort_order", "created_at"], {}],
  ["licenses", ["id", "name", "slug", "description", "sort_order", "created_at"], {}],
  [
    "fonts",
    [
      "id", "name", "slug", "short_description", "full_description", "category_id", "tags", "designer",
      "release_year", "version", "language_support", "font_features", "price", "currency", "sale_price",
      "is_on_sale", "sale_starts_at", "sale_ends_at", "status", "is_featured", "is_new", "cover_image_url",
      "default_preview_text", "seo_title", "meta_description", "created_at", "updated_at",
    ],
    { json: ["tags", "language_support", "font_features"], bool: ["is_on_sale", "is_featured", "is_new"], url: ["cover_image_url"] },
  ],
  ["font_styles", ["id", "font_id", "name", "weight", "is_italic", "sort_order", "created_at"], { bool: ["is_italic"] }],
  ["font_files", ["id", "font_id", "style_id", "file_type", "format", "storage_path", "file_size", "created_at"], {}],
  ["font_images", ["id", "font_id", "image_url", "alt_text", "sort_order", "created_at"], { url: ["image_url"] }],
  ["license_prices", ["id", "font_id", "license_id", "price", "currency", "created_at"], {}],
  [
    "site_settings",
    ["id", "studio_name", "studio_tagline", "contact_email", "whatsapp_number", "instagram_handle", "address", "footer_note", "logo_url", "favicon_url"],
    { url: ["logo_url", "favicon_url"] },
  ],
  [
    "homepage_settings",
    [
      "id", "hero_eyebrow", "hero_heading", "hero_subheading", "hero_preview_font_id", "hero_preview_text",
      "hero_image_url", "hero_image_alt", "about_heading", "about_body", "featured_heading", "latest_heading",
    ],
    { url: ["hero_image_url"] },
  ],
  ["hero_images", ["id", "image_url", "alt_text", "sort_order", "created_at"], { url: ["image_url"] }],
];

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

function rewriteUrl(u) {
  if (typeof u !== "string") return u;
  const m = u.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
  return m ? `/media/${m[1]}/${m[2]}` : u;
}

function sqlValue(col, v, opts) {
  if (v === null || v === undefined) return "NULL";
  if (opts.json?.includes(col)) return q(JSON.stringify(Array.isArray(v) ? v : []));
  if (opts.bool?.includes(col)) return v ? "1" : "0";
  if (opts.url?.includes(col)) return q(rewriteUrl(v));
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "object") return q(JSON.stringify(v));
  return q(v);
}

async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: { ...headers, Range: `${from}-${from + 999}`, "Range-Unit": "items" },
    });
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function listObjects(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`list ${bucket}/${prefix}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    for (const item of page) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listObjects(bucket, path))); // folder
      else files.push(path);
    }
    if (page.length < 1000) break;
  }
  return files;
}

mkdirSync(OUT, { recursive: true });

// ---- 1. tables -> data.sql -------------------------------------------------
const statements = ["PRAGMA defer_foreign_keys = true;"];
for (const [table, cols, opts] of TABLES) {
  const rows = await fetchAll(table);
  console.log(`${table}: ${rows.length} rows`);
  for (const row of rows) {
    const values = cols.map((c) => sqlValue(c, row[c], opts)).join(", ");
    statements.push(`INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${values});`);
  }
}

// Admin accounts: emails come from Supabase Auth; passwords can't be exported.
try {
  const profiles = await fetchAll("admin_profiles");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers });
  const users = res.ok ? (await res.json()).users ?? [] : [];
  const emailById = new Map(users.map((u) => [u.id, u.email]));
  for (const p of profiles) {
    const email = emailById.get(p.id);
    if (!email) continue;
    statements.push(
      `INSERT OR REPLACE INTO admin_profiles (id, email, full_name, role, password_hash, created_at) VALUES (${q(p.id)}, ${q(
        email.toLowerCase()
      )}, ${p.full_name ? q(p.full_name) : "NULL"}, ${q(p.role || "admin")}, '!locked', ${q(p.created_at)});`
    );
  }
  console.log(`admin_profiles: ${profiles.length} (passwords locked — set a new one with scripts/create-admin.mjs)`);
} catch (e) {
  console.warn("Could not read admin users:", e.message);
}

const sqlPath = join(OUT, "data.sql");
writeFileSync(sqlPath, statements.join("\n") + "\n");
console.log(`Wrote ${sqlPath} (${statements.length - 1} statements)`);

// ---- 2. storage objects ----------------------------------------------------
const objects = [];
if (!skipFiles) {
  for (const bucket of BUCKETS) {
    const paths = await listObjects(bucket);
    console.log(`${bucket}: ${paths.length} objects`);
    for (const path of paths) {
      const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(`  skip ${bucket}/${path}: ${res.status}`);
        continue;
      }
      const dest = join(OUT, "objects", bucket, path);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      objects.push({ key: `${bucket}/${path}`, file: dest, type: res.headers.get("content-type") || "application/octet-stream" });
    }
  }
}

if (dry) {
  console.log("Dry run: nothing applied to Cloudflare.");
  process.exit(0);
}

// ---- 3. apply to Cloudflare -----------------------------------------------
const target = remote ? "--remote" : "--local";
const run = (cmd) => {
  const r = spawnSync("npx", ["wrangler", ...cmd], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error("wrangler failed:", cmd.slice(0, 4).join(" "));
    process.exit(r.status ?? 1);
  }
};

console.log(`\nImporting into D1 (${remote ? "remote" : "local"})…`);
run(["d1", "execute", "DB", target, "--file", sqlPath]);

let done = 0;
for (const o of objects) {
  run(["r2", "object", "put", `${R2_BUCKET}/${o.key}`, "--file", o.file, "--content-type", o.type, target]);
  done++;
  if (done % 20 === 0) console.log(`  uploaded ${done}/${objects.length}`);
}
console.log(`\nDone. ${objects.length} files uploaded. Next: node scripts/create-admin.mjs <email> <password> ${remote ? "--remote" : ""}`);
if (!existsSync(sqlPath)) process.exit(1);
