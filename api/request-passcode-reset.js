export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const baseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  // Look up student by username
  const userRes = await fetch(
    `${baseUrl}/rest/v1/users?username=eq.${encodeURIComponent(username)}&account_type=eq.student&select=id`,
    { headers }
  );
  const users = await userRes.json();

  if (!users || users.length === 0) {
    return res.status(404).json({ error: 'No student account found with that username.' });
  }

  const studentId = users[0].id;

  // Find their class membership
  const memberRes = await fetch(
    `${baseUrl}/rest/v1/class_members?student_id=eq.${studentId}&select=class_id`,
    { headers }
  );
  const members = await memberRes.json();

  if (!members || members.length === 0) {
    return res.status(400).json({ error: 'This account is not linked to a class. Please ask your teacher for help.' });
  }

  const classId = members[0].class_id;

  // Check for existing pending request
  const existingRes = await fetch(
    `${baseUrl}/rest/v1/passcode_reset_requests?student_id=eq.${studentId}&status=eq.pending&select=id`,
    { headers }
  );
  const existing = await existingRes.json();

  if (existing && existing.length > 0) {
    return res.status(200).json({ success: true, alreadyPending: true });
  }

  // Insert reset request
  const insertRes = await fetch(
    `${baseUrl}/rest/v1/passcode_reset_requests`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        student_id: studentId,
        class_id: classId,
        username,
        status: 'pending',
      }),
    }
  );

  if (!insertRes.ok) {
    return res.status(500).json({ error: 'Something went wrong. Please ask your teacher for help directly.' });
  }

  return res.status(200).json({ success: true });
}