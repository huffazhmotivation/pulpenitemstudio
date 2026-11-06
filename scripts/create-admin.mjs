#!/usr/bin/env node
// Creates (or resets the password of) an admin account in D1.
//
//   node scripts/create-admin.mjs you@example.com 'a-long-password' [--remote]
//
// Without --remote it targets the local dev database (.wrangler/state).
// The password is hashed here (PBKDF2-SHA256, same format the app verifies)
// and only the hash is sent to D1.
import { pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const [email, password] = args.filter((a) => !a.startsWith("--"));

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [--remote]");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}

const iterations = 50_000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const stored = `pbkdf2$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`;

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sql =
  `INSERT INTO admin_profiles (id, email, full_name, role, password_hash) ` +
  `VALUES (${q(randomUUID())}, ${q(email.toLowerCase())}, NULL, 'owner', ${q(stored)}) ` +
  `ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;`;

const res = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "DB", remote ? "--remote" : "--local", "--command", sql],
  { stdio: "inherit" }
);
process.exit(res.status ?? 1);
