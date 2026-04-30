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

  const promptContent = `Generate 1 microfiction writing prompt for a ${wordCount}-word challenge.
Genre: "${genre}"
Provide:
- An ACTION: a creative gerund word (e.g. "Wandering", "Unraveling", "Dissolving")
- A WORD: a single evocative word (e.g. "Courage", "Mirror", "Threshold")

${wordCount === 100
  ? 'This is a 100-WORD challenge. Choose ingredients that point to a single contained moment or emotional beat.'
  : wordCount === 200
  ? 'This is a 200-WORD challenge. Choose ingredients that suggest a small but complete arc.'
  : 'This is a 300-WORD challenge. Choose ingredients that can carry real narrative complexity.'}

Respond ONLY with JSON, no markdown:
{"action":"...","word":"..."}`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: promptContent }],
    }),
  });

  const claudeData = await claudeRes.json();
  const text = claudeData.content?.map(b => b.text || '').join('') || '';
  const clean = text.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    return res.status(500).json({ error: 'Failed to generate daily prompt.' });
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
    return res.status(500).json({ error: 'Failed to save daily prompt.' });
  }

  return res.status(200).json(inserted[0]);
}