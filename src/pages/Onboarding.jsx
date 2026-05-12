import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

import FictiflyLogo from '../components/FictiflyLogo';
import TheWell from '../components/TheWell';

// ── Brand tokens ────────────────────────────────────────────────────────────
const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', terraLight: '#E8A882',
  sea: '#2E6DA4', seaMid: '#5B9EC9',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878',
  white: '#FFFCF8', green: '#3A7040', greenLight: '#F0F7ED',
};

// ── Constants ────────────────────────────────────────────────────────────────
const GENRES = [
  'Action/Adventure','Comedy','Crime','Drama','Fairy Tale','Fantasy',
  'Ghost Story','Historical Fiction','Horror','Mystery','Romance',
  'Romantic Comedy','Sci-Fi','Spy','Suspense','Thriller','Open Genre',
];

const AVATAR_STYLES = ['notionists','lorelei','bottts','fun-emoji'];
const AVATAR_STYLE_LABELS = { notionists:'Notionists', lorelei:'Lorelei', bottts:'Bottts', 'fun-emoji':'Fun Emoji' };
const MINOR_STYLES = ['bottts','fun-emoji'];

const SUBJECTS = ['English','Creative Writing','Language Arts','Literature','Other'];
const GRADE_LEVELS = ['Elementary (K-5)','Middle School (6-8)','High School (9-12)','College / University','Other'];
const REGIONS = ['North America','South America','Europe','Asia','Africa','Australia / Oceania','Other'];

const generateSeeds = (n=6) => Array.from({length:n}, () => Math.random().toString(36).substring(2,8));

