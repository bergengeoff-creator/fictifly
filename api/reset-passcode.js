export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { studentId, newPasscode } = req.body;
  if (!studentId || !newPasscode) {
    return res.status(400).json({ error: 'Missing studentId or newPasscode' });
  }

  const response = await fetch(
    `${process.env.REACT_APP_SUPABASE_URL}/auth/v1/admin/users/${studentId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ password: newPasscode }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    return res.status(500).json({ error: data.message || 'Failed to reset passcode' });
  }

  return res.status(200).json({ success: true });
}