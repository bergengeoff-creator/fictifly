import { useState } from 'react';
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

// ─── Shared styles ────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: '#F5EFE6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.25rem',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
  },
  card: {
    background: '#FFFCF8',
    border: '1px solid #D9C9B0',
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '480px',
    width: '100%',
    boxSizing: 'border-box',
  },
  h1: {
    color: '#3A3226',
    margin: '0 0 0.5rem',
    fontSize: '1.4rem',
    fontWeight: 600,
    textAlign: 'center',
  },
  sub: {
    color: '#6B5D4E',
    margin: '0 0 2rem',
    fontSize: '0.95rem',
    lineHeight: 1.55,
    textAlign: 'center',
  },
  choiceBtn: (selected) => ({
    display: 'block',
    width: '100%',
    padding: '0.9rem 1rem',
    marginBottom: '0.75rem',
    borderRadius: '10px',
    border: '1.5px solid ' + (selected ? '#D4845A' : '#D9C9B0'),
    background: selected ? '#D4845A' : 'transparent',
    color: selected ? '#FFFCF8' : '#6B5D4E',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
  }),
  btnLabel: (selected) => ({
    fontWeight: 600,
    display: 'block',
    marginBottom: '2px',
    color: selected ? '#FFFCF8' : '#3A3226',
  }),
  btnDesc: {
    fontSize: '0.82rem',
    opacity: 0.85,
  },
  primaryBtn: (disabled) => ({
    background: disabled ? '#D9C9B0' : '#2E6DA4',
    color: '#FFFCF8',
    border: 'none',
    borderRadius: '10px',
    padding: '0.8rem 2rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: '100%',
    fontFamily: 'system-ui, sans-serif',
    marginTop: '0.5rem',
  }),
  outlineBtn: {
    background: 'transparent',
    color: '#2E6DA4',
    border: '1.5px solid #2E6DA4',
    borderRadius: '10px',
    padding: '0.75rem 2rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'system-ui, sans-serif',
    marginBottom: '0.6rem',
  },
  ghostBtn: {
    background: 'transparent',
    border: 'none',
    color: '#A89880',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.4rem 0',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
    marginTop: '0.5rem',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#F5EFE6',
    border: '1.5px solid #D9C9B0',
    borderRadius: '10px',
    color: '#3A3226',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.9rem',
    padding: '0.7rem 0.9rem',
    outline: 'none',
    marginBottom: '0.75rem',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#6B5D4E',
    display: 'block',
    marginBottom: '0.4rem',
  },
  checkRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    marginBottom: '0.75rem',
  },
  checkLabel: {
    fontSize: '0.83rem',
    color: '#6B5D4E',
    lineHeight: 1.45,
  },
  error: {
    background: '#FDF0E8',
    border: '1px solid #D4845A',
    borderRadius: '8px',
    color: '#B56840',
    padding: '0.75rem',
    marginBottom: '1rem',
    fontSize: '0.88rem',
  },
  success: {
    background: '#EAF5F0',
    border: '1px solid #5B9EC9',
    borderRadius: '10px',
    padding: '1rem',
    color: '#2E6DA4',
    fontSize: '0.88rem',
    lineHeight: 1.55,
    marginBottom: '1rem',
  },
  info: {
    background: '#F0F7FC',
    border: '1px solid #5B9EC9',
    borderRadius: '10px',
    padding: '0.9rem 1rem',
    color: '#3A6B8A',
    fontSize: '0.85rem',
    lineHeight: 1.55,
    marginBottom: '1rem',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #D9C9B0',
    margin: '1.5rem 0',
  },
  or: {
    textAlign: 'center',
    color: '#A89880',
    fontSize: '0.82rem',
    margin: '0.75rem 0',
  },
  sectionTitle: {
    color: '#3A3226',
    fontWeight: 600,
    fontSize: '0.95rem',
    margin: '0 0 0.35rem',
  },
  sectionBody: {
    color: '#6B5D4E',
    fontSize: '0.87rem',
    lineHeight: 1.55,
    margin: '0 0 0.85rem',
  },
};

// ─── Step 1: Age selection ────────────────────────────────────────────────────

