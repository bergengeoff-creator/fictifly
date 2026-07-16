export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { userId, debug } = req.body;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    };

    // ── FETCH ALL BADGES ──────────────────────────────
    const badgesRes = await fetch(`${supabaseUrl}/rest/v1/badges?select=*`, { headers });
    const allBadges = await badgesRes.json();

    // ── FETCH USER'S EXISTING BADGES ─────────────────
    const userBadgesRes = await fetch(
      `${supabaseUrl}/rest/v1/user_badges?user_id=eq.${userId}&select=badge_id`,
      { headers }
    );
    const userBadges = await userBadgesRes.json();
    const earnedIds = userBadges.map(b => b.badge_id);

    // ── FETCH USER PROFILE (for account type checks) ──
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=account_type,is_premium,premium_expires_at`,
      { headers }
    );
    const profileData = await profileRes.json();
    const profile = profileData[0] || {};
    const isPremium = profile.is_premium || 
      (profile.premium_expires_at && new Date(profile.premium_expires_at) > new Date());
    const isStudent = profile.account_type === 'student';
    const isMinor = profile.account_type === 'minor';

    // ── FETCH STATS ───────────────────────────────────

    // Generator usage (First Spark trigger)
    const usageRes = await fetch(
      `${supabaseUrl}/rest/v1/prompt_usage?user_id=eq.${userId}&select=count`,
      { headers }
    );
    const usageData = await usageRes.json();
    const totalGenerated = usageData.reduce((sum, row) => sum + row.count, 0);

    // Streak
    const streakRes = await fetch(
      `${supabaseUrl}/rest/v1/streaks?user_id=eq.${userId}&select=current_streak`,
      { headers }
    );
    const streakData = await streakRes.json();
    const currentStreak = streakData[0]?.current_streak || 0;

    // Stories written (submissions)
    const subsRes = await fetch(
      `${supabaseUrl}/rest/v1/submissions?user_id=eq.${userId}&select=id,word_count,prompt_type`,
      { headers }
    );
    const subsData = await subsRes.json();
    const totalWritten = subsData.length;

    // Word count filtered submissions
    const totalMicro = subsData.filter(s =>
      s.word_count >= 100 && s.word_count <= 300
    ).length;
    const totalFlash = subsData.filter(s =>
      s.word_count >= 500 && s.word_count <= 1000
    ).length;

    // Saved prompts/stories
    const savedRes = await fetch(
      `${supabaseUrl}/rest/v1/saved_prompts?user_id=eq.${userId}&select=id,genre`,
      { headers }
    );
    const savedData = await savedRes.json();
    const totalSaved = savedData.length;

    // Total saves + submissions combined (for Prolific badges)
    const totalSavesAndSubmissions = totalSaved + totalWritten;

    // Unique genres across saves and submissions
    const genreRes = await fetch(
      `${supabaseUrl}/rest/v1/saved_prompts?user_id=eq.${userId}&select=genre`,
      { headers }
    );
    const genreData = await genreRes.json();
    const uniqueGenres = new Set(genreData.map(p => p.genre).filter(Boolean)).size;

    // Characters
    const charsRes = await fetch(
      `${supabaseUrl}/rest/v1/saved_characters?user_id=eq.${userId}&select=id`,
      { headers }
    );
    const charsData = await charsRes.json();
    const totalCharacters = charsData.length;

    // Unique genres across characters (for Genre Chameleon)
    const charGenreRes = await fetch(
      `${supabaseUrl}/rest/v1/saved_prompts?user_id=eq.${userId}&select=genre`,
      { headers }
    );
    const charGenreData = await charGenreRes.json();
    const uniqueAllGenres = new Set([
      ...genreData.map(p => p.genre),
      ...charGenreData.map(p => p.genre)
    ].filter(Boolean)).size;

    // Total submissions only (for Story Collector — premium)
    const totalSubmissions = totalWritten;

    // Peer feedback count (for Kind Reader — student only)
    const feedbackRes = await fetch(
      `${supabaseUrl}/rest/v1/peer_feedback?reviewer_id=eq.${userId}&select=id`,
      { headers }
    );
    const feedbackData = await feedbackRes.json();
    const totalFeedback = feedbackData.length;

    // Class submission check (for First Send — student only)
    const classSubRes = await fetch(
      `${supabaseUrl}/rest/v1/submissions?user_id=eq.${userId}&class_id=not.is.null&select=id`,
      { headers }
    );
    const classSubData = await classSubRes.json();
    const totalClassSubmissions = classSubData.length;

    // Rising Voice — first submission upvote check
    const upvoteRes = await fetch(
      `${supabaseUrl}/rest/v1/submissions?user_id=eq.${userId}&select=id,upvote_count&order=created_at.asc&limit=1`,
      { headers }
    );
    const upvoteData = await upvoteRes.json();
    const firstSubmissionUpvotes = upvoteData[0]?.upvote_count || 0;

    // Get Rising Voice threshold (teacher-configurable, default 25 for public / 10 for students)
    let risingVoiceThreshold = isStudent ? 10 : 25;
    if (isStudent && classSubData.length > 0) {
      // Try to get teacher-configured threshold for this student's class
      const thresholdRes = await fetch(
        `${supabaseUrl}/rest/v1/rising_voice_thresholds?class_id=eq.${classSubData[0]?.class_id}&select=threshold`,
        { headers }
      );
      const thresholdData = await thresholdRes.json();
      if (thresholdData[0]?.threshold) {
        risingVoiceThreshold = thresholdData[0].threshold;
      }
    }

    // ── BADGE EVALUATION ──────────────────────────────
    const newlyEarned = [];

    const shouldEarn = (badgeName, condition) => {
      const badge = allBadges.find(b => b.name === badgeName);
      if (badge && !earnedIds.includes(badge.id) && condition) {
        newlyEarned.push(badge);
      }
    };

    // ── ONBOARDING ────────────────────────────────────
    shouldEarn('First Spark', totalGenerated >= 1);
    shouldEarn('First Draft', totalWritten >= 1);

    // ── STREAKS ───────────────────────────────────────
    shouldEarn('On a Roll', currentStreak >= 7);
    shouldEarn('Unbroken', currentStreak >= 30);

    // ── WRITING VOLUME ────────────────────────────────
    shouldEarn('Storyteller', totalWritten >= 10);
    shouldEarn('Prolific Storyteller', totalSavesAndSubmissions >= 50);
    shouldEarn('Prolific Writer', totalSavesAndSubmissions >= 100);

    // ── FORM SPECIFIC ─────────────────────────────────
    shouldEarn('Microfiction Master', totalMicro >= 50);
    shouldEarn('Flash Fiction Fan', totalFlash >= 35);

    // ── EXPLORATION ───────────────────────────────────
    shouldEarn('Genre Explorer', uniqueGenres >= 5);
    shouldEarn('Genre Chameleon', uniqueAllGenres >= 10);

    // ── CHARACTERS ────────────────────────────────────
    shouldEarn('Character Study', totalCharacters >= 1);
    shouldEarn('Cast of Characters', totalCharacters >= 25);

    // ── COLLECTION (premium only) ─────────────────────
    shouldEarn('Story Collector', isPremium && totalSubmissions >= 25);

    // ── COMMUNITY ─────────────────────────────────────
    shouldEarn('Rising Voice',
      totalClassSubmissions >= 1 &&
      firstSubmissionUpvotes >= risingVoiceThreshold
    );

    // ── EDUCATION (student only) ──────────────────────
    shouldEarn('First Send', isStudent && totalClassSubmissions >= 1);
    shouldEarn('Kind Reader', isStudent && totalFeedback >= 3);

    // NOTE: Teacher's Pick, Top of Class, Most Improved are
    // teacher-awarded manually — not checked here

    // ── AWARD NEW BADGES ──────────────────────────────
    for (const badge of newlyEarned) {
      await fetch(`${supabaseUrl}/rest/v1/user_badges`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          user_id: userId,
          badge_id: badge.id,
          earned_at: new Date().toISOString()
        }),
      });
    }

    const response = {
      newlyEarned,
      totalEarned: earnedIds.length + newlyEarned.length
    };

    // ── DEBUG MODE ────────────────────────────────────
    if (debug) {
      response.debug = {
        stats: {
          totalGenerated,
          totalSaved,
          totalWritten,
          totalSavesAndSubmissions,
          currentStreak,
          totalMicro,
          totalFlash,
          uniqueGenres,
          uniqueAllGenres,
          totalCharacters,
          totalSubmissions,
          totalFeedback,
          totalClassSubmissions,
          firstSubmissionUpvotes,
          risingVoiceThreshold,
          isPremium,
          isStudent,
          isMinor,
        },
        allBadgesInDb: allBadges.map(b => ({ id: b.id, name: b.name, slug: b.slug })),
        earnedBadgeIds: earnedIds,
        badgesNotFoundInDb: [
          'First Spark', 'First Draft', 'On a Roll', 'Unbroken',
          'Storyteller', 'Prolific Storyteller', 'Prolific Writer',
          'Microfiction Master', 'Flash Fiction Fan',
          'Genre Explorer', 'Genre Chameleon',
          'Character Study', 'Cast of Characters',
          'Story Collector', 'Rising Voice',
          'First Send', 'Kind Reader',
        ].filter(name => !allBadges.find(b => b.name === name)),
      };
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error('check-badges error:', err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}