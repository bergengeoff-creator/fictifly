// /api/generate.js
// Authenticated proxy to the Anthropic Messages API. The Anthropic key lives only in the
// server-side ANTHROPIC_API_KEY env var; the browser never sees it.
//
// Only signed-in users can call this, only allow-listed models are accepted, and output /
// input sizes are capped, so the endpoint can't be used as a free general-purpose proxy.

import { handleCors, requireUser, getAnthropicKey } from './_lib/security';

const ALLOWED_MODELS = new Set(['claude-sonnet-4-6', 'claude-haiku-4-5-20251001']);
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_OUTPUT_TOKENS = 1500;
const MAX_INPUT_CHARS = 20000;
const MAX_MESSAGES = 10;

function validate(body) {
  if (!body || typeof body !== 'object') return 'Invalid request.';
  const { messages, system } = body;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return 'Invalid messages.';
  }
  let chars = typeof system === 'string' ? system.length : 0;
  if (system !== undefined && typeof system !== 'string') return 'Invalid system prompt.';
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return 'Invalid message.';
    }
    chars += m.content.length;
  }
  if (chars > MAX_INPUT_CHARS) return 'Request is too long.';
  return null;
}

export default async function handler(req, res) {
  if (handleCors(req, res, 'POST')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  const body = req.body;
  const problem = validate(body);
  if (problem) return res.status(400).json({ error: problem });

  const model = ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
  const requested = Number.isInteger(body.max_tokens) ? body.max_tokens : 1000;
  const payload = {
    model,
    max_tokens: Math.min(Math.max(requested, 1), MAX_OUTPUT_TOKENS),
    messages: body.messages.map(({ role, content }) => ({ role, content })),
  };
  if (typeof body.system === 'string') payload.system = body.system;
  if (typeof body.temperature === 'number') {
    payload.temperature = Math.min(Math.max(body.temperature, 0), 1);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getAnthropicKey(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('generate: Anthropic error', response.status, data?.error?.type);
      return res.status(502).json({ error: 'Generation failed. Please try again.' });
    }
    return res.status(200).json({ content: data.content, stop_reason: data.stop_reason });
  } catch (err) {
    console.error('generate: request failed:', err.message);
    return res.status(502).json({ error: 'Generation failed. Please try again.' });
  }
}
