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
  const [username] = useState(generateUsername());
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMinorSignup = async () => {
    if (passcode.length < 4) { setError('Passcode must be at least 4 digits.'); return; }
    if (passcode !== confirmPasscode) { setError('Passcodes do not match.'); return; }
    if (!parentConsent) { setError('Please confirm parent or guardian consent.'); return; }
    setLoading(true);
    const minorEmail = username.toLowerCase() + '@minor.fictifly.com';
    const { data, error: signUpError } = await supabase.auth.signUp({ email: minorEmail, password: passcode });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    await supabase.from('users').insert({ id: data.user.id, username, account_type: 'minor', is_minor: true, age_verified: true });
    setLoading(false);
    navigate('/dashboard');
  };

  const handleStandardSignup = async () => {
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
    await supabase.from('users').insert({ id: data.user.id, username, account_type: accountType === 'teacher' ? 'teacher' : 'standard', is_minor: false, age_verified: true });
    setLoading(false);
    navigate('/dashboard');
  };

  const inputStyle = { width: '100%', background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#3A3226', fontFamily: 'sans-serif', fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none', marginTop: '0.4rem' };
  const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', display: 'block', marginBottom: '0.25rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%' }}>
        <h1 style={{ color: '#3A3226', marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h1>

        {!isMinor && (
          <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '1.5rem' }}>
            {['standard', 'teacher'].map((type) => (
              <button key={type} onClick={() => { setAccountType(type); setError(null); }}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: accountType === type ? '#FFFCF8' : 'transparent', color: accountType === type ? '#3A3226' : '#9A8878', fontWeight: accountType === type ? 600 : 400, cursor: 'pointer' }}>
                {type === 'teacher' ? 'Educator' : 'Writer'}
              </button>
            ))}
          </div>
        )}

        {isMinor ? (
          <div>
            <div style={{ background: '#F5EFE6', borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9A8878', marginBottom: '0.25rem' }}>Your username</div>
              <div style={{ fontSize: '1.3rem', color: '#3A3226', fontStyle: 'italic' }}>{username}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B5D4E', marginTop: '0.25rem' }}>Write this down — you will need it to log in!</div>
            </div>
            <label style={labelStyle}>Passcode (4-6 digits)
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} maxLength={6} placeholder="      " style={inputStyle} />
            </label>
            <label style={{ ...labelStyle, marginTop: '0.75rem' }}>Confirm passcode
              <input type="password" value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value)} maxLength={6} placeholder="      " style={inputStyle} />
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={parentConsent} onChange={(e) => setParentConsent(e.target.checked)} style={{ marginTop: '3px' }} />
              <span style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>A parent or guardian is aware of and consents to this account.</span>
            </label>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>
              {accountType === 'teacher' ? 'School or institutional email address' : 'Email address'}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={accountType === 'teacher' ? 'you@school.edu' : 'you@example.com'} style={inputStyle} />
            </label>
            {accountType === 'teacher' && (
              <p style={{ fontSize: '0.78rem', color: '#9A8878', marginTop: '0.4rem' }}>
                Educator accounts require a school or institutional email. Personal emails are not accepted.
              </p>
            )}
            <label style={{ ...labelStyle, marginTop: '0.75rem' }}>Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
            </label>
            <label style={{ ...labelStyle, marginTop: '0.75rem' }}>Confirm password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" style={inputStyle} />
            </label>
            {accountType === 'teacher' && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={isTeacher} onChange={(e) => setIsTeacher(e.target.checked)} style={{ marginTop: '3px' }} />
                <span style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>I confirm I am an educator setting up an account to manage student writers.</span>
              </label>
            )}
          </div>
        )}

        {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginTop: '1rem' }}>{error}</div>}

        <button onClick={isMinor ? handleMinorSignup : handleStandardSignup} disabled={loading}
          style={{ background: loading ? '#D9C9B0' : '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', marginTop: '1.5rem' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#6B5D4E' }}>
          Already have an account? <Link to="/login" style={{ color: '#2E6DA4', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
