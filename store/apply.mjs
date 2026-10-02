// Fairpot — fill the App Store page from store/listing.json and store/screenshots/.
// Safe to run again: every step sets the same values; screenshots are replaced.
// It does NOT submit for review — that stays a manual tap in App Store Connect.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { api, BUNDLE } from './asc.mjs';

const L = JSON.parse(fs.readFileSync('store/listing.json', 'utf8'));
const out = []; const log = (s) => { console.log(s); out.push(s); };
const done = []; const failed = [];
async function step(name, fn) {
  try { const r = await fn(); done.push(name); log(`OK   ${name}${r ? ' — ' + r : ''}`); }
  catch (e) { failed.push(name); log(`FAIL ${name} — ${e.message}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const app = (await api(`/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0];
log(`Fairpot app ${app.id}`);
const info = (await api(`/v1/apps/${app.id}/appInfos?include=appInfoLocalizations,ageRatingDeclaration`));
const appInfo = info.data.find((x) => x.attributes.state !== 'READY_FOR_DISTRIBUTION') || info.data[0];
const infoLoc = (info.included || []).find((x) => x.type === 'appInfoLocalizations' && x.attributes.locale === L.locale);
const ageDecl = (info.included || []).find((x) => x.type === 'ageRatingDeclarations');

await step('Content rights', async () => {
  await api(`/v1/apps/${app.id}`, 'PATCH', { data: { type: 'apps', id: app.id, attributes: { contentRightsDeclaration: L.contentRights } } });
});

await step('Categories (Finance, Travel)', async () => {
  await api(`/v1/appInfos/${appInfo.id}`, 'PATCH', { data: { type: 'appInfos', id: appInfo.id, relationships: {
    primaryCategory: { data: { type: 'appCategories', id: L.primaryCategory } },
    secondaryCategory: { data: { type: 'appCategories', id: L.secondaryCategory } } } } });
});

await step('Subtitle and privacy policy URL', async () => {
  if (!infoLoc) throw new Error('no ' + L.locale + ' app info localization');
  await api(`/v1/appInfoLocalizations/${infoLoc.id}`, 'PATCH', { data: { type: 'appInfoLocalizations', id: infoLoc.id,
    attributes: { subtitle: L.subtitle, privacyPolicyUrl: L.privacyPolicyUrl } } });
});

await step('Age rating (every answer None / No)', async () => {
  if (!ageDecl) throw new Error('no age rating declaration');
  // Yes/no questions take false; how-often questions take NONE. Apple checks the whole
  // questionnaire at once, so send it all together and correct any type Apple rejects.
  const skip = new Set(['kidsAgeBand', 'gracRatingClassificationNumber', 'developerAgeRatingInfoUrl', 'ageRatingOverride', 'ageRatingOverrideV2', 'koreaAgeRatingOverride']);
  const yesNo = new Set(['messagingAndChat', 'parentalControls', 'advertising', 'unrestrictedWebAccess', 'lootBox', 'healthOrWellnessTopics',
    'socialMedia', 'ageAssurance', 'userGeneratedContent', 'gambling', 'socialMediaAgeRestricted']);
  const attrs = {};
  for (const k of Object.keys(ageDecl.attributes)) if (!skip.has(k)) attrs[k] = yesNo.has(k) ? false : 'NONE';
  for (let i = 0; i < 30; i++) {
    try {
      await api(`/v1/ageRatingDeclarations/${ageDecl.id}`, 'PATCH', { data: { type: 'ageRatingDeclarations', id: ageDecl.id, attributes: attrs } });
      log('     ' + JSON.stringify(attrs));
      return Object.keys(attrs).length + ' answers';
    } catch (e) {
      log('     try ' + (i + 1) + ': ' + e.message.slice(0, 400));
      const m = [...e.message.matchAll(/attributes\/(\w+)/g)].map((x) => x[1]).filter((k) => k in attrs);
      if (!m.length) throw e;
      for (const k of new Set(m)) attrs[k] = attrs[k] === false ? 'NONE' : (attrs[k] === 'NONE' ? false : 'NONE');
    }
  }
  throw new Error('gave up');
});

await step('Price: Free', async () => {
  const pts = await api(`/v1/apps/${app.id}/appPricePoints?filter[territory]=${L.basePriceTerritory}&limit=5`);
  const free = pts.data.find((p) => Number(p.attributes.customerPrice) === 0);
  if (!free) throw new Error('no free price point');
  await api('/v1/appPriceSchedules', 'POST', {
    data: { type: 'appPriceSchedules', relationships: {
      app: { data: { type: 'apps', id: app.id } },
      baseTerritory: { data: { type: 'territories', id: L.basePriceTerritory } },
      manualPrices: { data: [{ type: 'appPrices', id: '${price1}' }] } } },
    included: [{ type: 'appPrices', id: '${price1}', attributes: { startDate: null },
      relationships: { appPricePoint: { data: { type: 'appPricePoints', id: free.id } } } }] });
});

await step('Availability: every country, plus new ones automatically', async () => {
  try { await api(`/v1/apps/${app.id}/appAvailabilityV2`); return 'already set'; } catch (e) { if (e.status !== 404) throw e; }
  const terr = []; let next = '/v1/territories?limit=200';
  while (next) { const t = await api(next); terr.push(...t.data.map((x) => x.id)); next = t.links && t.links.next; }
  await api('/v2/appAvailabilities', 'POST', {
    data: { type: 'appAvailabilities', attributes: { availableInNewTerritories: true }, relationships: {
      app: { data: { type: 'apps', id: app.id } },
      territoryAvailabilities: { data: terr.map((t) => ({ type: 'territoryAvailabilities', id: '${' + t + '}' })) } } },
    included: terr.map((t) => ({ type: 'territoryAvailabilities', id: '${' + t + '}', attributes: { available: true },
      relationships: { territory: { data: { type: 'territories', id: t } } } })) });
  return terr.length + ' countries';
});

// The version being prepared.
const vers = await api(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&include=appStoreVersionLocalizations,appStoreReviewDetail`);
const ver = vers.data.find((v) => ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(v.attributes.appStoreState));
if (!ver) { log('FAIL no editable App Store version found'); failed.push('version'); }
else {
  await step(`Version ${L.versionString}, copyright, release after approval`, async () => {
    await api(`/v1/appStoreVersions/${ver.id}`, 'PATCH', { data: { type: 'appStoreVersions', id: ver.id,
      attributes: { versionString: L.versionString, copyright: L.copyright, releaseType: L.releaseType } } });
  });
  const vloc = (vers.included || []).find((x) => x.type === 'appStoreVersionLocalizations' && x.attributes.locale === L.locale);
  await step('Description, keywords, promotional text, support and marketing URLs', async () => {
    if (!vloc) throw new Error('no ' + L.locale + ' version localization');
    await api(`/v1/appStoreVersionLocalizations/${vloc.id}`, 'PATCH', { data: { type: 'appStoreVersionLocalizations', id: vloc.id,
      attributes: { description: L.description, keywords: L.keywords, promotionalText: L.promotionalText, supportUrl: L.supportUrl, marketingUrl: L.marketingUrl } } });
  });
  await step('App Review information (name, email, notes)', async () => {
    if (!L.review.contactPhone) return 'skipped — Apple needs a phone number, entered in App Store Connect';
    const rd = (vers.included || []).find((x) => x.type === 'appStoreReviewDetails' && ver.relationships.appStoreReviewDetail.data && x.id === ver.relationships.appStoreReviewDetail.data.id);
    if (rd) await api(`/v1/appStoreReviewDetails/${rd.id}`, 'PATCH', { data: { type: 'appStoreReviewDetails', id: rd.id, attributes: L.review } });
    else await api('/v1/appStoreReviewDetails', 'POST', { data: { type: 'appStoreReviewDetails', attributes: L.review,
      relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
  });

  for (const [displayType, files] of Object.entries(L.screenshots)) {
    if (L.skipScreenshots) { log(`SKIP Screenshots ${displayType} (already uploaded)`); continue; }
    await step(`Screenshots ${displayType} (${files.length})`, async () => {
      if (!vloc) throw new Error('no version localization');
      const sets = await api(`/v1/appStoreVersionLocalizations/${vloc.id}/appScreenshotSets?filter[screenshotDisplayType]=${displayType}`);
      let set = sets.data[0];
      if (!set) set = (await api('/v1/appScreenshotSets', 'POST', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: displayType },
        relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: vloc.id } } } } })).data;
      const old = await api(`/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`);
      for (const s of old.data) await api(`/v1/appScreenshots/${s.id}`, 'DELETE');
      const ids = [];
      for (const f of files) {
        const buf = fs.readFileSync('store/screenshots/' + f);
        const shot = (await api('/v1/appScreenshots', 'POST', { data: { type: 'appScreenshots', attributes: { fileName: f, fileSize: buf.length },
          relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } } } })).data;
        for (const op of shot.attributes.uploadOperations) {
          const headers = {}; for (const h of op.requestHeaders || []) headers[h.name] = h.value;
          const r = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
          if (!r.ok) throw new Error(`upload ${f} part ${op.offset}: HTTP ${r.status}`);
        }
        await api(`/v1/appScreenshots/${shot.id}`, 'PATCH', { data: { type: 'appScreenshots', id: shot.id,
          attributes: { uploaded: true, sourceFileChecksum: crypto.createHash('md5').update(buf).digest('hex') } } });
        ids.push([f, shot.id]);
      }
      // Wait for Apple to check each image.
      const bad = [];
      for (const [f, id] of ids) {
        let st = '';
        for (let i = 0; i < 30; i++) {
          const s = (await api(`/v1/appScreenshots/${id}`)).data.attributes.assetDeliveryState || {};
          st = s.state; if (st === 'COMPLETE' || st === 'FAILED') { if (st === 'FAILED') bad.push(f + ': ' + JSON.stringify(s.errors)); break; }
          await sleep(4000);
        }
        if (st !== 'COMPLETE' && st !== 'FAILED') bad.push(f + ': still ' + st);
      }
      if (bad.length) throw new Error(bad.join(' | '));
      return 'all accepted';
    });
  }

  await step(`Attach build ${L.buildNumber}`, async () => {
    let b = null;
    for (let i = 0; i < 40 && !b; i++) {
      const r = await api(`/v1/builds?filter[app]=${app.id}&filter[version]=${L.buildNumber}&limit=1`);
      const c = r.data[0];
      if (c && c.attributes.processingState === 'VALID') b = c;
      else { log(`     build ${L.buildNumber}: ${c ? c.attributes.processingState : 'not visible yet'} — waiting`); await sleep(30000); }
    }
    if (!b) throw new Error('build not ready');
    await api(`/v1/appStoreVersions/${ver.id}/relationships/build`, 'PATCH', { data: { type: 'builds', id: b.id } });
  });
}

log('');
log(`DONE ${done.length}   FAILED ${failed.length}${failed.length ? ': ' + failed.join(' / ') : ''}`);
log('Still manual in App Store Connect: App Privacy ("Data Not Collected"), the review contact phone number, then Add for Review → Submit.');
fs.mkdirSync('store/result', { recursive: true });
fs.writeFileSync('store/result/apply.txt', out.join('\n') + '\n');
if (failed.length) process.exitCode = 1;
