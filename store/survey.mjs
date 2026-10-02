// Read-only: records the current App Store setup and Apple's field names. Changes nothing.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { api, BUNDLE } from './asc.mjs';
const out = []; const log = (s) => { console.log(s); out.push(typeof s === 'string' ? s : JSON.stringify(s, null, 1)); };
const tryLog = async (label, fn) => { try { log('== ' + label); log(await fn()); } catch (e) { log('ERROR ' + e.message); } };
try {
  // Apple's API specification: the exact field names and allowed values.
  try {
    execSync('curl -sSL -o /tmp/spec.zip https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip && cd /tmp && unzip -o -q spec.zip -d spec', { stdio: 'inherit' });
    const f = execSync('find /tmp/spec -name "*.json" | head -1').toString().trim();
    const spec = JSON.parse(fs.readFileSync(f, 'utf8')); const S = spec.components.schemas;
    log('== spec version ' + (spec.info && spec.info.version));
    for (const k of ['ScreenshotDisplayType', 'AgeRatingDeclarationUpdateRequest', 'AppStoreVersionCreateRequest', 'AppStoreVersionUpdateRequest',
      'AppStoreVersionLocalizationUpdateRequest', 'AppInfoLocalizationUpdateRequest', 'AppStoreReviewDetailCreateRequest', 'AppUpdateRequest',
      'AppAvailabilityV2CreateRequest', 'AppPriceScheduleCreateRequest', 'TerritoryAvailabilityInlineCreate', 'AppPriceV2InlineCreate', 'AppInfoUpdateRequest'])
      log({ [k]: S[k] || 'not in spec' });
    for (const k of Object.keys(S).filter((n) => /^AgeRatingDeclaration$|^KidsAgeBand$/.test(n))) log({ [k]: S[k] });
  } catch (e) { log('spec ERROR ' + e.message); }
  const apps = await api(`/v1/apps?filter[bundleId]=${BUNDLE}`); const app = apps.data[0];
  log('== app ' + app.id); log(app.attributes);
  await tryLog('appInfos', async () => (await api(`/v1/apps/${app.id}/appInfos?include=ageRatingDeclaration,appInfoLocalizations,primaryCategory,secondaryCategory`)));
  await tryLog('appStoreVersions', async () => (await api(`/v1/apps/${app.id}/appStoreVersions?include=appStoreVersionLocalizations,appStoreReviewDetail,build`)));
  await tryLog('price schedule', async () => (await api(`/v1/apps/${app.id}/appPriceSchedule?include=manualPrices,baseTerritory`)));
  await tryLog('availability', async () => (await api(`/v1/apps/${app.id}/appAvailabilityV2`)));
  await tryLog('free price point (CAN)', async () => (await api(`/v1/apps/${app.id}/appPricePoints?filter[territory]=CAN&limit=3`)));
  await tryLog('territories count', async () => { const t = await api('/v1/territories?limit=200'); return t.data.length + ' territories'; });
  await tryLog('builds', async () => (await api(`/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=3&include=preReleaseVersion`)).data.map((b) => [b.attributes.version, b.attributes.processingState, b.attributes.uploadedDate]));
} catch (e) { log('ERROR ' + e.message); }
fs.mkdirSync('store/result', { recursive: true });
fs.writeFileSync('store/result/survey.txt', out.join('\n') + '\n');
