import crypto from 'crypto';
import { handleCors, getSupabaseUrl, getServiceHeaders } from './_lib/security';

function hashPhrase(phrase) {
  return crypto.createHash('sha256').update(phrase.toLowerCase().trim()).digest('hex');
}

export default async function handler(req, res) {
  if (handleCors(req, res, 'POST')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, recoveryPhrase, newPasscode } = req.body;
  if (!username || !recoveryPhrase || !newPasscode) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (typeof newPasscode !== 'string' || !/^\d{6,12}$/.test(newPasscode)) {
    return res.status(400).json({ error: 'Passcode must be 6 or more digits.' });
  }

  const baseUrl = getSupabaseUrl();
  const headers = getServiceHeaders();

  const queryUrl = `${baseUrl}/rest/v1/users?username=eq.${encodeURIComponent(username.trim())}&select=id,account_type,recovery_phrase_hash,recovery_type`;

  const userRes = await fetch(queryUrl, { headers });
  const users = await userRes.json();

  if (!users || users.length === 0) {
    return res.status(401).json({ error: 'That username and recovery phrase don\'t match. Please check and try again.' });
  }

  const user = users[0];

  if (user.account_type !== 'minor') {
    return res.status(400).json({ error: 'This account does not support phrase recovery. Please ask your teacher for help.' });
  }

  if (user.recovery_type !== 'phrase' || !user.recovery_phrase_hash) {
    return res.status(400).json({ error: 'No recovery phrase is set up for this account. Please ask your teacher for help.' });
  }

  const inputHash = Buffer.from(hashPhrase(recoveryPhrase), 'hex');
  const storedHash = Buffer.from(user.recovery_phrase_hash, 'hex');
  if (inputHash.length !== storedHash.length || !crypto.timingSafeEqual(inputHash, storedHash)) {
    return res.status(401).json({ error: 'That username and recovery phrase don\'t match. Please check and try again.' });
  }

  const resetRes = await fetch(
    `${baseUrl}/auth/v1/admin/users/${user.id}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password: newPasscode }),
    }
  );

  if (!resetRes.ok) {
    console.error('recover-minor-account: admin update failed', resetRes.status);
    return res.status(500).json({ error: 'Failed to reset passcode. Please try again.' });
  }

  return res.status(200).json({ success: true });
}