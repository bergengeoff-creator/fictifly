import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const FictiflyLogo = () => (
  <svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '220px', height: '69px', display: 'block', margin: '0 auto 1.75rem' }}>
    <text x="0" y="120" fontSize="96" fontWeight="600" letterSpacing="-5" fontFamily="system-ui, sans-serif">
      <tspan fill="#3A3226">ficti</tspan><tspan fill="#D4845A">fly</tspan>
    </text>
    <rect x="0" y="142" width="56" height="9" rx="4.5" fill="#5B9EC9" opacity="0.35"/>
    <rect x="68" y="140" width="64" height="11" rx="5.5" fill="#5B9EC9" opacity="0.55"/>
    <rect x="144" y="138" width="72" height="13" rx="6.5" fill="#5B9EC9" opacity="0.75"/>
    <rect x="228" y="136" width="80" height="15" rx="7.5" fill="#5B9EC9"/>
    <rect x="320" y="136" width="80" height="15" rx="7.5" fill="none" stroke="#D9C9B0" strokeWidth="1.5"/>
    <rect x="412" y="136" width="80" height="15" rx="7.5" fill="none" stroke="#D9C9B0" strokeWidth="1.5"/>
    <rect x="504" y="136" width="80" height="15" rx="7.5" fill="none" stroke="#D9C9B0" strokeWidth="1.5"/>
  </svg>
);

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleSession = async (session) => {
      if (!session) return;

      // Check if a pending profile exists in localStorage from signup.
      // This is set by Signup.jsx because no session exists at signup time
      // when email verification is required — the insert must happen here
      // after confirmation, when the user has a valid verified JWT.
      const pending = localStorage.getItem('fictifly_pending_profile');
      if (pending) {
        try {
          const { id, username, account_type } = JSON.parse(pending);
          // Only insert if this session matches the pending profile
          if (id === session.user.id) {
            const { error: insertError } = await supabase.from('users').insert({
              id,
              username,
              account_type,
              is_minor: false,
              age_verified: true,
              profile_public: false,
              profile_complete: false,
              recovery_type: 'teacher',
            });
            if (insertError) {
              // If it already exists (e.g. double-click on link), that's fine
              if (!insertError.message.includes('duplicate') && !insertError.message.includes('already exists')) {
                console.error('Profile insert error:', insertError);
                setError('Account confirmed but profile setup failed. Please contact support.');
                return;
              }
            }
            localStorage.removeItem('fictifly_pending_profile');
          }
        } catch (e) {
          console.error('Failed to parse pending profile:', e);
          localStorage.removeItem('fictifly_pending_profile');
        }
      }

      // Check if profile is already complete (returning user clicking old link)
      const { data: profile } = await supabase
        .from('users')
        .select('profile_complete')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.profile_complete) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/profile-setup', { replace: true });
      }
    };

    // Supabase automatically exchanges the token from the URL fragment.
    // We listen for the session to confirm it worked, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
          await handleSession(session);
        }
      }
    );

    // Fallback: if the session is already active when this page loads
    // (token was in URL hash and auto-exchanged before listener attached)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
    });

    // Timeout fallback — if nothing resolves in 8 seconds, show an error
    const timeout = setTimeout(() => {
      setError('The confirmation link may have expired. Please try signing in or request a new link.');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <FictiflyLogo />

        {error ? (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3A3226', marginBottom: '0.5rem' }}>
              Link expired or invalid
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#6B5D4E', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {error}
            </p>
            <a
              href="/login"
              style={{ display: 'block', background: '#2E6DA4', color: '#FFFCF8', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', marginBottom: '0.75rem' }}
            >
              Go to sign in
            </a>
            <a
              href="/signup"
              style={{ display: 'block', background: 'transparent', border: '1px solid #D9C9B0', color: '#6B5D4E', borderRadius: '10px', padding: '0.75rem', fontWeight: 500, fontSize: '0.88rem', textDecoration: 'none' }}
            >
              Create a new account
            </a>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3A3226', marginBottom: '0.5rem' }}>
              Confirming your account…
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#9A8878' }}>
              You'll be redirected in a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}