import crypto from 'crypto';

function hashPhrase(phrase) {
  return crypto.createHash('sha256').update(phrase.toLowerCase().trim()).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { username, recoveryPhrase, newPasscode } = req.body;
  if (!username || !recoveryPhrase || !newPasscode) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const baseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  const queryUrl = `${baseUrl}/rest/v1/users?username=eq.${encodeURIComponent(username.trim())}&select=id,account_type,recovery_phrase_hash,recovery_type`;
  console.log('DEBUG recover-minor-account: querying', queryUrl);
  console.log('DEBUG username received:', JSON.stringify(username));

  const userRes = await fetch(queryUrl, { headers });
  const users = await userRes.json();

  console.log('DEBUG users result:', JSON.stringify(users));

  if (!users || users.length === 0) {
    return res.status(404).json({ error: 'No account found with that username.', debug: { queryUrl, usernameReceived: username } });
  }

  const user = users[0];

  if (user.account_type !== 'minor') {
    return res.status(400).json({ error: 'This account does not support phrase recovery. Please ask your teacher for help.' });
  }

  if (user.recovery_type !== 'phrase' || !user.recovery_phrase_hash) {
    return res.status(400).json({ error: 'No recovery phrase is set up for this account. Please ask your teacher for help.' });
  }

  const inputHash = hashPhrase(recoveryPhrase);
  if (inputHash !== user.recovery_phrase_hash) {
    return res.status(401).json({ error: 'Recovery phrase is incorrect. Please check your words and try again.' });
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
    const resetData = await resetRes.json();
    return res.status(500).json({ error: resetData.message || 'Failed to reset passcode. Please try again.' });
  }

  return res.status(200).json({ success: true });
}