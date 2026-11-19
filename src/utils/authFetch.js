import { supabase } from '../supabase';

// fetch() for our own /api routes: attaches the signed-in user's Supabase access token so
// the server can tell who is calling. Server functions derive identity from this token,
// never from IDs in the request body.
export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return fetch(url, { ...options, headers });
}
