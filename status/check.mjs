// Fairpot — read-only TestFlight status check (App Store Connect API).
// Waits until Apple finishes processing the requested build, then writes the
// result to status/result.txt. If the export-compliance answer is missing, it answers it
// the way it was answered before (only exempt encryption: HTTPS through iOS; the bundled
// SQLCipher library is not used), fills "What to Test" if empty, and makes sure the build
// is in every internal TestFlight group.
import crypto from 'node:crypto';
import fs from 'node:fs';

const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 } = process.env;
const BUNDLE = 'io.github.willyros01.fairpot';
const req = fs.readFileSync('status/request.txt', 'utf8');
const BUILD = (req.match(/build\s*=\s*(\d+)/) || [])[1];
const out = [];
const log = (s) => { console.log(s); out.push(s); };

function token() {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const u = enc({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' }) + '.' +
            enc({ iss: ASC_ISSUER_ID, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' });
  const sig = crypto.sign('sha256', Buffer.from(u), { key: ASC_KEY_P8, dsaEncoding: 'ieee-p1363' });
  return u + '.' + sig.toString('base64url');
}
async function api(path, method = 'GET', body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + path, { method,
    headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return {};
  const j = await r.json();
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + JSON.stringify(j.errors || j));
  return j;
}
async function finish(app, build, req) {
  if (build.attributes.usesNonExemptEncryption == null) {
    await api(`/v1/builds/${build.id}`, 'PATCH', { data: { type: 'builds', id: build.id, attributes: { usesNonExemptEncryption: false } } });
    log('Export compliance answered: only exempt encryption.');
  }
  const notes = (req.match(/^whatToTest\s*=\s*(.+)$/m) || [])[1];
  if (notes) {
    const loc = await api(`/v1/builds/${build.id}/betaBuildLocalizations`);
    const en = (loc.data || []).find((x) => x.attributes.locale.startsWith('en'));
    if (en && !en.attributes.whatsNew) {
      await api(`/v1/betaBuildLocalizations/${en.id}`, 'PATCH', { data: { type: 'betaBuildLocalizations', id: en.id, attributes: { whatsNew: notes } } });
      log('"What to Test" filled.');
    } else if (!en) {
      await api('/v1/betaBuildLocalizations', 'POST', { data: { type: 'betaBuildLocalizations', attributes: { locale: 'en-US', whatsNew: notes },
        relationships: { build: { data: { type: 'builds', id: build.id } } } } });
      log('"What to Test" added.');
    }
  }
  const groups = await api(`/v1/apps/${app.id}/betaGroups?limit=50`);
  for (const g of (groups.data || []).filter((x) => x.attributes.isInternalGroup)) {
    try {
      await api(`/v1/betaGroups/${g.id}/relationships/builds`, 'POST', { data: [{ type: 'builds', id: build.id }] });
      log(`In internal group "${g.attributes.name}".`);
    } catch (e) { log(`Group "${g.attributes.name}": ${e.message}`); }
  }
  await sleep(10000);
  const d = await api(`/v1/builds/${build.id}/buildBetaDetail`);
  log(`After: internal ${d.data.attributes.internalBuildState}  external ${d.data.attributes.externalBuildState}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let result = 'UNKNOWN';
try {
  if (!BUILD) throw new Error('status/request.txt has no "build = N" line');
  const apps = await api(`/v1/apps?filter[bundleId]=${BUNDLE}`);
  const app = apps.data[0];
  if (!app) throw new Error('App not found for ' + BUNDLE);
  log(`Fairpot build ${BUILD} — checking App Store Connect`);
  const start = Date.now();
  while (true) {
    const b = await api(`/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD}&include=buildBetaDetail,preReleaseVersion&limit=1`);
    const build = b.data[0];
    const t = new Date().toISOString();
    if (!build) {
      log(`${t}  not visible yet`);
    } else {
      const a = build.attributes;
      const det = (b.included || []).find((x) => x.type === 'buildBetaDetails');
      const pre = (b.included || []).find((x) => x.type === 'preReleaseVersions');
      log(`${t}  version ${pre ? pre.attributes.version : '?'}  processing ${a.processingState}` +
          `  expired ${a.expired}  encryption-answered ${a.usesNonExemptEncryption != null}` +
          (det ? `  internal ${det.attributes.internalBuildState}  external ${det.attributes.externalBuildState}` : ''));
      if (a.processingState !== 'PROCESSING') {
        result = a.processingState;
        if (result === 'VALID') await finish(app, build, req);
        break;
      }
    }
    if (Date.now() - start > 50 * 60 * 1000) { result = 'STILL_PROCESSING_AFTER_50_MIN'; break; }
    await sleep(60 * 1000);
  }
} catch (e) {
  result = 'ERROR'; log('Error: ' + e.message);
}
log('RESULT: ' + result);
fs.writeFileSync('status/result.txt', out.join('\n') + '\n');
