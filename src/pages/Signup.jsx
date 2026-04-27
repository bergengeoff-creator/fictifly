import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const adjectives = ['Swift','Brave','Clever','Bold','Bright','Calm','Keen','Wise','Wild','Quiet'];
const nouns = ['Penguin','Narrator','Scribe','Author','Dreamer','Writer','Poet','Falcon','Otter','Fox'];
const generateUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return adj + noun + num;
};

const personalDomains = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'aol.com','live.com','msn.com','me.com','mac.com','protonmail.com',
  'mail.com','ymail.com','googlemail.com'
];

const isSchoolEmail = (email) => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  return !personalDomains.includes(domain.toLowerCase());
};

export default function Signup() {
  const { state } = useLocation();
  const isMinor = state ? state.isMinor : false;
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(isMinor ? 'minor' : 'standard');
  const [username, setUsername] = useState(generateUsername());
  const [usernameMode, setUsernameMode] = useState('random');
  const [customUsername, setCustomUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [parentConsent, setParentConsent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshUsername = () => setUsername(generateUsername());

  const getFinalUsername = () => {
    if (isMinor) return username;
    return usernameMode === 'random' ? username : customUsername.trim();
  };

  const handleGoogleSignup = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/profile-setup' },
    });
    if (oauthError) setError(oauthError.message);
  };

  const handleMinorSignup = async () => {
    if (passcode.length < 4) { setError('Passcode must be at least 4 digits.'); return; }
    if (passcode !== confirmPasscode) { setError('Passcodes do not match.'); return; }
    if (!parentConsent) { setError('Please confirm parent or guardian consent.'); return; }
    setLoading(true);
    const finalUsername = getFinalUsername();
    const minorEmail = finalUsername.toLowerCase() + '@minor.fictifly.com';
    const { data, error: signUpError } = await supabase.auth.signUp({ email: minorEmail, password: passcode });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data && data.user) {
      const { error: insertError } = await supabase.from('users').insert({ id: data.user.id, username: finalUsername, account_type: 'minor', is_minor: true, age_verified: true });
      if (insertError) { setError('Profile error: ' + insertError.message); setLoading(false); return; }
    }
    setLoading(false);
    navigate('/profile-setup');
  };

  const handleStandardSignup = async () => {
    const finalUsername = getFinalUsername();
    if (!finalUsername) { setError('Please enter or generate a username.'); return; }
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (accountType === 'teacher' && !isSchoolEmail(email)) {
      setError('Educator accounts require a school or institutional email address. Personal email providers like Gmail or Outlook are not accepted.');
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data && data.user) {
      const { error: insertError } = await supabase.from('users').insert({ id: data.user.id, username: finalUsername, account_type: accountType === 'teacher' ? 'teacher' : 'standard', is_minor: false, age_verified: true });
      if (insertError) { setError('Profile error: ' + insertError.message); setLoading(false); return; }
    }
    setLoading(false);
    navigate('/profile-setup');
  };

  const inputStyle = { width: '100%', background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#3A3226', fontFamily: 'sans-serif', fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' };
  const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', display: 'block', marginBottom: '0.5rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%' }}>
        <h1 style={{ color: '#3A3226', marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h1>

        {!isMinor && (
          <div>
            <button onClick={handleGoogleSignup} style={{ width: '100%', background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '10px', padding: '0.7rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.25rem', color: '#3A3226' }}>
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
              <span style={{ fontSize: '0.78rem', color: '#9A8878' }}>or sign up with email</span>
              <div style={{ flex: 1, height: '1px', background: '#D9C9B0' }} />
            </div>
          </div>
        )}

        {!isMinor && (
          <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '1.5rem' }}>
            {['standard','teacher'].map((type) => (
              <button key={type} onClick={() => { setAccountType(type); setError(null); }}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: accountType === type ? '#FFFCF8' : 'transparent', color: accountType === type ? '#3A3226' : '#9A8878', fontWeight: accountType === type ? 600 : 400, cursor: 'pointer' }}>
                {type === 'teacher' ? 'Educator' : 'Writer'}
              </button>
            ))}
          </div>
        )}

        {isMinor ? (
          <div style={{ background: '#F5EFE6', borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#9A8878', marginBottom: '0.25rem' }}>Your username</div>
            <div style={{ fontSize: '1.3rem', color: '#3A3226', fontStyle: 'italic', marginBottom: '0.5rem' }}>{username}</div>
            <button onClick={refreshUsername} style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.78rem', padding: '0.3rem 0.75rem', cursor: 'pointer' }}>
              Generate another
            </button>
            <div style={{ fontSize: '0.75rem', color: '#6B5D4E', marginTop: '0.5rem' }}>Write this down — you will need it to log in!</div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Username</label>
            <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '0.75rem' }}>
              {['random','custom'].map((mode) => (
                <button key={mode} onClick={() => setUsernameMode(mode)}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', border: 'none', background: usernameMode === mode ? '#FFFCF8' : 'transparent', color: usernameMode === mode ? '#3A3226' : '#9A8878', fontWeight: usernameMode === mode ? 600 : 400, cursor: 'pointer', fontSize: '0.85rem' }}>
                  {mode === 'random' ? 'Random' : 'Choose my own'}
                </button>
              ))}
            </div>
            {usernameMode === 'random' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#3A3226', fontStyle: 'italic' }}>{username}</div>
                <button onClick={refreshUsername} style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.78rem', padding: '0.6rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>New one</button>
              </div>
            ) : (
              <div>
                <input type="text" value={customUsername} onChange={(e) => setCustomUsername(e.target.value)} placeholder="Choose a username..." maxLength={30} style={inputStyle} />
                <div style={{ fontSize: '0.75rem', color: '#9A8878', marginTop: '0.25rem' }}>No spaces or special characters please.</div>
              </div>
            )}
          </div>
        )}

        {isMinor ? (
          <div>
            <label style={labelStyle}>Passcode (4-6 digits)
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} maxLength={6} style={{ ...inputStyle, marginTop: '0
