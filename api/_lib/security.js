// /api/_lib/security.js
// Shared server-side helpers for Vercel functions. Files under an underscore-prefixed
// path are not deployed as routes, so nothing here is reachable from the browser.
//
// Rules this module enforces:
//   - Secrets (service-role key, Anthropic key) are read ONLY from server-side env vars.
//     Never fall back to a REACT_APP_* var for a secret: CRA treats REACT_APP_* as public.
//   - Any endpoint that uses the service-role key must establish who the caller is from
//     their Supabase access token, never from a userId/teacherId sent in the request body.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

// Supabase project URL is public, so the REACT_APP_ fallback is fine for it.
export function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
}

export function getServiceHeaders() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };
}

export function getAnthropicKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not configured');
  return key;
}

// The app calls its own /api on the same origin, so no CORS headers are needed.
// If another origin ever needs access, list it in ALLOWED_ORIGINS (comma-separated).
// Returns true when the request was a preflight that has been answered.
export function handleCors(req, res, methods) {
  const origin = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', `${methods}, OPTIONS`);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

// Validates the caller's Supabase access token. On failure, sends a 401 and returns null.
export async function requireUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    res.status(401).json({ error: 'Not signed in.' });
    return null;
  }
  try {
    const r = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!r.ok) {
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return null;
    }
    const user = await r.json();
    if (!user || !isUuid(user.id)) {
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return null;
    }
    return user;
  } catch (err) {
    console.error('requireUser: token check failed:', err.message);
    res.status(401).json({ error: 'Could not verify session.' });
    return null;
  }
}

export async function getProfile(userId) {
  if (!isUuid(userId)) return null;
  const r = await fetch(
    `${getSupabaseUrl()}/rest/v1/users?id=eq.${userId}&select=id,account_type,is_premium,premium_expires_at`,
    { headers: getServiceHeaders() }
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0] || null;
}

// True if `teacherId` owns the class `classId`.
export async function teacherOwnsClass(teacherId, classId) {
  if (!isUuid(teacherId) || !isUuid(classId)) return false;
  const r = await fetch(
    `${getSupabaseUrl()}/rest/v1/classes?id=eq.${classId}&teacher_id=eq.${teacherId}&select=id`,
    { headers: getServiceHeaders() }
  );
  if (!r.ok) return false;
  const rows = await r.json();
  return rows.length > 0;
}

// True if `studentId` is a member of any class owned by `teacherId`.
export async function teacherHasStudent(teacherId, studentId) {
  if (!isUuid(teacherId) || !isUuid(studentId)) return false;
  const headers = getServiceHeaders();
  const mr = await fetch(
    `${getSupabaseUrl()}/rest/v1/class_members?student_id=eq.${studentId}&select=class_id`,
    { headers }
  );
  if (!mr.ok) return false;
  const classIds = (await mr.json()).map((m) => m.class_id).filter(isUuid);
  if (classIds.length === 0) return false;
  const cr = await fetch(
    `${getSupabaseUrl()}/rest/v1/classes?id=in.(${classIds.join(',')})&teacher_id=eq.${teacherId}&select=id`,
    { headers }
  );
  if (!cr.ok) return false;
  return (await cr.json()).length > 0;
}
