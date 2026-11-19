// /api/save-recovery-phrase.js
// Stores the hash of a self-registered minor's recovery phrase. The account is the
// signed-in caller's own; a userId in the body is ignored. Without this check anyone could
// overwrite another account's phrase and then take it over via /api/recover-minor-account.
import crypto from 'crypto';
import { handleCors, requireUser, getProfile, getSupabaseUrl, getServiceHeaders } from './_lib/security';

function hashPhrase(phrase) {
  return crypto.createHash('sha256').update(phrase.toLowerCase().trim()).digest('hex');
}

export default async function handler(req, res) {
  if (handleCors(req, res, 'POST')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  const { recoveryPhrase } = req.body || {};
  if (typeof recoveryPhrase !== 'string' || recoveryPhrase.trim().split(/\s+/).length < 4) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.account_type !== 'minor') {
    return res.status(403).json({ error: 'This account does not use a recovery phrase.' });
  }

  const updateRes = await fetch(`${getSupabaseUrl()}/rest/v1/users?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { ...getServiceHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({
      recovery_phrase_hash: hashPhrase(recoveryPhrase),
      recovery_type: 'phrase',
    }),
  });

  if (!updateRes.ok) {
    return res.status(500).json({ error: 'Failed to save recovery phrase.' });
  }
  return res.status(200).json({ success: true });
}