function SelectStep({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const choices = [
    {
      val: 'adult',
      label: 'I\'m 18 or older',
      desc: 'Create a full account and start writing today',
    },
    {
      val: 'teen',
      label: 'I\'m a teen (13–17)',
      desc: 'Join with a class code or ask a parent to sign you up',
    },
    {
      val: 'u13',
      label: 'I\'m under 13',
      desc: 'Your teacher can create an account for you',
    },
  ];

  const handleContinue = () => {
    if (!selected) {
      setError('Please select an option to continue.');
      return;
    }
    onSelect(selected);
  };

  return (
    <div>
      <h1 style={s.h1}>Before we begin</h1>
      <p style={s.sub}>Please select your age group so we can set up your account correctly.</p>

      {choices.map(({ val, label, desc }) => {
        const active = selected === val;
        return (
          <button
            key={val}
            onClick={() => { setSelected(val); setError(null); }}
            style={s.choiceBtn(active)}
          >
            <span style={s.btnLabel(active)}>{label}</span>
            <span style={s.btnDesc}>{desc}</span>
          </button>
        );
      })}

      {error && <div style={{ ...s.error, marginTop: '0.75rem' }}>{error}</div>}

      <button onClick={handleContinue} style={s.primaryBtn(false)}>
        Continue
      </button>
    </div>
  );
}

// ─── Step 2a: Teen panel ──────────────────────────────────────────────────────

function TeenPanel({ onBack, navigate }) {
  const [classCode, setClassCode] = useState('');
  const [classError, setClassError] = useState(null);
  const [classLoading, setClassLoading] = useState(false);

  const [parentEmail, setParentEmail] = useState('');
  const [parentConfirmed, setParentConfirmed] = useState(false);
  const [marketingOpt, setMarketingOpt] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyError, setNotifyError] = useState(null);
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Validate and look up class code, then hand off to teen signup
  const handleJoinClass = async () => {
    const code = classCode.trim().toUpperCase();
    if (!code) { setClassError('Please enter your class code.'); return; }
    setClassLoading(true);
    setClassError(null);

    // Look up the class by code in Supabase
    const { data: classData, error: classErr } = await supabase
      .from('classes')
      .select('id, name, teacher_id, require_approval')
      .eq('class_code', code)
      .eq('is_active', true)
      .single();

    if (classErr || !classData) {
      setClassError('That code doesn\'t match any active class. Check with your teacher and try again.');
      setClassLoading(false);
      return;
    }

    // Pass class context to the teen signup flow
    navigate('/signup', {
      state: {
        isMinor: true,
        classId: classData.id,
        className: classData.name,
        teacherId: classData.teacher_id,
        requireApproval: classData.require_approval,
        joinCode: code,
      },
    });
    setClassLoading(false);
  };

  // Save parent email to waitlist table
  const handleNotify = async () => {
    const email = parentEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotifyError('Please enter a valid email address.');
      return;
    }
    if (!parentConfirmed) {
      setNotifyError('Please confirm this is a parent or guardian email.');
      return;
    }
    setNotifyLoading(true);
    setNotifyError(null);

    const { error: insertErr } = await supabase
      .from('teen_signup_waitlist')
      .insert({
        parent_email: email,
        marketing_opt_in: marketingOpt,
        // expires_at is set server-side via a Postgres default: now() + interval '12 months'
        // or on feature launch, whichever comes first — handled by a scheduled function
      });

    if (insertErr) {
      // Gracefully handle duplicate email — not an error from the user's perspective
      if (insertErr.code !== '23505') {
        setNotifyError('Something went wrong. Please try again.');
        setNotifyLoading(false);
        return;
      }
    }

    setNotifySuccess(true);
    setNotifyLoading(false);
  };

  return (
    <div>
      <h1 style={s.h1}>Fictifly is for teen writers too</h1>
      <p style={{ ...s.sub, marginBottom: '1.5rem' }}>
        During our beta, teen accounts are set up through a teacher or a parent. Here's how to get started.
      </p>

      {/* Class code section */}
      <p style={s.sectionTitle}>Have a class code?</p>
      <p style={s.sectionBody}>Your teacher shared a code to join their class — enter it here.</p>

      <input
        type="text"
        value={classCode}
        onChange={(e) => { setClassCode(e.target.value); setClassError(null); }}
        placeholder="Enter class code"
        maxLength={12}
        style={{ ...s.input, textTransform: 'uppercase', letterSpacing: '0.08em' }}
      />
      {classError && <div style={{ ...s.error, marginBottom: '0.75rem' }}>{classError}</div>}

      <button
        onClick={handleJoinClass}
        disabled={classLoading}
        style={s.primaryBtn(classLoading)}
      >
        {classLoading ? 'Checking code...' : 'Join class'}
      </button>

      <hr style={s.divider} />

      {/* Parent waitlist section */}
      {!notifySuccess ? (
        <div>
          <p style={s.sectionTitle}>Don't have a class code yet?</p>
          <p style={s.sectionBody}>
            Have a parent or guardian enter their email below. We'll let them know as soon as
            parent sign-up is ready — and your spot will be waiting.
          </p>

          <label style={s.label}>Parent or guardian email</label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => { setParentEmail(e.target.value); setNotifyError(null); }}
            placeholder="parent@example.com"
            style={s.input}
          />

          <div style={s.checkRow}>
            <input
              type="checkbox"
              id="parent-confirm"
              checked={parentConfirmed}
              onChange={(e) => setParentConfirmed(e.target.checked)}
              style={{ marginTop: '3px', flexShrink: 0, accentColor: '#2E6DA4' }}
            />
            <label htmlFor="parent-confirm" style={s.checkLabel}>
              I am a parent or guardian entering my own email address
            </label>
          </div>

          <div style={s.checkRow}>
            <input
              type="checkbox"
              id="marketing-opt"
              checked={marketingOpt}
              onChange={(e) => setMarketingOpt(e.target.checked)}
              style={{ marginTop: '3px', flexShrink: 0, accentColor: '#2E6DA4' }}
            />
            <label htmlFor="marketing-opt" style={s.checkLabel}>
              I'd also like occasional updates about Fictifly (optional)
            </label>
          </div>

          {notifyError && <div style={s.error}>{notifyError}</div>}

          <button
            onClick={handleNotify}
            disabled={notifyLoading}
            style={s.primaryBtn(notifyLoading)}
          >
            {notifyLoading ? 'Saving...' : 'Notify me when ready'}
          </button>
        </div>
      ) : (
        <div style={s.success}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>You're on the list!</strong>
          We'll email you as soon as parent sign-up is ready. Check your inbox for a confirmation.
        </div>
      )}

      <button onClick={onBack} style={s.ghostBtn}>← Go back</button>
    </div>
  );
}

