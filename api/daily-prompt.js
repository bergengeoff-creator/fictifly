import { handleCors, getSupabaseUrl, getServiceHeaders, getAnthropicKey } from './_lib/security';

// Public, read-mostly endpoint: returns today's shared prompt, generating it once per day.
// Prompts are fixed server-side, so callers can't steer what the Anthropic key is used for.
export default async function handler(req, res) {
  if (handleCors(req, res, 'GET')) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const baseUrl = getSupabaseUrl();
  const headers = getServiceHeaders();

  const today = new Date().toISOString().split('T')[0];

  // Check if today's prompt already exists
  const existingRes = await fetch(
    `${baseUrl}/rest/v1/daily_prompts?date=eq.${today}&select=*`,
    { headers }
  );
  const existing = await existingRes.json();
  if (existing && existing.length > 0) return res.status(200).json(existing[0]);

  // Determine challenge type — character day roughly 2x per week
  // Use date hash for consistency across all users on the same day
  const dateNum = parseInt(today.replace(/-/g, ''), 10);
  const isCharacterDay = dateNum % 7 < 2; // 2 out of every 7 days

  const GENRES = [
    'Action/Adventure','Comedy','Drama','Fairy Tale','Fantasy',
    'Ghost Story','Historical Fiction','Horror','Mystery',
    'Romance','Sci-Fi','Suspense','Thriller','Open Genre',
  ];
  const wordCounts = [100, 200, 300];
  const wordCount = wordCounts[Math.floor(Math.random() * wordCounts.length)];
  const genre = GENRES[Math.floor(Math.random() * GENRES.length)];

  const claudeHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': getAnthropicKey(),
    'anthropic-version': '2023-06-01',
  };

  let insertPayload;

  if (isCharacterDay) {
    // ── Character day ──────────────────────────────────────────────────────
    const charPrompt = `Generate a fictional character for a ${wordCount}-word microfiction writing challenge. Genre: "${genre}".

Generate a character with these fields AND a writing prompt tailored to them.

Respond ONLY with JSON, no markdown, no explanation:
{
  "name": "optional name or null",
  "profession": "short job title or role",
  "background": "one sentence",
  "personality": "short phrase",
  "flaw": "short phrase",
  "motivation": "short phrase",
  "writing_prompt": "A 1-2 sentence writing prompt that puts this specific character in a situation. Reference their profession or background. Make it active and specific."
}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: claudeHeaders,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: charPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      console.error('daily-prompt: Anthropic error', claudeRes.status);
      return res.status(502).json({ error: 'Could not generate today\'s prompt.' });
    }

    const claudeData = await claudeRes.json();
    const text = claudeData.content.map(b => b.text || '').join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) { return res.status(502).json({ error: 'Could not generate today\'s prompt.' }); }

    insertPayload = {
      date: today,
      prompt_type: 'microfiction',
      word_count: wordCount,
      genre,
      challenge_type: 'character',
      character_data: parsed,
    };

  } else {
    // ── Standard day ──────────────────────────────────────────────────────
    const promptContent = `Generate 1 microfiction writing prompt for a ${wordCount}-word challenge. Genre: "${genre}". Provide an ACTION (a creative gerund word like "Wandering") and a WORD (a single evocative word like "Courage"). Respond ONLY with JSON, no markdown, no explanation: {"action":"...","word":"..."}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: claudeHeaders,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{ role: 'user', content: promptContent }],
      }),
    });

    if (!claudeRes.ok) {
      console.error('daily-prompt: Anthropic error', claudeRes.status);
      return res.status(502).json({ error: 'Could not generate today\'s prompt.' });
    }

    const claudeData = await claudeRes.json();
    const text = claudeData.content.map(b => b.text || '').join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) { return res.status(502).json({ error: 'Could not generate today\'s prompt.' }); }

    if (!parsed.action || !parsed.word) {
      return res.status(502).json({ error: 'Could not generate today\'s prompt.' });
    }

    insertPayload = {
      date: today,
      prompt_type: 'microfiction',
      word_count: wordCount,
      genre,
      challenge_type: 'standard',
      action: parsed.action,
      word: parsed.word,
    };
  }

  const insertRes = await fetch(`${baseUrl}/rest/v1/daily_prompts`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(insertPayload),
  });

  const inserted = await insertRes.json();
  if (!insertRes.ok) {
    console.error('daily-prompt: insert failed', insertRes.status);
    return res.status(500).json({ error: 'Could not save today\'s prompt.' });
  }
  return res.status(200).json(inserted[0]);
}