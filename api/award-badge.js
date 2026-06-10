// /api/award-badge.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { teacherId, studentId, badgeName } = req.body;
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    };

    // Verify badge is teacher-awarded
    const badgeRes = await fetch(
      `${supabaseUrl}/rest/v1/badges?name=eq.${encodeURIComponent(badgeName)}&teacher_awarded=eq.true&select=id,name`,
      { headers }
    );
    const badgeData = await badgeRes.json();
    if (!badgeData[0]) {
      return res.status(400).json({ error: 'Badge not found or not teacher-awarded' });
    }

    // Check student doesn't already have it
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/user_badges?user_id=eq.${studentId}&badge_id=eq.${badgeData[0].id}&select=id`,
      { headers }
    );
    const existingData = await existingRes.json();
    if (existingData.length > 0) {
      return res.status(409).json({ error: 'Student already has this badge' });
    }

    // Award the badge
    await fetch(`${supabaseUrl}/rest/v1/user_badges`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: studentId,
        badge_id: badgeData[0].id,
        awarded_by: teacherId,
        earned_at: new Date().toISOString()
      }),
    });

    return res.status(200).json({ success: true, badge: badgeData[0] });

  } catch (err) {
    console.error('award-badge error:', err);
    return res.status(500).json({ error: err.message });
  }
}