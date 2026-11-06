/**
 * PBKDF2-SHA256 password hashing via WebCrypto. Stored as
 * `pbkdf2$<iterations>$<salt b64>$<hash b64>`; scripts/hash-password.mjs
 * produces the same format for creating the first admin.
 */
const enc = new TextEncoder();
const DEFAULT_ITERATIONS = 50_000;

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(str: string): Uint8Array {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, 256);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${DEFAULT_ITERATIONS}$${b64(salt)}$${b64(await derive(password, salt, DEFAULT_ITERATIONS))}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  // Always do the work, even for an unknown user, so timing doesn't reveal which emails exist.
  const parts = (stored ?? "").split("$");
  const valid = parts.length === 4 && parts[0] === "pbkdf2";
  const iterations = valid ? Number(parts[1]) : DEFAULT_ITERATIONS;
  const salt = valid ? unb64(parts[2]) : new Uint8Array(16);
  const expected = valid ? unb64(parts[3]) : new Uint8Array(32);
  const actual = new Uint8Array(await derive(password, salt, iterations));
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ (expected[i] ?? 0);
  return valid && diff === 0;
}
