export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { userId } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
  };

  // Fetch all badges
  const badgesRes = await fetch(`${supabaseUrl}/rest/v1/badges?select=*`, { headers });
  const allBadges = await badgesRes.json();

  // Fetch user's existing badges
  const userBadgesRes = await fetch(`${supabaseUrl}/rest/v1/user_badges?user_id=eq.${userId}&select=badge_id`, { headers });
  const userBadges = await userBadgesRes.json();
  const earnedIds = userBadges.map(b => b.badge_id);

  // Fetch stats
  const usageRes = await fetch(`${supabaseUrl}/rest/v1/prompt_usage?user_id=eq.${userId}&select=count`, { headers });
  const usageData = await usageRes.json();
  const totalGenerated = usageData.reduce((sum, row) => sum + row.count, 0);

  const savedRes = await fetch(`${supabaseUrl}/rest/v1/saved_prompts?user_id=eq.${userId}&select=id`, { headers });
  const savedData = await savedRes.json();
  const totalSaved = savedData.length;

  const streakRes = await fetch(`${supabaseUrl}/rest/v1/streaks?user_id=eq.${userId}&select=current_streak`, { headers });
  const streakData = await streakRes.json();
  const currentStreak = streakData[0] ? streakData[0].current_streak : 0;

  const microRes = await fetch(`${supabaseUrl}/rest/v1/saved_prompts?user_id=eq.${userId}&prompt_type=eq.microfiction&select=id`, { headers });
  const microData = await microRes.json();
  const totalMicro = microData.length;

  const flashRes = await fetch(`${supabaseUrl}/rest/v1/saved_prompts?user_id=eq.${userId}&prompt_type=eq.flash-fiction&select=id`, { headers });
  const flashData = await flashRes.json();
  const totalFlash = flashData.length;

  const genreRes = await fetch(`${supabaseUrl}/rest/v1/saved_prompts?user_id=eq.${userId}&select=genre`, { headers });
  const genreData = await genreRes.json();
  const uniqueGenres = new Set(genreData.map(p => p.genre)).size;

  const subsRes = await fetch(`${supabaseUrl}/rest/v1/submissions?user_id=eq.${userId}&select=id`, { headers });
  const subsData = await subsRes.json();
  const totalWritten = subsData.length;

  // Check which badges should be earned
  const newlyEarned = [];

  const shouldEarn = (badgeName, condition) => {
    const badge = allBadges.find(b => b.name === badgeName);
    if (badge && !earnedIds.includes(badge.id) && condition) {
      newlyEarned.push(badge);
    }
  };

  shouldEarn('First Spark', totalGenerated >= 1);
  shouldEarn('Story Hoarder', totalSaved >= 10);
  shouldEarn('Dedicated Writer', currentStreak >= 3);
  shouldEarn('Week Warrior', currentStreak >= 7);
  shouldEarn('Genre Explorer', uniqueGenres >= 5);
  shouldEarn('Microfiction Master', totalMicro >= 50);
  shouldEarn('Flash Fiction Fan', totalFlash >= 50);
  shouldEarn('Prolific Writer', totalGenerated >= 100);
  shouldEarn('First Draft', totalWritten >= 1);
  shouldEarn('Storyteller', totalWritten >= 10);
  shouldEarn('Prolific Storyteller', totalWritten >= 50);

  // Award new badges
  for (const badge of newlyEarned) {
    await fetch(`${supabaseUrl}/rest/v1/user_badges`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ user_id: userId, badge_id: badge.id }),
    });
  }

  res.status(200).json({ newlyEarned, totalEarned: earnedIds.length + newlyEarned.length });
}