import crypto from 'crypto';

function hashPhrase(phrase) {
  return crypto.createHash('sha256').update(phrase.toLowerCase().trim()).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { userId, recoveryPhrase } = req.body;
  if (!userId || !recoveryPhrase) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const baseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hash = hashPhrase(recoveryPhrase);

  const updateRes = await fetch(
    `${baseUrl}/rest/v1/users?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        recovery_phrase_hash: hash,
        recovery_type: 'phrase',
      }),
    }
  );

  if (!updateRes.ok) {
    return res.status(500).json({ error: 'Failed to save recovery phrase.' });
  }

  return res.status(200).json({ success: true });
}