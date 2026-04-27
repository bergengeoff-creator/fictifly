import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const B = {
  sand:      "#F5EFE6",
  sandMid:   "#EDE3D4",
  sandDeep:  "#D9C9B0",
  terra:     "#D4845A",
  terraDark: "#B56840",
  seaMid:    "#5B9EC9",
  seaDeep:   "#2E6DA4",
  ink:       "#3A3226",
  inkMid:    "#6B5D4E",
  inkLight:  "#9A8878",
  white:     "#FFFCF8",
};

export default function Login() {
  const [isMinor, setIsMinor] = useState(false);
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleMinorLogin = async () => {
    if (!username || !passcode) {
      setError('Please enter your username and passcode.');
      return;
    }
    setLoading(true);
    const minorEmail = `${username.toLowerCase()}@minor.fictifly.com`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: minorEmail,
      password: passcode,
    });
    if (signInError) {
      setError('Invalid username or passcode. Please try again.');
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/dashboard');
  };

  const handleStandardLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: B.sand,
      backgroundImage: `radial-gradient(ellipse at 5% 5%, rgba(91,158,201,0.13) 0%, transparent 45%), radial-gradient(ellipse at 95% 90%, rgba(212,132,90,0.11) 0%, transparent 45%)`,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
      `}</style>

      <div style={{
        background: B.white,
        border: `1px solid ${B.sandDeep}`,
        borderRadius: '16px',
        padding: '2.5rem',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 2px 24px rgba(58,50,38,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <svg width="52" height="24" viewBox="0 0 52 24" fill="none" style={{ marginBottom: '1.2rem' }}>
            <path d="M4 16 C10 7, 18 7, 26 16 C34 25, 42 25, 48 16" stroke={B.seaMid} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.terra, marginBottom: '0.8rem' }}>
            Welcome Back
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 700, color: B.ink, lineHeight: 1.1 }}>
            Sign in to continue
          </h1>
        </div>

        {/* Login type toggle */}
        <div style={{ display: 'flex', background: B.sandMid, borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '1.5rem' }}>
          {[
            { value: false, label: 'Writer / Educator' },
            { value: true, label: 'Student' },
          ].map(option => (
            <button key={String(option.value)} onClick={() => { setIsMinor(option.value); setError(null); }} style={{
              flex: 1, padding: '0.5rem', borderRadius: '8px',
              border: 'none',
              background: isMinor === option.value ? B.white : 'transparent',
              color: isMinor === option.value ? B.ink : B.inkLight,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: isMinor === option.value ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: isMinor === option.value ? '0 1px 4px rgba(58,50,38,0.1)' : 'none',
              transition: 'all 0.18s',
            }}>{option.label}</button>
          ))}
        </div>

        {isMinor ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. SwiftNarrator47"
                style={{ width: '100%', background: B.sand, border: `1.5px solid ${B.sandDeep}`, borderRadius: '8px', color: B.ink, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="••••••"
                maxLength={6}
                style={{ width: '100%', background: B.sand, border: `1.5px solid ${B.sandDeep}`, borderRadius: '8px', color: B.ink, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', background: B.sand, border: `1.5px solid ${B.sandDeep}`, borderRadius: '8px', color: B.ink, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                style={{ width: '100%', background: B.sand, border: `1.5px solid ${B.sandDeep}`, borderRadius: '8px', color: B.ink, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' }}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: B.seaDeep, textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '8px', color: B.terraDark, padding: '0.75rem 1rem', fontSize: '0.85rem', marginTop: '1rem' }}>
            {error}
          </div>
        )}

        <button
          onClick={isMinor ? handleMinorLogin : handleStandardLogin}
          disabled={loading}
          style={{
            background: loading ? B.sandDeep : B.seaDeep,
            color: B.white, border: 'none', borderRadius: '10px',
            padding: '0.75rem 2rem',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%', marginTop: '1.5rem',
            transition: 'background 0.18s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = B.seaMid; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = B.seaDeep; }}
        >
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: B.inkMid }}>
          Don't have an account? <Link to="/age-gate" style={{ color: B.seaDeep, fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}