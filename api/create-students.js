export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { accounts, classId } = req.body;

    if (!accounts || !classId) {
      return res.status(400).json({ error: 'Missing accounts or classId' });
    }

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const results = [];

    for (const account of accounts) {
      try {
        const { username, passcode } = account;
        const email = username.toLowerCase() + '@minor.fictifly.com';

        // Create auth user via admin API
        const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            email,
            password: passcode,
            email_confirm: true,
          }),
        });

        const authData = await authRes.json();
        if (!authData.id) {
          results.push({ username, passcode, error: authData.message || 'Failed to create auth user' });
          continue;
        }

        // Insert profile
        await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            id: authData.id,
            username,
            account_type: 'student',
            is_minor: true,
            age_verified: true,
            profile_public: false,
            profile_complete: true,
            display_name: username,
          }),
        });

        // Link to class
        await fetch(`${supabaseUrl}/rest/v1/class_members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ class_id: classId, student_id: authData.id }),
        });

        results.push({ username, passcode, success: true });
      } catch (accountErr) {
        results.push({ username: account.username, passcode: account.passcode, error: accountErr.message });
      }
    }

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}