// ── Shared styles ────────────────────────────────────────────────────────────
const input = {
  width:'100%', boxSizing:'border-box',
  background: B.sand, border:`1px solid ${B.sandDeep}`,
  borderRadius:'10px', color: B.ink,
  fontFamily:"'DM Sans',sans-serif", fontSize:'0.95rem',
  padding:'0.65rem 1rem', outline:'none',
  transition:'border-color 0.15s',
};
const label = {
  fontSize:'0.78rem', fontWeight:600, color: B.inkMid,
  display:'block', marginBottom:'0.5rem', letterSpacing:'0.02em',
};
const card = {
  background: B.white, border:`1px solid ${B.sandDeep}`,
  borderRadius:'16px', padding:'1.5rem', marginBottom:'1rem',
};

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total, label: stepLabel }) {
  return (
    <div style={{ marginBottom:'2rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color: B.terra }}>
          Step {step} of {total}
        </div>
        <div style={{ fontSize:'0.78rem', color: B.inkLight, fontStyle:'italic' }}>{stepLabel}</div>
      </div>
      <div style={{ height:4, background: B.sandDeep, borderRadius:2, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:2,
          background:`linear-gradient(90deg, ${B.terra}, ${B.terraLight})`,
          width:`${(step/total)*100}%`,
          transition:'width 0.4s ease',
        }}/>
      </div>
      <div style={{ display:'flex', gap:4, marginTop:6 }}>
        {Array.from({length:total}, (_,i) => (
          <div key={i} style={{
            flex:1, height:3, borderRadius:2,
            background: i < step ? B.terra : B.sandDeep,
            transition:'background 0.3s ease',
          }}/>
        ))}
      </div>
    </div>
  );
}

// ── Avatar picker ─────────────────────────────────────────────────────────────
function AvatarPicker({ accountType, selectedUrl, onSelect }) {
  const styles = accountType === 'minor' || accountType === 'student'
    ? MINOR_STYLES : AVATAR_STYLES;
  const [activeStyle, setActiveStyle] = useState(styles[0]);
  const [seeds, setSeeds] = useState(generateSeeds());

  const makeUrl = (style, seed) =>
    `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=f5efe6`;

  return (
    <div>
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {styles.map(s => (
          <button key={s} onClick={() => setActiveStyle(s)} style={{
            padding:'0.3rem 0.85rem', borderRadius:20,
            border:`1.5px solid ${activeStyle===s ? B.terra : B.sandDeep}`,
            background: activeStyle===s ? B.terra : 'transparent',
            color: activeStyle===s ? B.white : B.inkMid,
            fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem',
            fontWeight:500, cursor:'pointer', transition:'all 0.15s',
          }}>{AVATAR_STYLE_LABELS[s]}</button>
        ))}
        <button onClick={() => setSeeds(generateSeeds())} style={{
          padding:'0.3rem 0.85rem', borderRadius:20,
          border:`1.5px solid ${B.sandDeep}`, background:'transparent',
          color: B.inkLight, fontFamily:"'DM Sans',sans-serif",
          fontSize:'0.78rem', cursor:'pointer',
        }}>↻ Shuffle</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'0.5rem' }}>
        {seeds.map(seed => {
          const url = makeUrl(activeStyle, seed);
          const sel = selectedUrl === url;
          return (
            <div key={seed} onClick={() => onSelect(url)} style={{
              border:`2.5px solid ${sel ? B.terra : 'transparent'}`,
              borderRadius:12, overflow:'hidden', cursor:'pointer',
              background: B.sand, aspectRatio:'1',
              transition:'border-color 0.15s, transform 0.15s',
              transform: sel ? 'scale(1.05)' : 'scale(1)',
            }}>
              <img src={url} alt="avatar" style={{ width:'100%', height:'100%', display:'block' }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Genre chips ───────────────────────────────────────────────────────────────
function GenreChips({ selected, onToggle }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
      {GENRES.map(g => {
        const active = selected.includes(g);
        return (
          <button key={g} onClick={() => onToggle(g)} style={{
            padding:'0.35rem 0.85rem', borderRadius:20,
            border:`1.5px solid ${active ? B.sea : B.sandDeep}`,
            background: active ? B.sea : 'transparent',
            color: active ? B.white : B.inkMid,
            fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem',
            fontWeight: active ? 600 : 400, cursor:'pointer',
            transition:'all 0.15s',
          }}>{g}</button>
        );
      })}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, disabled, loading: busy, children }) {
  return (
    <button onClick={onClick} disabled={disabled || busy} style={{
      background: disabled || busy ? B.sandDeep : B.terra,
      color: disabled || busy ? B.inkLight : B.white,
      border:'none', borderRadius:10, padding:'0.7rem 2rem',
      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'0.9rem',
      cursor: disabled || busy ? 'not-allowed' : 'pointer',
      display:'flex', alignItems:'center', gap:'0.5rem',
      transition:'background 0.15s',
    }}>
      {busy && <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', animation:'spin 0.8s linear infinite' }}/>}
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REGULAR USER FLOW — 3 steps
// ══════════════════════════════════════════════════════════════════════════════

function RegularOnboarding({ user, profile, fetchProfile, navigate }) {
  const STEPS = ['Your identity','Your preferences','All set'];
  const [step, setStep] = useState(0); // 0 = welcome, 1-3 = setup, 4 = feature tour
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [usernameError, setUsernameError] = useState(null);

  // Step 2
  const [genres, setGenres] = useState(profile?.favourite_genres || []);
  const [profilePublic, setProfilePublic] = useState(profile?.profile_public ?? true);
  const [bio, setBio] = useState(profile?.bio || '');

  const toggleGenre = g => setGenres(prev =>
    prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
  );

  const checkUsername = async (val) => {
    if (!val || val.length < 3) return;
    const { data } = await supabase
      .from('users').select('id').eq('username', val).neq('id', user.id).maybeSingle();
    setUsernameError(data ? 'Username already taken' : null);
  };

  const saveStep1 = async () => {
    if (!displayName.trim()) { setError('Please enter a display name'); return; }
    if (!username.trim() || username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (usernameError) return;
    setLoading(true); setError(null);
    const { error: err } = await supabase.from('users').update({
      display_name: displayName.trim(),
      username: username.trim().toLowerCase(),
      avatar_url: avatarUrl,
    }).eq('id', user.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep(2);
  };

  const saveStep2 = async () => {
    setLoading(true); setError(null);
    const { error: err } = await supabase.from('users').update({
      bio: bio.trim(),
      favourite_genres: genres,
      profile_public: profilePublic,
    }).eq('id', user.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep(3);
  };

  const finish = async () => {
    setLoading(true);
    await supabase.from('users').update({ profile_complete: true }).eq('id', user.id);
    await fetchProfile(user.id);
    setLoading(false);
    setStep(4);
  };

  return (
    <div>
      {/* ── Step 0 — Welcome ── */}
      {step === 0 && (
        <div style={{ textAlign:'center', padding:'1rem 0 2rem' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.5rem' }}>
            <TheWell size="medium" darkBg={true} animate={true} style={{ borderRadius:16, overflow:'hidden' }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.5rem' }}>
            <FictiflyLogo width={180} />
          </div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.8rem', fontWeight:600, color:B.ink, marginBottom:'0.75rem' }}>
            Welcome to your writing space
          </h2>
          <p style={{ fontSize:'0.95rem', color:B.inkMid, lineHeight:1.8, maxWidth:420, margin:'0 auto 0.75rem' }}>
            Fictifly is a place to explore ideas, sharpen your craft, and find your voice — one story at a time. We're really glad you're here.
          </p>
          <p style={{ fontFamily:"'Fraunces',serif", fontStyle:'italic', fontSize:'0.8rem', color:B.inkLight, opacity:0.6, marginBottom:'2.5rem', letterSpacing:'0.06em' }}>
            de la tinta, tot
          </p>
          <PrimaryBtn onClick={() => setStep(1)}>Let's begin →</PrimaryBtn>
        </div>
      )}

      {/* ── Steps 1–3 — Setup ── */}
      {step >= 1 && step <= 3 && (
        <div>
          {/* Logo — compact, top of setup steps */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'2rem' }}>
            <FictiflyLogo width={150} />
          </div>
          <ProgressBar step={step} total={3} label={STEPS[step-1]}/>

      {/* Step 1 — Identity */}
      {step === 1 && (
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.6rem', fontWeight:600, color: B.ink, marginBottom:'0.3rem' }}>
            Let's set up your writer profile
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            This is how other writers will know you on Fictifly.
          </p>

          <div style={card}>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={label}>Display name</label>
              <input style={input} value={displayName} placeholder="e.g. Geoff Bergen"
                onChange={e => setDisplayName(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Username</label>
              <input style={{ ...input, borderColor: usernameError ? '#E05050' : B.sandDeep }}
                value={username} placeholder="e.g. geoffbergen"
                onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')); }}
                onBlur={() => checkUsername(username)}/>
              {usernameError && <div style={{ fontSize:'0.75rem', color:'#E05050', marginTop:'0.3rem' }}>{usernameError}</div>}
              <div style={{ fontSize:'0.72rem', color: B.inkLight, marginTop:'0.3rem' }}>
                fictifly.app/writers/{username || 'yourname'}
              </div>
            </div>
          </div>

          <div style={card}>
            <label style={{ ...label, marginBottom:'1rem' }}>Pick an avatar</label>
            <AvatarPicker accountType={profile?.account_type} selectedUrl={avatarUrl} onSelect={setAvatarUrl}/>
          </div>

          {error && <div style={{ color:'#E05050', fontSize:'0.82rem', marginBottom:'1rem' }}>{error}</div>}
          <PrimaryBtn onClick={saveStep1} loading={loading} disabled={!displayName || !username || !!usernameError}>
            Continue →
          </PrimaryBtn>
        </div>
      )}

      {/* Step 2 — Preferences */}
      {step === 2 && (
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.6rem', fontWeight:600, color: B.ink, marginBottom:'0.3rem' }}>
            What do you love to write?
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            Choose as many genres as you like — this helps us tailor your experience.
          </p>

          <div style={card}>
            <label style={{ ...label, marginBottom:'0.75rem' }}>Favourite genres</label>
            <GenreChips selected={genres} onToggle={toggleGenre}/>
          </div>

          <div style={card}>
            <label style={label}>Bio <span style={{ fontWeight:400, color: B.inkLight }}>(optional)</span></label>
            <textarea style={{ ...input, height:90, resize:'vertical', lineHeight:1.6 }}
              value={bio} placeholder="Tell the Fictifly community a bit about yourself as a writer..."
              onChange={e => setBio(e.target.value)}/>
          </div>

          <div style={card}>
            <label style={label}>Profile visibility</label>
            <div style={{ display:'flex', gap:'1rem' }}>
              {[{val:true,label:'Public',desc:'Visible to the Fictifly community'},{val:false,label:'Private',desc:'Only visible to you'}].map(opt => (
                <div key={String(opt.val)} onClick={() => setProfilePublic(opt.val)} style={{
                  flex:1, border:`1.5px solid ${profilePublic===opt.val ? B.sea : B.sandDeep}`,
                  borderRadius:10, padding:'0.85rem 1rem', cursor:'pointer',
                  background: profilePublic===opt.val ? '#EAF4FB' : B.white,
                  transition:'all 0.15s',
                }}>
                  <div style={{ fontWeight:600, color: profilePublic===opt.val ? B.sea : B.ink, fontSize:'0.88rem', marginBottom:'0.2rem' }}>{opt.label}</div>
                  <div style={{ fontSize:'0.75rem', color: B.inkLight }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ color:'#E05050', fontSize:'0.82rem', marginBottom:'1rem' }}>{error}</div>}
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            <PrimaryBtn onClick={saveStep2} loading={loading}>Continue →</PrimaryBtn>
            <button onClick={saveStep2} style={{ background:'transparent', border:'none', color: B.inkLight, fontSize:'0.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Profile complete */}
      {step === 3 && (
        <div style={{ textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1rem' }}>
            <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
              <path d="M26 3 C26 3, 20 10, 20 14 C20 17.3, 22.7 20, 26 20 C29.3 20, 32 17.3, 32 14 C32 10, 26 3, 26 3Z" stroke={B.seaMid} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M8 17 C11 13, 15 13, 18 17" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>
              <path d="M34 17 C37 13, 41 13, 44 17" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            </svg>
          </div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.8rem', fontWeight:600, color: B.ink, marginBottom:'0.5rem' }}>
            You're all set, {displayName || profile?.username}!
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.95rem', maxWidth:380, margin:'0 auto 2rem' }}>
            Your writer profile is ready. Let's show you around.
          </p>
          <PrimaryBtn onClick={finish} loading={loading}>Show me around →</PrimaryBtn>
          <div style={{ marginTop:'1rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background:'transparent', border:'none', color: B.inkLight, fontSize:'0.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textDecoration:'underline' }}>
              Skip to dashboard
            </button>
          </div>
        </div>
      )}
        </div>
      )}

      {/* ── Step 4 — Feature tour ── */}
      {step === 4 && (
        <div style={{ textAlign:'center', padding:'1rem 0' }}>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.7rem', fontWeight:600, color: B.ink, marginBottom:'0.4rem' }}>
            Here's what awaits you
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.9rem', marginBottom:'2rem' }}>
            Everything you need to build a writing practice.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem', textAlign:'left' }}>
            {[
              {
                icon: (
                  <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
                    <line x1="4" y1="18" x2="48" y2="18" stroke={B.seaMid} strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 18 C16 10, 36 10, 36 18" stroke={B.seaMid} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                    <line x1="26" y1="4" x2="26" y2="7" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
                    <line x1="36" y1="7" x2="34" y2="9" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
                    <line x1="16" y1="7" x2="18" y2="9" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
                    <line x1="40" y1="12" x2="38" y2="13" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
                    <line x1="12" y1="12" x2="14" y2="13" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                ),
                title:'Daily challenge', desc:'A fresh prompt every day to keep your creativity sharp. Write, submit, and track your streak.'
              },
              {
                icon: (
                  <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
                    <circle cx="14" cy="10" r="6" stroke={B.seaMid} strokeWidth="2.2" fill="none"/>
                    <path d="M2 22 C2 16, 26 16, 26 22" stroke={B.seaMid} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                    <circle cx="36" cy="10" r="5" stroke={B.terra} strokeWidth="2" fill="none" opacity="0.7"/>
                    <path d="M24 22 C24 17, 46 17, 46 22" stroke={B.terra} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
                  </svg>
                ),
                title:'Character Generator', desc:'Build vivid, detailed characters to anchor your stories. Save them and bring them back anytime.'
              },
              {
                icon: (
                  <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
                    <path d="M26 3 C26 3, 20 10, 20 14 C20 17.3, 22.7 20, 26 20 C29.3 20, 32 17.3, 32 14 C32 10, 26 3, 26 3Z" stroke={B.seaMid} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M8 17 C11 13, 15 13, 18 17" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>
                    <path d="M34 17 C37 13, 41 13, 44 17" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>
                  </svg>
                ),
                title:'Microfiction', desc:'100–300 word stories. Small in size, big in craft. Perfect for sharpening your voice.'
              },
              {
                icon: (
                  <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
                    <path d="M26 4 C20 4, 8 6, 4 8 L4 22 C8 20, 20 18, 26 20Z" stroke={B.seaMid} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M26 4 C32 4, 44 6, 48 8 L48 22 C44 20, 32 18, 26 20Z" stroke={B.terra} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
                    <line x1="26" y1="4" x2="26" y2="20" stroke={B.ink} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                  </svg>
                ),
                title:'Flash Fiction', desc:'Up to 1,000 words. Room to breathe, room to build — your first full story starts here.'
              },
              {
                icon: (
                  <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
                    <circle cx="26" cy="16" r="7" stroke={B.seaMid} strokeWidth="2.2" fill="none"/>
                    <path d="M26 11 L27.2 14.4 L30.8 14.4 L28 16.6 L29 20 L26 17.8 L23 20 L24 16.6 L21.2 14.4 L24.8 14.4 Z" stroke={B.terra} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
                    <path d="M22 10 L19 2 L23 4" stroke={B.seaMid} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M30 10 L33 2 L29 4" stroke={B.terra} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
                  </svg>
                ),
                title:'Badges', desc:'Earn recognition as you write. From your first spark to prolific storyteller — every word counts.'
              },
              {
                icon: (
                  <TheWell size="icon" darkBg={true} style={{ width:48, height:48 }}/>
                ),
                title:'The Well', desc:'Your creative source — always there when you arrive. Watch it as you write. There\'s more to it than meets the eye.',
                highlight: true,
              },
            ].map(f => (
              <div key={f.title} style={{
                ...card, marginBottom:0,
                ...(f.highlight ? { background: '#1A1610', border:`1.5px solid ${B.terra}` } : {})
              }}>
                <div style={{ marginBottom:'0.6rem' }}>{f.icon}</div>
                <div style={{ fontWeight:600, fontSize:'0.88rem', marginBottom:'0.3rem', color: f.highlight ? B.sandDeep : B.ink }}>{f.title}</div>
                <div style={{ fontSize:'0.78rem', lineHeight:1.6, color: f.highlight ? B.inkLight : B.inkLight }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:'2rem' }}>
            <PrimaryBtn onClick={() => navigate('/dashboard')}>Start writing →</PrimaryBtn>
            <div style={{ marginTop:'0.75rem' }}>
              <button onClick={() => navigate('/dashboard')} style={{ background:'transparent', border:'none', color: B.inkLight, fontSize:'0.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textDecoration:'underline' }}>
                Skip to dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TEACHER FLOW — 5 steps
// ══════════════════════════════════════════════════════════════════════════════

function TeacherOnboarding({ user, profile, fetchProfile, navigate }) {
  const STEPS = ['Your profile','Your school','Create a class','Add students','Ready to teach'];
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [usernameError, setUsernameError] = useState(null);

  // Step 2
  const [schoolName, setSchoolName] = useState(profile?.school_name || '');
  const [subject, setSubject] = useState(profile?.subject || '');
  const [region, setRegion] = useState(profile?.region || '');
  const [attestation, setAttestation] = useState('');

  // Step 3
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [createdClassId, setCreatedClassId] = useState(null);
  const [joinCode, setJoinCode] = useState(null);
  const [skipClass, setSkipClass] = useState(false);

  // Step 4
  const [studentCount, setStudentCount] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState([]);

  const checkUsername = async (val) => {
    if (!val || val.length < 3) return;
    const { data } = await supabase
      .from('users').select('id').eq('username', val).neq('id', user.id).maybeSingle();
    setUsernameError(data ? 'Username already taken' : null);
  };

  const generateJoinCode = () => Math.random().toString(36).substring(2,8).toUpperCase();

  const saveStep1 = async () => {
    if (!displayName.trim()) { setError('Please enter a display name'); return; }
    if (!username.trim() || username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (usernameError) return;
    setLoading(true); setError(null);
    const { error: err } = await supabase.from('users').update({
      display_name: displayName.trim(),
      username: username.trim().toLowerCase(),
      avatar_url: avatarUrl,
    }).eq('id', user.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep(2);
  };

  const saveStep2 = async () => {
    if (!schoolName.trim()) { setError('Please enter your school name'); return; }
    if (!subject) { setError('Please select your subject'); return; }
    if (!region) { setError('Please select your region'); return; }
    if (attestation.toLowerCase().trim() !== 'i confirm') {
      setError('Please type "I confirm" to continue'); return;
    }
    setLoading(true); setError(null);
    const { error: err } = await supabase.from('users').update({
      school_name: schoolName.trim(),
      subject, region,
    }).eq('id', user.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep(3);
  };

  const saveStep3 = async () => {
    if (skipClass) { setStep(4); return; }
    if (!className.trim()) { setError('Please enter a class name'); return; }
    if (!gradeLevel) { setError('Please select a grade level'); return; }
    setLoading(true); setError(null);
    const code = generateJoinCode();
    const { data, error: err } = await supabase.from('classes').insert({
      teacher_id: user.id,
      name: className.trim(),
      grade_level: gradeLevel,
      description: classDescription.trim(),
      join_code: code,
      is_active: true,
      require_approval: false,
    }).select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    setCreatedClassId(data.id);
    setJoinCode(code);
    setStep(4);
  };

  const generateStudentCodes = async () => {
    const count = parseInt(studentCount);
    if (!count || count < 1 || count > 50) { setError('Enter a number between 1 and 50'); return; }
    if (!createdClassId) { setStep(5); return; }
    setLoading(true); setError(null);

    const studentRows = Array.from({length: count}, (_, i) => ({
      class_id: createdClassId,
      teacher_id: user.id,
      username: `student${Math.random().toString(36).substring(2,8)}`,
      account_type: 'student',
      is_minor: true,
      age_verified: false,
      profile_public: false,
      profile_complete: false,
      recovery_type: 'teacher',
      passcode: Math.floor(100000 + Math.random() * 900000).toString(),
    }));

    const { data, error: err } = await supabase
      .from('users').insert(studentRows).select('username, passcode');
    setLoading(false);
    if (err) { setError(err.message); return; }
    setGeneratedCodes(data || []);
    setStep(5);
  };

  const finish = async () => {
    setLoading(true);
    await supabase.from('users').update({ profile_complete: true }).eq('id', user.id);
    await fetchProfile(user.id);
    setLoading(false);
    setStep(6);
  };

  const ATTESTATION_TEXT = 'By continuing, I confirm that my school administration and relevant parents or guardians have been notified of student participation on Fictifly, and that I take responsibility as the accountable adult for my students\' use of this platform.';

  return (
    <div>
      {/* Step 0 — Welcome */}
      {step === 0 && (
        <div style={{ textAlign:'center', padding:'1rem 0 2rem' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'2rem' }}>
            <TheWell size="medium" darkBg={true} animate={true} style={{ borderRadius:16, overflow:'hidden' }}/>
          </div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'2rem', fontWeight:600, color:B.ink, marginBottom:'0.75rem' }}>
            Welcome to Fictifly
          </h2>
          <p style={{ fontSize:'1rem', color:B.inkMid, lineHeight:1.75, maxWidth:420, margin:'0 auto 0.75rem' }}>
            You're setting up a classroom writing space — a place for your students to explore, create, and find their voices.
          </p>
          <p style={{ fontFamily:"'Fraunces',serif", fontStyle:'italic', fontSize:'0.82rem', color:B.inkLight, opacity:0.7, marginBottom:'2.5rem', letterSpacing:'0.05em' }}>
            de la tinta, tot
          </p>
          <PrimaryBtn onClick={() => setStep(1)}>Let's begin →</PrimaryBtn>
        </div>
      )}

      {/* Steps 1–5 — Setup */}
      {step >= 1 && step <= 5 && (
        <div>
          <ProgressBar step={step} total={5} label={STEPS[step-1]}/>

      {/* Step 1 — Profile */}
      {step === 1 && (
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.6rem', fontWeight:600, color: B.ink, marginBottom:'0.3rem' }}>
            Welcome, educator
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            Let's get your teacher profile set up. Your students will see your display name.
          </p>

          <div style={card}>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={label}>Display name</label>
              <input style={input} value={displayName} placeholder="e.g. Ms. Bergen"
                onChange={e => setDisplayName(e.target.value)}/>
            </div>
            <div>
              <label style={label}>Username</label>
              <input style={{ ...input, borderColor: usernameError ? '#E05050' : B.sandDeep }}
                value={username} placeholder="e.g. msbergen"
                onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')); }}
                onBlur={() => checkUsername(username)}/>
              {usernameError && <div style={{ fontSize:'0.75rem', color:'#E05050', marginTop:'0.3rem' }}>{usernameError}</div>}
            </div>
          </div>

          <div style={card}>
            <label style={{ ...label, marginBottom:'1rem' }}>Pick an avatar</label>
            <AvatarPicker accountType="teacher" selectedUrl={avatarUrl} onSelect={setAvatarUrl}/>
          </div>

          {error && <div style={{ color:'#E05050', fontSize:'0.82rem', marginBottom:'1rem' }}>{error}</div>}
          <PrimaryBtn onClick={saveStep1} loading={loading} disabled={!displayName || !username || !!usernameError}>
            Continue →
          </PrimaryBtn>
        </div>
      )}

      {/* Step 2 — School */}
      {step === 2 && (
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.6rem', fontWeight:600, color: B.ink, marginBottom:'0.3rem' }}>
            Tell us about your school
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            This helps us tailor Fictifly for your classroom context.
          </p>

          <div style={card}>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={label}>School name</label>
              <input style={input} value={schoolName} placeholder="e.g. Lincoln High School"
                onChange={e => setSchoolName(e.target.value)}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={label}>Subject</label>
                <select style={{ ...input, appearance:'none', cursor:'pointer' }}
                  value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="">Select subject…</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Region</label>
                <select style={{ ...input, appearance:'none', cursor:'pointer' }}
                  value={region} onChange={e => setRegion(e.target.value)}>
                  <option value="">Select region…</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...card, borderColor: B.terra, borderLeft:`4px solid ${B.terra}` }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color: B.terra, marginBottom:'0.75rem' }}>
              Teacher responsibility
            </div>
            <p style={{ fontSize:'0.82rem', color: B.inkMid, lineHeight:1.65, marginBottom:'1rem' }}>
              {ATTESTATION_TEXT}
            </p>
            <label style={label}>Type <strong>"I confirm"</strong> to continue</label>
            <input style={{ ...input, borderColor: attestation.toLowerCase().trim()==='i confirm' ? B.green : B.sandDeep }}
              value={attestation} placeholder="I confirm"
              onChange={e => setAttestation(e.target.value)}/>
          </div>

          {error && <div style={{ color:'#E05050', fontSize:'0.82rem', marginBottom:'1rem' }}>{error}</div>}
          <PrimaryBtn onClick={saveStep2} loading={loading}
            disabled={!schoolName || !subject || !region || attestation.toLowerCase().trim()!=='i confirm'}>
            Continue →
          </PrimaryBtn>
        </div>
      )}

      {/* Step 3 — Create class */}
      {step === 3 && (
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.6rem', fontWeight:600, color: B.ink, marginBottom:'0.3rem' }}>
            Create your first class
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            You can create more classes later from your classroom dashboard.
          </p>

          <div style={card}>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={label}>Class name</label>
              <input style={input} value={className} placeholder="e.g. Period 3 Creative Writing"
                onChange={e => setClassName(e.target.value)} disabled={skipClass}/>
            </div>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={label}>Grade level</label>
              <select style={{ ...input, appearance:'none', cursor:'pointer' }}
                value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} disabled={skipClass}>
                <option value="">Select grade level…</option>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Description <span style={{ fontWeight:400, color: B.inkLight }}>(optional)</span></label>
              <input style={input} value={classDescription} placeholder="e.g. 10th grade creative writing, fall semester"
                onChange={e => setClassDescription(e.target.value)} disabled={skipClass}/>
            </div>
          </div>

          {error && <div style={{ color:'#E05050', fontSize:'0.82rem', marginBottom:'1rem' }}>{error}</div>}
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            <PrimaryBtn onClick={saveStep3} loading={loading} disabled={!skipClass && (!className || !gradeLevel)}>
              {skipClass ? 'Skip this step →' : 'Create class →'}
            </PrimaryBtn>
            <button onClick={() => { setSkipClass(s => !s); setError(null); }} style={{
              background:'transparent', border:'none', color: B.inkLight,
              fontSize:'0.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              textDecoration:'underline',
            }}>
              {skipClass ? 'Create a class instead' : 'Skip for now'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Add students */}
      {step === 4 && (
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.6rem', fontWeight:600, color: B.ink, marginBottom:'0.3rem' }}>
            Add students
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            Generate passcode login cards for your students — no email addresses needed.
          </p>

          {joinCode && (
            <div style={{ ...card, background:'#EAF4FB', borderColor: B.seaMid, marginBottom:'1rem' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color: B.sea, marginBottom:'0.4rem' }}>Class join code</div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:'2rem', fontWeight:600, color: B.sea, letterSpacing:'0.1em' }}>{joinCode}</div>
              <div style={{ fontSize:'0.78rem', color: B.inkLight, marginTop:'0.3rem' }}>Share this with students who have their own email to join directly.</div>
            </div>
          )}

          <div style={card}>
            <label style={label}>How many student passcode accounts to generate?</label>
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
              <input style={{ ...input, width:120 }} type="number" min="1" max="50"
                value={studentCount} placeholder="e.g. 28"
                onChange={e => setStudentCount(e.target.value)}/>
              <span style={{ fontSize:'0.82rem', color: B.inkLight }}>Maximum 50 per batch</span>
            </div>
          </div>

          {generatedCodes.length > 0 && (
            <div style={card}>
              <div style={{ fontSize:'0.78rem', fontWeight:600, color: B.inkMid, marginBottom:'0.75rem' }}>
                {generatedCodes.length} student accounts created — save these passcodes
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.5rem', maxHeight:200, overflowY:'auto' }}>
                {generatedCodes.map((s,i) => (
                  <div key={i} style={{ background: B.sand, borderRadius:8, padding:'0.5rem 0.75rem', fontSize:'0.78rem' }}>
                    <div style={{ fontWeight:600, color: B.ink }}>{s.username}</div>
                    <div style={{ color: B.sea, fontFamily:'monospace', fontSize:'0.85rem' }}>{s.passcode}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div style={{ color:'#E05050', fontSize:'0.82rem', marginBottom:'1rem' }}>{error}</div>}
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            {generatedCodes.length === 0 ? (
              <>
                <PrimaryBtn onClick={generateStudentCodes} loading={loading} disabled={!studentCount}>
                  Generate passcodes →
                </PrimaryBtn>
                <button onClick={() => setStep(5)} style={{
                  background:'transparent', border:'none', color: B.inkLight,
                  fontSize:'0.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  textDecoration:'underline',
                }}>Skip for now</button>
              </>
            ) : (
              <PrimaryBtn onClick={() => setStep(5)}>Continue →</PrimaryBtn>
            )}
          </div>
        </div>
      )}

      {/* Step 5 — Ready */}
      {step === 5 && (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🏫</div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.8rem', fontWeight:600, color: B.ink, marginBottom:'0.5rem' }}>
            Your classroom is ready, {displayName || profile?.username}!
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.92rem', marginBottom:'2rem', maxWidth:420, margin:'0 auto 2rem' }}>
            Here's what you've set up. You can manage everything from your classroom dashboard.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'2rem', textAlign:'left' }}>
            {[
              { icon:'📚', title: className || 'Classes', desc: className ? `${gradeLevel} · ${generatedCodes.length} student accounts` : 'Create classes from your dashboard' },
              { icon:'✍️', title:'Writing generators', desc:'Assign microfiction, flash fiction, and character prompts' },
              { icon:'📝', title:'Assignments', desc:'Set prompts, due dates, and word counts for your class' },
              { icon:'🏆', title:'Badges & feedback', desc:'Students earn badges and receive your written feedback' },
            ].map(f => (
              <div key={f.title} style={{ ...card, marginBottom:0, textAlign:'left' }}>
                <div style={{ fontSize:'1.3rem', marginBottom:'0.35rem' }}>{f.icon}</div>
                <div style={{ fontWeight:600, color: B.ink, fontSize:'0.85rem', marginBottom:'0.2rem' }}>{f.title}</div>
                <div style={{ fontSize:'0.75rem', color: B.inkLight, lineHeight:1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <PrimaryBtn onClick={finish} loading={loading}>Show me around →</PrimaryBtn>
          <div style={{ marginTop:'1rem' }}>
            <button onClick={() => navigate('/classroom')} style={{ background:'transparent', border:'none', color: B.inkLight, fontSize:'0.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textDecoration:'underline' }}>
              Skip to classroom
            </button>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Step 6 — Feature tour */}
      {step === 6 && (
        <div style={{ textAlign:'center', padding:'1rem 0' }}>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.7rem', fontWeight:600, color: B.ink, marginBottom:'0.4rem' }}>
            Your classroom is ready
          </h2>
          <p style={{ color: B.inkLight, fontSize:'0.9rem', marginBottom:'2rem' }}>
            Here's everything your students can look forward to.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem', textAlign:'left' }}>
            {[
              { icon:'⚡', title:'Daily challenge', desc:'A fresh prompt every day. Assign it to your class or let students write freely.' },
              { icon:'🎭', title:'Character Generator', desc:'Students build vivid characters to anchor their stories — saved and reusable.' },
              { icon:'📖', title:'Microfiction', desc:'100–300 word stories. A perfect low-stakes exercise for any lesson.' },
              { icon:'📚', title:'Flash Fiction', desc:'Up to 1,000 words. Longer form writing to develop narrative craft.' },
              { icon:'📝', title:'Assignments', desc:'Set prompts with due dates and word counts. Review and give written feedback.' },
              { icon:'🏆', title:'Badges', desc:'Students earn recognition as they write. Motivation built into the platform.' },
            ].map(f => (
              <div key={f.title} style={{ ...card, marginBottom:0, textAlign:'left' }}>
                <div style={{ fontSize:'1.4rem', marginBottom:'0.4rem' }}>{f.icon}</div>
                <div style={{ fontWeight:600, color: B.ink, fontSize:'0.88rem', marginBottom:'0.3rem' }}>{f.title}</div>
                <div style={{ fontSize:'0.78rem', color: B.inkLight, lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:'2rem' }}>
            <PrimaryBtn onClick={() => navigate('/classroom')}>Go to my classroom →</PrimaryBtn>
            <div style={{ marginTop:'0.75rem' }}>
              <button onClick={() => navigate('/classroom')} style={{ background:'transparent', border:'none', color: B.inkLight, fontSize:'0.82rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textDecoration:'underline' }}>
                Skip to classroom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — detects account type and routes accordingly
// ══════════════════════════════════════════════════════════════════════════════

export default function Onboarding() {
  const { user, profile, loading: authLoading, fetchProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (!authLoading && user) fetchProfile(user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (authLoading || !profile) {
    return (
      <div style={{ minHeight:'100vh', background: B.sand, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color: B.inkLight, fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>
      </div>
    );
  }

  const isTeacher = profile.account_type === 'teacher';

  return (
    <div style={{ minHeight:'100vh', background: B.sand, padding:'2rem 1.25rem 5rem', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input:focus, select:focus, textarea:focus { border-color: ${B.terra} !important; box-shadow: 0 0 0 3px ${B.terra}22; }
      `}</style>

      <div style={{ maxWidth:640, margin:'0 auto' }}>
        {isTeacher
          ? <TeacherOnboarding user={user} profile={profile} fetchProfile={fetchProfile} navigate={navigate}/>
          : <RegularOnboarding user={user} profile={profile} fetchProfile={fetchProfile} navigate={navigate}/>
        }
      </div>
    </div>
  );
}