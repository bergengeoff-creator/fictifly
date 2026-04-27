export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { accounts, classId } = req.body;

  const results = [];

  for (const account of accounts) {
    const { username, passcode } = account;
    const email = username.toLowerCase() + '@student.fictifly.com';

    // Create auth user via admin API
    const authRes = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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
    const profileRes = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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
    await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/class_members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ class_id: classId, student_id: authData.id }),
    });

    results.push({ username, passcode, success: true });
  }

  res.status(200).json({ results });
}