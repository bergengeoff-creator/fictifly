export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const baseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  const today = new Date().toISOString().split('T')[0];

  // Check if today's prompt already exists
  const existingRes = await fetch(
    `${baseUrl}/rest/v1/daily_prompts?date=eq.${today}&select=*`,
    { headers }
  );
  const existing = await existingRes.json();

  if (existing && existing.length > 0) {
    return res.status(200).json(existing[0]);
  }

  // Generate a new prompt for today
  const GENRES = [
    'Action/Adventure','Comedy','Drama','Fairy Tale','Fantasy',
    'Ghost Story','Historical Fiction','Horror','Mystery',
    'Romance','Sci-Fi','Suspense','Thriller','Open Genre',
  ];
  const wordCounts = [100, 200, 300];
  const wordCount = wordCounts[Math.floor(Math.random() * wordCounts.length)];
  const genre = GENRES[Math.floor(Math.random() * GENRES.length)];

  const promptContent = `Generate 1 microfiction writing prompt for a ${wordCount}-word challenge. Genre: "${genre}". Provide an ACTION (a creative gerund word like "Wandering") and a WORD (a single evocative word like "Courage"). Respond ONLY with JSON, no markdown, no explanation: {"action":"...","word":"..."}`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: promptContent }],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    return res.status(500).json({ error: 'Claude API error', detail: errText });
  }

  const claudeData = await claudeRes.json();

  if (!claudeData.content || claudeData.content.length === 0) {
    return res.status(500).json({ error: 'Empty Claude response', detail: claudeData });
  }

  const text = claudeData.content.map(b => b.text || '').join('').trim();
  const clean = text.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    return res.status(500).json({ error: 'JSON parse failed', rawText: text, cleanText: clean });
  }

  if (!parsed.action || !parsed.word) {
    return res.status(500).json({ error: 'Missing fields in response', parsed });
  }

  // Save to database
  const insertRes = await fetch(
    `${baseUrl}/rest/v1/daily_prompts`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        date: today,
        prompt_type: 'microfiction',
        word_count: wordCount,
        genre,
        action: parsed.action,
        word: parsed.word,
      }),
    }
  );

  const inserted = await insertRes.json();

  if (!insertRes.ok) {
    return res.status(500).json({ error: 'DB insert failed', detail: inserted });
  }

  return res.status(200).json(inserted[0]);
}