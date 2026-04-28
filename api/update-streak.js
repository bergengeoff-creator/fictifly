export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
  };

  // Get current streak
  const streakRes = await fetch(`${supabaseUrl}/rest/v1/streaks?user_id=eq.${userId}`, { headers });
  const streakData = await streakRes.json();
  const streak = streakData[0];

  if (!streak) {
    // Create new streak
    await fetch(`${supabaseUrl}/rest/v1/streaks`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ user_id: userId, current_streak: 1, longest_streak: 1, last_active: today }),
    });
    return res.status(200).json({ current_streak: 1, longest_streak: 1 });
  }

  if (streak.last_active === today) {
    // Already active today
    return res.status(200).json({ current_streak: streak.current_streak, longest_streak: streak.longest_streak });
  }

  const newStreak = streak.last_active === yesterday ? streak.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, streak.longest_streak);

  await fetch(`${supabaseUrl}/rest/v1/streaks?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ current_streak: newStreak, longest_streak: newLongest, last_active: today }),
  });

  res.status(200).json({ current_streak: newStreak, longest_streak: newLongest });
}