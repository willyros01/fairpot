// Private values in this public repo: sealed to the App Store Connect key (P-256).
// Anyone can seal with the public key in store/pubkey.pem; only the workflow, which holds the
// private key as a GitHub secret, can open them. ECDH P-256 + HKDF-SHA256 + AES-256-GCM.
import crypto from 'node:crypto';
import fs from 'node:fs';
const priv = () => crypto.createPrivateKey(process.env.ASC_KEY_P8);
export function publicPem() { return crypto.createPublicKey(priv()).export({ type: 'spki', format: 'pem' }); }
export function open(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const eph = crypto.createPublicKey({ key: Buffer.from(j.epk, 'base64'), format: 'der', type: 'spki' });
  const shared = crypto.diffieHellman({ privateKey: priv(), publicKey: eph });
  const key = Buffer.from(crypto.hkdfSync('sha256', shared, Buffer.alloc(0), Buffer.from('fairpot-sealed-v1'), 32));
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(j.iv, 'base64'));
  d.setAuthTag(Buffer.from(j.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(j.ct, 'base64')), d.final()]).toString('utf8');
}
