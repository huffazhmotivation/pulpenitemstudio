import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Stateless admin session: a cookie holding `<base64url payload>.<base64url
 * HMAC-SHA256>`. Uses only WebCrypto, so it runs in middleware (edge) and in
 * Server Actions alike. The signing secret is the Worker secret AUTH_SECRET.
 */
export const SESSION_COOKIE = "pi_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

async function getSecret(): Promise<string> {
  let secret: string | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    secret = env.AUTH_SECRET;
  } catch {
    // no Cloudflare context (plain `next build`) — fall through to process.env
  }
  secret ??= process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (set it as a Worker secret / in .dev.vars).");
  }
  return secret;
}

function toB64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(await getSecret()), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload = toB64Url(enc.encode(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey("sign"), enc.encode(payload));
  return `${payload}.${toB64Url(sig)}`;
}

/** Returns the user id when the token is authentic and unexpired, else null. */
export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey("verify"), fromB64Url(sig) as BufferSource, enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64Url(payload))) as { uid?: string; exp?: number };
    if (!data.uid || !data.exp || data.exp < Date.now() / 1000) return null;
    return data.uid;
  } catch {
    return null;
  }
}
