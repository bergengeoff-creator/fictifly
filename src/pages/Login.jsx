import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function Login() {
  const [isMinor, setIsMinor] = useState(false);
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showForgotPasscode, setShowForgotPasscode] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  const navigate = useNavigate();

  const handleMinorLogin = async () => {
    if (!username || !passcode) { setError('Please enter your username and passcode.'); return; }
    setLoading(true);
    const minorEmail = username.toLowerCase() + '@minor.fictifly.com';
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: minorEmail, password: passcode });
    if (signInError) { setError('Invalid username or passcode. Please try again.'); setLoading(false); return; }
    setLoading(false);
    navigate('/dashboard');
  };

  const handleStandardLogin = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError('Invalid email or password. Please try again.'); setLoading(false); return; }
    setLoading(false);
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
    if (error) setError(error.message);
  };

  const handleForgotPasscode = async () => {
    if (!forgotUsername.trim()) { setForgotError('Please enter your username.'); return; }
    setForgotLoading(true);
    setForgotError(null);

    try {
      const response = await fetch('/api/request-passcode-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setForgotError(data.error || 'Something went wrong. Please ask your teacher for help.');
        setForgotLoading(false);
        return;
      }
      setForgotSuccess(true);
    } catch {
      setForgotError('Something went wrong. Please ask your teacher for help directly.');
    }
    setForgotLoading(false);
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#3A3226', fontFamily: 'sans-serif', fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' };
  const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', display: 'block', marginBottom: '0.5rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%' }}>
        <FictiflyLogo />

        {showForgotPasscode ? (
          <div>
            <h1 style={{ color: '#3A3226', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem' }}>Forgot passcode?</h1>
            <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6B5D4E', marginBottom: '1.5rem' }}>
              Enter your username and we'll notify your teacher to reset it.
            </p>

            {forgotSuccess ? (
              <div>
                <div style={{ background: '#F0F7ED', border: '1px solid #6BAF72', borderRadius: '10px', color: '#3A7040', padding: '1rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Request sent! ✓</div>
                  <div style={{ fontSize: '0.85rem' }}>Your teacher has been notified. Ask them to approve your passcode reset — they'll give you a new one.</div>
                </div>
                <button onClick={() => { setShowForgotPasscode(false); setForgotSuccess(false); setForgotUsername(''); }}
                  style={{ width: '100%', background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                  Back to sign in
                </button>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Your username
                  <input type="text" value={forgotUsername} onChange={e => setForgotUsername(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleForgotPasscode(); }}
                    placeholder="e.g. SwiftNarrator47" style={{ ...inputStyle, marginTop: '0.4rem' }} />
                </label>
                {forgotError && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>{forgotError}</div>}
                <button onClick={handleForgotPasscode} disabled={forgotLoading}
                  style={{ width: '100%', background: forgotLoading ? '#D9C9B0' : '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: forgotLoading ? 'not-allowed' : 'pointer', marginTop: '1rem' }}>
                  {forgotLoading ? 'Sending request...' : 'Request passcode reset'}
                </button>
                <button onClick={() => { setShowForgotPasscode(false); setForgotError(null); setForgotUsername(''); }}
                  style={{ width: '100%', background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '10px', padding: '0.75rem', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer', marginTop: '0.75rem', color: '#6B5D4E' }}>
                  Back to sign in
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1 style={{ color: '#3A3226', marginBottom: '1.5rem', textAlign: 'center' }}>Sign in</h1>

            <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '1.5rem' }}>
              {[{ value: false, label: 'Writer / Educator' }, { value: true, label: 'Student' }].map((option) => (
                <button key={String(option.value)} onClick={() => { setIsMinor(option.value); setError(null); }}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: isMinor === option.value ? '#FFFCF8' : 'transparent', color: isMinor === option.value ? '#3A3226' : '#9A8878', fontWeight: isMinor === option.value ? 600 : 400, cursor: 'pointer' }}>
                  {option.label}
                </button>
              ))}
            </div>

            {!isMinor && (
              <div>
                <button onClick={handleGoogleLogin} style={{ width: '100%', background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '10px', padding: '0.7rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.25rem', color: '#3A3226' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#D9C9B0' }} />
                  <span style={{ fontSize: '0.78rem', color: '#9A8878' }}>or sign in with email</span>
                  <div style={{ flex: 1, height: '1px', background: '#D9C9B0' }} />
                </div>
              </div>
            )}

            {isMinor ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={labelStyle}>Username
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. SwiftNarrator47" style={{ ...inputStyle, marginTop: '0.4rem' }} />
                </label>
                <label style={labelStyle}>Passcode
                  <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} maxLength={6} style={{ ...inputStyle, marginTop: '0.4rem' }} />
                </label>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => { setShowForgotPasscode(true); setForgotUsername(username); setError(null); }}
                    style={{ background: 'none', border: 'none', fontSize: '0.82rem', color: '#2E6DA4', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
                    Forgot passcode?
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={labelStyle}>Email address
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...inputStyle, marginTop: '0.4rem' }} />
                </label>
                <label style={labelStyle}>Password
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" style={{ ...inputStyle, marginTop: '0.4rem' }} />
                </label>
                <div style={{ textAlign: 'right' }}>
                  <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
                </div>
              </div>
            )}

            {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginTop: '1rem' }}>{error}</div>}

            <button onClick={isMinor ? handleMinorLogin : handleStandardLogin} disabled={loading}
              style={{ background: loading ? '#D9C9B0' : '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', marginTop: '1.5rem' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#6B5D4E' }}>
              Don't have an account? <Link to="/age-gate" style={{ color: '#2E6DA4', fontWeight: 600 }}>Sign up</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}