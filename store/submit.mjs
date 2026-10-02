// Fairpot — submit the prepared App Store version for App Review. Logs every step.
import fs from 'node:fs';
import { api, BUNDLE } from './asc.mjs';
const out = []; const log = (s) => { console.log(s); out.push(s); };
try {
  const app = (await api(`/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0];
  const vers = await api(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&include=build,appStoreReviewDetail`);
  const ver = vers.data.find((v) => v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION' || /REJECTED/.test(v.attributes.appStoreState));
  if (!ver) throw new Error('no version waiting for submission: ' + vers.data.map((v) => v.attributes.versionString + ' ' + v.attributes.appStoreState).join(', '));
  log(`Version ${ver.attributes.versionString} (${ver.attributes.appStoreState}), build ${ver.relationships.build.data ? 'attached' : 'MISSING'}, review details ${ver.relationships.appStoreReviewDetail.data ? 'present' : 'MISSING'}`);
  // Reuse an open submission if one exists, otherwise create one.
  const subs = await api(`/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,UNRESOLVED_ISSUES`);
  let sub = subs.data[0];
  if (!sub) sub = (await api('/v1/reviewSubmissions', 'POST', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' },
    relationships: { app: { data: { type: 'apps', id: app.id } } } } })).data;
  log('Review submission ' + sub.id + ' (' + sub.attributes.state + ')');
  const items = await api(`/v1/reviewSubmissions/${sub.id}/items?include=appStoreVersion`);
  const has = (items.data || []).some((i) => i.relationships && i.relationships.appStoreVersion && i.relationships.appStoreVersion.data && i.relationships.appStoreVersion.data.id === ver.id);
  if (!has) {
    await api('/v1/reviewSubmissionItems', 'POST', { data: { type: 'reviewSubmissionItems', relationships: {
      reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } },
      appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
    log('Version added to the submission.');
  }
  const r = await api(`/v1/reviewSubmissions/${sub.id}`, 'PATCH', { data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } } });
  log('RESULT: SUBMITTED — state ' + r.data.attributes.state);
} catch (e) { log('RESULT: NOT SUBMITTED — ' + e.message); process.exitCode = 1; }
fs.mkdirSync('store/result', { recursive: true });
fs.writeFileSync('store/result/submit.txt', out.join('\n') + '\n');
