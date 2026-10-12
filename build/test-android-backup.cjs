#!/usr/bin/env node
'use strict';
// Focused, deterministic regression checks for Fairpot Android backup routing.
// Uses the REAL www/index.html source with a mocked Capacitor native WebView.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('www/index.html', 'utf8');
function between(begin, end) {
  const start = html.indexOf(begin);
  assert(start >= 0, 'source marker absent: ' + begin);
  const stop = html.indexOf(end, start + begin.length);
  assert(stop > start, 'end marker absent: ' + end);
  return html.slice(start, stop);
}
const declarations = between('var CapNS = window.Capacitor || null;', 'var DBNAME =');
const functionUnderTest = between('function exportBackup(){', "$('restoreInput').addEventListener");
const source = declarations + '\n' + functionUnderTest;

async function scenario(platform, androidPlugin) {
  const events = { nativeSaves: [], shares: 0, marked: 0, alerts: [], toasts: [] };
  const photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2Q==';
  const tx = { id: 'tx1', desc: 'Fixture', items: [{ id: 'it1', cat: 'Food', amt: 10, photo: 'stored' }] };
  const plugins = {
    CapacitorSQLite: {},
    Filesystem: {
      writeFile: async () => ({}),
      getUri: async () => ({ uri: 'content://cache/backup.json' })
    },
    Share: {
      share: async () => { events.shares++; }
    }
  };
  if (androidPlugin !== 'absent') {
    plugins.FairpotDocument = {
      saveToDownloads: async data => {
        events.nativeSaves.push(data);
        if (androidPlugin === 'reject') throw new Error('Storage unavailable');
        return { saved: true, fileName: data.fileName };
      }
    };
  }
  const capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => platform,
    Plugins: plugins
    // Deliberately NO registerPlugin: native Capacitor exposes Plugins.
  };
  const sandbox = {
    window: { Capacitor: capacitor },
    Promise,
    JSON,
    Date,
    navigator: { share: () => { throw new Error('No navigator share allowed here'); } },
    loadTxs: () => JSON.parse(JSON.stringify([tx])),
    getPhoto: async () => photo,
    toast: message => events.toasts.push(message),
    alert: message => events.alerts.push(message),
    getCats: () => ['Food'],
    getPay: () => ({ name: '', methods: [] }),
    HOME: 'CAD',
    todayStr: () => '2026-10-12',
    markBackedUp: () => { events.marked++; },
    // iOS uses the native Filesystem and Share proxies above.
    File: class {},
    Blob: class {}
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'fairpot-backup-source.js' });
  sandbox.exportBackup();
  // Let all queued promise reactions drain, including native Share on iOS.
  await new Promise(resolve => setImmediate(resolve));
  return events;
}

async function main() {
  const saved = await scenario('android', 'present');
  assert.equal(saved.nativeSaves.length, 1, 'Android must call direct Downloads save');
  assert.equal(saved.shares, 0, 'Android must NEVER share the backup');
  assert.equal(saved.marked, 1, 'Only a successful save marks backup completed');
  assert.equal(saved.alerts.length, 1);
  assert.match(saved.alerts[0], /Backup saved on this device.*Downloads/s);
  const decoded = JSON.parse(saved.nativeSaves[0].data);
  assert.equal(decoded.txs.length, 1);
  assert.match(decoded.txs[0].items[0].photo, /^data:image\/jpeg;base64,/);
  console.log('PASS: Android saves expense/photo into Downloads without sharing');

  const missing = await scenario('android', 'absent');
  assert.equal(missing.nativeSaves.length, 0);
  assert.equal(missing.shares, 0);
  assert.equal(missing.marked, 0);
  assert.match(missing.alerts.join(' '), /Backup was NOT saved/);
  console.log('PASS: missing native plugin fails visibly without Share fallback');

  const failed = await scenario('android', 'reject');
  assert.equal(failed.shares, 0);
  assert.equal(failed.marked, 0);
  assert.match(failed.alerts.join(' '), /Storage unavailable/);
  console.log('PASS: failed Android write does not mark backup complete');

  const ios = await scenario('ios', 'absent');
  assert.equal(ios.nativeSaves.length, 0);
  assert.equal(ios.shares, 1);
  assert.equal(ios.marked, 1);
  console.log('PASS: iOS share backup path remains unchanged');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
