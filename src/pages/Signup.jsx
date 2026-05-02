import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const adjectives = ['Swift','Brave','Clever','Bold','Bright','Calm','Keen','Wise','Wild','Quiet'];
const nouns = ['Penguin','Narrator','Scribe','Author','Dreamer','Writer','Poet','Falcon','Otter','Fox'];

const generateUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return adj + noun + num;
};

const WORD_LIST = [
  'apple','river','cloud','stone','tiger','flame','night','ocean','brave','cedar',
  'frost','globe','maple','noble','pearl','quiet','solar','tulip','ultra','vivid',
  'wheat','amber','bloom','coral','delta','ember','fable','grace','haven','ivory',
  'joker','karma','lemon','moose','north','olive','piano','quest','robin','sandy',
  'toast','uncle','vapor','walnut','xenon','yacht','zebra','birch','crane','dusk',
  'eagle','finch','grove','hills','inlet','jumbo','knoll','lunar','mango','nectar',
];

const generateRecoveryPhrase = () => {
  const shuffled = [...WORD_LIST].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).join(' ');
};

const personalDomains = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'aol.com','live.com','msn.com','me.com','mac.com','protonmail.com',
  'mail.com','ymail.com','googlemail.com','yahoo.co.uk','yahoo.com.au',
  'hotmail.co.uk','hotmail.com.au','outlook.com.au','bigpond.com',
  'comcast.net','verizon.net','att.net','sbcglobal.net',
];

const isPersonalEmail = (email) => {
  const domain = email.split('@')[1];
  if (!domain) return true;
  return personalDomains.includes(domain.toLowerCase());
};

// ─── Logo ─────────────────────────────────────────────────────────────────────

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

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#F5EFE6',
  border: '1px solid #D9C9B0',
  borderRadius: '8px',
  color: '#3A3226',
  fontFamily: 'sans-serif',
  fontSize: '0.95rem',
  padding: '0.6rem 0.9rem',
  outline: 'none',
};

const labelStyle = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#6B5D4E',
  display: 'block',
  marginBottom: '0.5rem',
};

// ─── Recovery phrase screen ───────────────────────────────────────────────────

