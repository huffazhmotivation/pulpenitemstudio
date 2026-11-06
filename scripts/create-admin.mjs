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
const [email, passwordArg] = args.filter((a) => !a.startsWith("--"));

if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email> [password] [--remote]\n(Leave the password out to be asked for it with hidden input.)");
  process.exit(1);
}

// Ask for the password without echoing it, so it never lands in shell history or chat.
import { createInterface } from "node:readline";
function promptHidden(label) {
  if (!process.stdin.isTTY) throw new Error("No terminal available: pass the password as an argument.");
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (str) => {
      if (!muted) process.stdout.write(str);
    };
    rl.question(label, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

let password = passwordArg;
if (!password) {
  password = await promptHidden("New admin password (min 10 chars): ");
  const again = await promptHidden("Repeat password: ");
  if (password !== again) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
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