// ─── Step 2b: Under-13 panel ──────────────────────────────────────────────────

function Under13Panel({ onBack }) {
  return (
    <div>
      <h1 style={s.h1}>Ask your teacher to get you started</h1>
      <p style={{ ...s.sub, marginBottom: '1.25rem' }}>
        Fictifly accounts for students under 13 are created by teachers — not by students directly.
        That's by design, to keep things safe.
      </p>
      <div style={s.info}>
        <strong style={{ display: 'block', marginBottom: '6px' }}>Here's what to do:</strong>
        Tell your teacher you'd like to join Fictifly. They can create a student account for you
        and add you to your class — no email address or personal information needed on your end.
      </div>
      <button onClick={onBack} style={s.ghostBtn}>← Go back</button>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function AgeGate() {
  const navigate = useNavigate();
  const [step, setStep] = useState('select'); // 'select' | 'teen' | 'u13'

  const handleSelect = (val) => {
    if (val === 'adult') {
      navigate('/signup', { state: { isMinor: false } });
      return;
    }
    setStep(val === 'teen' ? 'teen' : 'u13');
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <FictiflyLogo />
        {step === 'select' && <SelectStep onSelect={handleSelect} />}
        {step === 'teen' && <TeenPanel onBack={() => setStep('select')} navigate={navigate} />}
        {step === 'u13' && <Under13Panel onBack={() => setStep('select')} />}
      </div>
    </div>
  );
}