function RecoveryPhraseScreen({ recoveryPhrase, createdUserId, onError, error }) {
  const navigate = useNavigate();
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!phraseConfirmed) { onError('Please confirm you have written down your recovery phrase.'); return; }
    setSaving(true);
    onError(null);
    try {
      const response = await fetch('/api/save-recovery-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: createdUserId, recoveryPhrase }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      navigate('/profile-setup');
    } catch {
      onError('Failed to save recovery phrase. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%' }}>
        <FictiflyLogo />
        <h1 style={{ color: '#3A3226', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem' }}>Save your recovery phrase</h1>
        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6B5D4E', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          This is the only way to recover your account if you forget your passcode. Write it down and keep it somewhere safe.
        </p>

        <div style={{ background: '#EAF4FB', border: '2px solid #5B9EC9', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>Your recovery phrase</div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            {recoveryPhrase.split(' ').map((word, i) => (
              <span key={i} style={{ background: '#FFFCF8', border: '1px solid #5B9EC9', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '1.1rem', fontWeight: 700, color: '#2E6DA4' }}>{word}</span>
            ))}
          </div>
        </div>

        <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#B56840', lineHeight: 1.5 }}>
          ⚠️ If you lose this phrase, you will need to create a new account. We cannot recover it for you.
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
          <input type="checkbox" checked={phraseConfirmed} onChange={e => setPhraseConfirmed(e.target.checked)} style={{ marginTop: '3px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: '#6B5D4E' }}>I have written down my recovery phrase and stored it somewhere safe.</span>
        </label>

        {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving || !phraseConfirmed}
          style={{ width: '100%', background: (!phraseConfirmed || saving) ? '#D9C9B0' : '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: (!phraseConfirmed || saving) ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : "I've saved it — continue"}
        </button>
      </div>
    </div>
  );
}

// ─── Pending approval screen ──────────────────────────────────────────────────

function PendingApprovalScreen({ className }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <FictiflyLogo />
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✏️</div>
        <h1 style={{ color: '#3A3226', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Almost there!</h1>
        <p style={{ color: '#6B5D4E', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Your account has been created and your request to join <strong style={{ color: '#3A3226' }}>{className}</strong> is waiting for your teacher to approve it.
        </p>
        <div style={{ background: '#F0F7FC', border: '1px solid #5B9EC9', borderRadius: '10px', padding: '1rem', color: '#3A6B8A', fontSize: '0.88rem', lineHeight: 1.55, textAlign: 'left' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>What happens next:</strong>
          Your teacher will get a notification and approve your request. Once approved, you'll have full access to your class. Log back in any time to check your status.
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#6B5D4E' }}>
          <Link to="/login" style={{ color: '#2E6DA4', fontWeight: 600 }}>Go to login</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Main Signup component ────────────────────────────────────────────────────

export default function Signup() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Age gate passes these through for teen class join flow
  const isMinor = state?.isMinor ?? false;
  const classId = state?.classId ?? null;
  const className = state?.className ?? null;
  const teacherId = state?.teacherId ?? null;
  const requireApproval = state?.requireApproval ?? false;

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
  const [parentConsent, setParentConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recovery phrase flow
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [createdUserId, setCreatedUserId] = useState(null);

  // Pending approval flow
  const [showPendingApproval, setShowPendingApproval] = useState(false);

  const refreshUsername = () => setUsername(generateUsername());
  const getFinalUsername = () =>
    isMinor ? username : (usernameMode === 'random' ? username : customUsername.trim());

  // ── Google OAuth (adults only) ─────────────────────────────────────────────

  const handleGoogleSignup = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
    if (oauthError) setError(oauthError.message);
  };

  // ── Minor / teen signup ────────────────────────────────────────────────────
  //
  // Flow:
  //   1. Create auth user with synthetic email + passcode
  //   2. Insert user profile row (account_type: 'minor')
  //   3. If arriving via class code, insert class_members row
  //      a. status: 'pending' if teacher requires approval, else 'active'
  //      b. Notify teacher via edge function (fire-and-forget)
  //   4. Show recovery phrase screen
  //   5. On phrase confirmed → navigate to profile-setup OR pending-approval

  const handleMinorSignup = async () => {
    if (!/^\d{6}$/.test(passcode)) { setError('Passcode must be exactly 6 digits (numbers only).'); return; }
    if (passcode !== confirmPasscode) { setError('Passcodes do not match.'); return; }
    if (!parentConsent) { setError('Please confirm parent or guardian consent.'); return; }
    if (!classId) { setError('No class code found. Please go back and enter your class code.'); return; }

    setLoading(true);
    setError(null);

    const finalUsername = getFinalUsername();
    const minorEmail = finalUsername.toLowerCase() + '@minor.fictifly.com';

    // Step 1: Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: minorEmail,
      password: passcode,
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (!data?.user) { setError('Account creation failed. Please try again.'); setLoading(false); return; }

    const userId = data.user.id;

    // Step 2: Insert user profile
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      username: finalUsername,
      account_type: 'minor',
      is_minor: true,
      age_verified: true,
      recovery_type: 'phrase',
    });

    if (insertError) { setError('Profile error: ' + insertError.message); setLoading(false); return; }

    // Step 3: Join class
    const memberStatus = requireApproval ? 'pending' : 'active';

    const { error: memberError } = await supabase.from('class_members').insert({
      class_id: classId,
      student_id: userId,
      status: memberStatus,
    });

    if (memberError) { setError('Could not join class: ' + memberError.message); setLoading(false); return; }

    // Step 3b: Notify teacher (fire-and-forget edge function)
    // Non-blocking — failure here doesn't break signup
    supabase.functions.invoke('notify-teacher-new-student', {
      body: {
        teacherId,
        classId,
        className,
        studentUsername: finalUsername,
        requireApproval,
      },
    }).catch(() => {
      // Silent — teacher will see the student in their roster regardless
    });

    // Step 4: Show recovery phrase
    const phrase = generateRecoveryPhrase();
    setRecoveryPhrase(phrase);
    setCreatedUserId(userId);
    setShowRecoveryPhrase(true);
    setLoading(false);
  };

  // Called after phrase is confirmed and saved
  // Directs to pending screen if teacher approval required, else profile setup
  const handlePhraseComplete = () => {
    if (requireApproval) {
      setShowPendingApproval(true);
    } else {
      navigate('/profile-setup');
    }
  };

  // ── Standard / teacher signup ──────────────────────────────────────────────

  const handleStandardSignup = async () => {
    const finalUsername = getFinalUsername();
    if (!finalUsername) { setError('Please enter or generate a username.'); return; }
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (accountType === 'teacher' && isPersonalEmail(email)) {
      setError('Educator accounts require a school or institutional email address. Personal email providers like Gmail or Outlook are not accepted.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    // Store pending profile for AuthCallback to insert after email confirmation
    if (data?.user) {
      localStorage.setItem('fictifly_pending_profile', JSON.stringify({
        id: data.user.id,
        username: finalUsername,
        account_type: accountType === 'teacher' ? 'teacher' : 'standard',
      }));
    }

    setLoading(false);
    navigate('/verify-email', { state: { email } });
  };

  // ── Render screens ─────────────────────────────────────────────────────────

  if (showPendingApproval) {
    return <PendingApprovalScreen className={className} />;
  }

  if (showRecoveryPhrase) {
    return (
      <RecoveryPhraseScreen
        recoveryPhrase={recoveryPhrase}
        createdUserId={createdUserId}
        onError={setError}
        error={error}
        onComplete={handlePhraseComplete}
      />
    );
  }

  // ── Class context banner (shown when arriving via class code) ──────────────

  const ClassBanner = () => {
    if (!classId) return null;
    return (
      <div style={{ background: '#EAF4FB', border: '1px solid #5B9EC9', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1rem' }}>🏫</span>
        <span style={{ fontSize: '0.85rem', color: '#3A6B8A', lineHeight: 1.4 }}>
          Joining <strong>{className}</strong> — complete your account to get started.
        </span>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%' }}>
        <FictiflyLogo />
        <h1 style={{ color: '#3A3226', marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h1>

        <ClassBanner />

        {/* Google OAuth — adults only */}
        {!isMinor && (
          <div>
            <button
              onClick={handleGoogleSignup}
              style={{ width: '100%', background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '10px', padding: '0.7rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.25rem', color: '#3A3226' }}
            >
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

        {/* Account type toggle — adults only */}
        {!isMinor && (
          <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '1.5rem' }}>
            {['standard', 'teacher'].map((type) => (
              <button
                key={type}
                onClick={() => { setAccountType(type); setError(null); }}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: accountType === type ? '#FFFCF8' : 'transparent', color: accountType === type ? '#3A3226' : '#9A8878', fontWeight: accountType === type ? 600 : 400, cursor: 'pointer' }}
              >
                {type === 'teacher' ? 'Educator' : 'Writer'}
              </button>
            ))}
          </div>
        )}

        {/* Username */}
        {isMinor ? (
          <div style={{ background: '#F5EFE6', borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#9A8878', marginBottom: '0.25rem' }}>Your username</div>
            <div style={{ fontSize: '1.3rem', color: '#3A3226', fontStyle: 'italic', marginBottom: '0.5rem' }}>{username}</div>
            <button onClick={refreshUsername} style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.78rem', padding: '0.3rem 0.75rem', cursor: 'pointer' }}>
              Generate another
            </button>
            <div style={{ fontSize: '0.75rem', color: '#6B5D4E', marginTop: '0.5rem' }}>Write this down — you'll need it to log in.</div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Username</label>
            <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '0.75rem' }}>
              {['random', 'custom'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setUsernameMode(mode)}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', border: 'none', background: usernameMode === mode ? '#FFFCF8' : 'transparent', color: usernameMode === mode ? '#3A3226' : '#9A8878', fontWeight: usernameMode === mode ? 600 : 400, cursor: 'pointer', fontSize: '0.85rem' }}
                >
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

        {/* Passcode (minor) or email/password (adult) */}
        {isMinor ? (
          <div>
            <label style={labelStyle}>Passcode
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="6 digits"
                style={{ ...inputStyle, marginTop: '0.4rem' }}
              />
            </label>
            <div style={{ fontSize: '0.75rem', color: '#9A8878', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
              Must be exactly 6 numbers (e.g. 482910). Write it down!
            </div>
            <label style={labelStyle}>Confirm passcode
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="6 digits"
                style={{ ...inputStyle, marginTop: '0.4rem' }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={parentConsent} onChange={(e) => setParentConsent(e.target.checked)} style={{ marginTop: '3px' }} />
              <span style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>A parent or guardian is aware of and consents to this account.</span>
            </label>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>
              {accountType === 'teacher' ? 'School or institutional email' : 'Email address'}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={accountType === 'teacher' ? 'you@school.edu' : 'you@example.com'} style={{ ...inputStyle, marginTop: '0.4rem' }} />
            </label>
            {accountType === 'teacher' && (
              <p style={{ fontSize: '0.78rem', color: '#9A8878', marginTop: '0.4rem' }}>
                Please use your school or institutional email. Many school districts use custom domains — any non-personal address is accepted.
              </p>
            )}
            <label style={{ ...labelStyle, marginTop: '0.75rem' }}>Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ ...inputStyle, marginTop: '0.4rem' }} />
            </label>
            <label style={{ ...labelStyle, marginTop: '0.75rem' }}>Confirm password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" style={{ ...inputStyle, marginTop: '0.4rem' }} />
            </label>
            {accountType === 'teacher' && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={isTeacher} onChange={(e) => setIsTeacher(e.target.checked)} style={{ marginTop: '3px' }} />
                <span style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>I confirm I am an educator setting up an account to manage student writers.</span>
              </label>
            )}
          </div>
        )}

        {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <button
          onClick={isMinor ? handleMinorSignup : handleStandardSignup}
          disabled={loading}
          style={{ background: loading ? '#D9C9B0' : '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', marginTop: '1.5rem' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#6B5D4E' }}>
          Already have an account? <Link to="/login" style={{ color: '#2E6DA4', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}