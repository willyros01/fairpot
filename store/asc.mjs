// Fairpot — shared App Store Connect API helper (key from GitHub secrets).
import crypto from 'node:crypto';
const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 } = process.env;
function token() {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const u = enc({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' }) + '.' +
            enc({ iss: ASC_ISSUER_ID, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' });
  return u + '.' + crypto.sign('sha256', Buffer.from(u), { key: ASC_KEY_P8, dsaEncoding: 'ieee-p1363' }).toString('base64url');
}
export async function api(path, method = 'GET', body) {
  const url = path.startsWith('http') ? path : 'https://api.appstoreconnect.apple.com' + path;
  const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return {};
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 500) }; }
  if (!r.ok) { const e = new Error(`${method} ${path} -> HTTP ${r.status} ${JSON.stringify(j.errors || j).slice(0, 900)}`); e.status = r.status; throw e; }
  return j;
}
export const BUNDLE = 'io.github.willyros01.fairpot';
