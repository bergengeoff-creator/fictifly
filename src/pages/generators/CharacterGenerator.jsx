import { useState, useCallback, useEffect } from ‘react’;
import { Link } from ‘react-router-dom’;
import { supabase } from ‘../../supabase’;
import { useAuth } from ‘../../context/AuthContext’;
import BadgeToast from ‘../../components/BadgeToast’;

const B = {
sand: ‘#F5EFE6’, sandMid: ‘#EDE3D4’, sandDeep: ‘#D9C9B0’,
terra: ‘#D4845A’, terraDark: ‘#B56840’, seaMid: ‘#5B9EC9’, seaDeep: ‘#2E6DA4’,
ink: ‘#3A3226’, inkMid: ‘#6B5D4E’, inkLight: ‘#9A8878’, white: ‘#FFFCF8’,
};

const ALL_FIELDS = [
{ key: ‘ageRange’,       label: ‘Age Range’,      example: ‘Late 30s’ },
{ key: ‘profession’,     label: ‘Profession’,     example: ‘Disgraced architect’ },
{ key: ‘background’,     label: ‘Background’,     example: ‘Grew up in a fishing village, moved to the city at 16’ },
{ key: ‘motivation’,     label: ‘Motivation’,     example: ‘Wants to reconnect with an estranged daughter’ },
{ key: ‘hobbies’,        label: ‘Hobbies’,        example: ‘Collects vintage maps, plays chess badly’ },
{ key: ‘personality’,    label: ‘Personality’,    example: ‘Quietly stubborn, disarmingly warm with strangers’ },
{ key: ‘talents’,        label: ‘Talents’,        example: ‘Exceptional memory, can mimic any accent’ },
{ key: ‘flaw’,           label: ‘Flaw’,           example: ‘Cannot accept help from anyone’ },
{ key: ‘secret’,         label: ‘Secret’,         example: ‘Changed their name 12 years ago and never told anyone why’ },
{ key: ‘voice’,          label: ‘Voice’,          example: ‘Speaks in understatements, rarely finishes sentences’ },
{ key: ‘physicalDetail’, label: ‘Physical Detail’, example: ‘Always wears the same worn leather bracelet’ },
{ key: ‘name’,           label: ‘Name’,           example: ‘Optional — leave off for mystery’ },
];

const FictiflyLogo = () => (
<svg viewBox=“0 0 250 45” xmlns=“http://www.w3.org/2000/svg” style={{ width: ‘200px’, height: ‘35px’, display: ‘block’ }}>
<text x="0" y="28" fontSize="28" fontWeight="600" letterSpacing="-1.5" fontFamily="system-ui, sans-serif">
<tspan fill="#3A3226">ficti</tspan><tspan fill="#D4845A">fly</tspan>
</text>
<rect x="0" y="34" width="16" height="3" rx="1.5" fill="#5B9EC9" opacity="0.35"/>
<rect x="20" y="33" width="19" height="4" rx="2" fill="#5B9EC9" opacity="0.55"/>
<rect x="43" y="32" width="21" height="5" rx="2.5" fill="#5B9EC9" opacity="0.75"/>
<rect x="68" y="31" width="24" height="6" rx="3" fill="#5B9EC9"/>
<rect x="96" y="31" width="24" height="6" rx="3" fill="none" stroke="#D9C9B0" strokeWidth="1"/>
<rect x="124" y="31" width="24" height="6" rx="3" fill="none" stroke="#D9C9B0" strokeWidth="1"/>
<rect x="152" y="31" width="24" height="6" rx="3" fill="none" stroke="#D9C9B0" strokeWidth="1"/>
</svg>
);

const Label = ({ children }) => (
<span style={{ fontFamily: “‘DM Sans’, sans-serif”, fontSize: ‘0.62rem’, fontWeight: 600, letterSpacing: ‘0.12em’, textTransform: ‘uppercase’, color: B.inkLight }}>
{children}
</span>
);

const Divider = () => <div style={{ height: ‘1px’, background: B.sandMid }} />;

// Individual character field row in the sheet
const FieldRow = ({ field, value, locked, onToggleLock, onDeselect, onRefresh, refreshing }) => (

  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
    padding: '0.85rem 0', borderBottom: `1px solid ${B.sandMid}`,
    animation: 'fadeUp 0.3s ease',
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Label>{field.label}</Label>
      <div style={{
        fontFamily: "'Fraunces', serif", fontSize: '1.05rem', fontWeight: 500,
        marginTop: '0.2rem', lineHeight: 1.5,
        fontStyle: value ? 'normal' : 'italic',
        color: value ? B.ink : B.inkLight,
      }}>
        {value || field.example}
      </div>
    </div>
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', paddingTop: '0.15rem', flexShrink: 0 }}>
      {/* Refresh individual field */}
      <button
        onClick={() => onRefresh(field.key)}
        disabled={locked || refreshing}
        title="Regenerate this field"
        style={{
          width: 28, height: 28, borderRadius: '7px', border: `1px solid ${B.sandDeep}`,
          background: 'transparent', color: B.inkLight, cursor: locked || refreshing ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', transition: 'all 0.15s',
          opacity: locked ? 0.35 : 1,
        }}
        onMouseEnter={e => { if (!locked && !refreshing) { e.currentTarget.style.background = B.sandMid; e.currentTarget.style.color = B.ink; }}}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = B.inkLight; }}
      >
        {refreshing ? '…' : '↻'}
      </button>
      {/* Lock toggle */}
      <button
        onClick={() => onToggleLock(field.key)}
        title={locked ? 'Unlock field' : 'Lock field'}
        style={{
          width: 28, height: 28, borderRadius: '7px',
          border: `1px solid ${locked ? B.terra : B.sandDeep}`,
          background: locked ? '#FDF0E8' : 'transparent',
          color: locked ? B.terra : B.inkLight,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', transition: 'all 0.15s',
        }}
      >
        {locked ? '🔒' : '🔓'}
      </button>
      {/* Deselect */}
      <button
        onClick={() => onDeselect(field.key)}
        title="Remove this field"
        style={{
          width: 28, height: 28, borderRadius: '7px', border: `1px solid ${B.sandDeep}`,
          background: 'transparent', color: B.inkLight, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FDF0E8'; e.currentTarget.style.color = B.terraDark; e.currentTarget.style.borderColor = B.terra; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = B.inkLight; e.currentTarget.style.borderColor = B.sandDeep; }}
      >
        ✕
      </button>
    </div>
  </div>
);

export default function CharacterGenerator() {
const { user, profile } = useAuth();

// Which fields are active (shown in sheet)
const [activeFields, setActiveFields] = useState(
new Set(ALL_FIELDS.map(f => f.key))
);
// Which fields are locked
const [lockedFields, setLockedFields] = useState(new Set());
// Generated values per field key
const [values, setValues] = useState({});
// AI summary
const [summary, setSummary] = useState(’’);

const [loading, setLoading] = useState(false);
const [refreshingField, setRefreshingField] = useState(null);
const [error, setError] = useState(null);
const [tab, setTab] = useState(‘generate’);
const [savedCharacters, setSavedCharacters] = useState([]);
const [loadingSaved, setLoadingSaved] = useState(false);
const [savingId, setSavingId] = useState(null);
const [copiedSheet, setCopiedSheet] = useState(false);
const [copiedSummary, setCopiedSummary] = useState(false);
const [usageCount, setUsageCount] = useState(0);
const [newBadges, setNewBadges] = useState([]);

const trialActive = profile?.premium_expires_at
? new Date(profile.premium_expires_at) > new Date()
: false;
const isPremiumUser = profile && (profile.is_premium || trialActive);
const isTeacher = profile?.account_type === ‘teacher’;
const canSave = isPremiumUser || isTeacher;
const FREE_LIMIT =
isTeacher ? Infinity
: isPremiumUser ? Infinity
: profile?.account_type === ‘student’ ? 15
: profile?.account_type === ‘minor’ ? 10
: 6;
const isUnlimited = isPremiumUser || isTeacher;

useEffect(() => {
fetchUsage();
if (canSave) fetchSavedCharacters();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const fetchUsage = async () => {
const today = new Date().toISOString().split(‘T’)[0];
const { data } = await supabase
.from(‘prompt_usage’)
.select(‘count’)
.eq(‘user_id’, user.id)
.eq(‘usage_date’, today)
.maybeSingle();
setUsageCount(data ? data.count : 0);
};

const trackUsage = async () => {
const today = new Date().toISOString().split(‘T’)[0];
const newCount = usageCount + 1;
await supabase.from(‘prompt_usage’).upsert(
{ user_id: user.id, usage_date: today, count: newCount },
{ onConflict: ‘user_id,usage_date’ }
);
setUsageCount(newCount);
};

const fetchSavedCharacters = async () => {
setLoadingSaved(true);
const { data } = await supabase
.from(‘saved_characters’)
.select(’*’)
.eq(‘user_id’, user.id)
.order(‘created_at’, { ascending: false });
setSavedCharacters(data || []);
setLoadingSaved(false);
};

// Build the generation prompt
const buildPrompt = (fieldKeys) => {
const fieldDescriptions = fieldKeys.map(key => {
const f = ALL_FIELDS.find(f => f.key === key);
return `- "${key}": ${f.label} (e.g. "${f.example}")`;
}).join(’\n’);

```
return `Generate a compelling, specific, literary character with the following fields. Make each detail feel like it comes from a real person — specific, surprising, and interconnected where possible. Avoid clichés.
```

Fields to generate:
${fieldDescriptions}

Respond ONLY with a JSON object with exactly these keys. No markdown, no preamble.
Example format: {“ageRange”:“Late 30s”,“profession”:“Disgraced architect”,…}`;
};

const buildSummaryPrompt = (charValues) => {
const details = Object.entries(charValues)
.map(([key, val]) => {
const f = ALL_FIELDS.find(f => f.key === key);
return `${f?.label || key}: ${val}`;
}).join(’\n’);

```
const hasName = charValues.name;
const nameInstruction = !hasName
  ? ' Do not invent or use a name for this character — refer to them only as "they" or "them".'
  : '';
return `Given this character's details:\n\n${details}\n\nWrite a single, vivid paragraph (3–5 sentences) that captures who this person is — their essence, contradictions, and what makes them compelling as a fictional character. Write in third person. Be literary and specific. Do not list the traits — synthesise them into a portrait.${nameInstruction}`;
```

};

```
const generate = useCallback(async () => {
if (!isUnlimited && usageCount >= FREE_LIMIT) {
  setError(`Free accounts are limited to ${FREE_LIMIT} prompts per day. Upgrade to premium for unlimited generations.`);
  return;
}

setLoading(true);
setError(null);
setSummary('');

// Fields to generate = active & not locked
const fieldsToGenerate = [...activeFields].filter(k => !lockedFields.has(k));

if (fieldsToGenerate.length === 0) {
  setError('All active fields are locked. Unlock at least one field to generate new values.');
  setLoading(false);
  return;
}

try {
  // Step 1: Generate field values
  const fieldRes = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: buildPrompt(fieldsToGenerate) }],
    }),
  });
  const fieldData = await fieldRes.json();
  const fieldText = fieldData.content.map(b => b.text || '').join('');
  const clean = fieldText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  const newValues = { ...values, ...parsed };
  setValues(newValues);

  // Step 2: Generate summary from all active fields
  const summaryValues = {};
  [...activeFields].forEach(k => {
    if (newValues[k]) summaryValues[k] = newValues[k];
  });

  const summaryRes = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: buildSummaryPrompt(summaryValues) }],
    }),
  });
  const summaryData = await summaryRes.json();
  const summaryText = summaryData.content.map(b => b.text || '').join('').trim();
  setSummary(summaryText);

  await trackUsage();

  // Badge check
  const badgeRes = await fetch('/api/check-badges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });
  const badgeData = await badgeRes.json();
  if (badgeData.newlyEarned?.length > 0) {
    setNewBadges(badgeData.newlyEarned);
  }
} catch {
  setError('Something went wrong generating the character. Please try again.');
}

setLoading(false);
```

// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeFields, lockedFields, values, usageCount, isUnlimited]);

const refreshSingleField = async (key) => {
if (!isUnlimited && usageCount >= FREE_LIMIT) {
setError(`Daily limit reached. Come back tomorrow or upgrade to premium.`);
return;
}
setRefreshingField(key);
setError(null);
try {
const res = await fetch(’/api/generate’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({
model: ‘claude-sonnet-4-6’,
max_tokens: 200,
messages: [{ role: ‘user’, content: buildPrompt([key]) }],
}),
});
const data = await res.json();
const text = data.content.map(b => b.text || ‘’).join(’’);
const clean = text.replace(/`json|`/g, ‘’).trim();
const parsed = JSON.parse(clean);
const newValues = { …values, [key]: parsed[key] };
setValues(newValues);

```
  // Regenerate summary if we have enough fields
  const activeWithValues = [...activeFields].filter(k => newValues[k]);
  if (activeWithValues.length >= 2) {
    const summaryValues = {};
    activeWithValues.forEach(k => { summaryValues[k] = newValues[k]; });
    const sRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: buildSummaryPrompt(summaryValues) }],
      }),
    });
    const sData = await sRes.json();
    setSummary(sData.content.map(b => b.text || '').join('').trim());
  }
} catch {
  setError('Something went wrong. Please try again.');
}
setRefreshingField(null);
```

};

const toggleLock = (key) => {
setLockedFields(prev => {
const next = new Set(prev);
next.has(key) ? next.delete(key) : next.add(key);
return next;
});
};

const deselect = (key) => {
setActiveFields(prev => {
const next = new Set(prev);
next.delete(key);
return next;
});
setLockedFields(prev => {
const next = new Set(prev);
next.delete(key);
return next;
});
};

const reselect = (key) => {
setActiveFields(prev => new Set([…prev, key]));
};

const copySheet = () => {
const lines = […activeFields].map(key => {
const f = ALL_FIELDS.find(f => f.key === key);
return `${f.label.toUpperCase()}: ${values[key] || '—'}`;
});
const text = lines.join(’\n’) + (summary ? `\n\n---\n${summary}` : ‘’);
navigator.clipboard.writeText(text);
setCopiedSheet(true);
setTimeout(() => setCopiedSheet(false), 1800);
};

const copySummary = () => {
navigator.clipboard.writeText(summary);
setCopiedSummary(true);
setTimeout(() => setCopiedSummary(false), 1800);
};

const saveCharacter = async () => {
if (!canSave) return;
setSavingId(‘saving’);
const characterData = {};
[…activeFields].forEach(k => {
if (values[k]) characterData[k] = values[k];
});
const { error: saveError } = await supabase.from(‘saved_characters’).insert({
user_id: user.id,
character_data: characterData,
summary,
});
if (!saveError) {
setSavingId(‘saved’);
if (canSave) fetchSavedCharacters();
const badgeRes = await fetch(’/api/check-badges’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({ userId: user.id }),
});
const badgeData = await badgeRes.json();
if (badgeData.newlyEarned?.length > 0) setNewBadges(badgeData.newlyEarned);
} else {
setSavingId(null);
}
setTimeout(() => setSavingId(null), 2000);
};

const deleteCharacter = async (id) => {
await supabase.from(‘saved_characters’).delete().eq(‘id’, id);
setSavedCharacters(prev => prev.filter(c => c.id !== id));
};

const hasValues = Object.keys(values).length > 0;

return (
<div style={{ minHeight: ‘100vh’, background: B.sand, backgroundImage: `radial-gradient(ellipse at 5% 5%, rgba(91,158,201,0.13) 0%, transparent 45%), radial-gradient(ellipse at 95% 90%, rgba(212,132,90,0.11) 0%, transparent 45%)`, fontFamily: “‘DM Sans’, sans-serif”, color: B.ink, padding: ‘0 1.25rem 5rem’ }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap'); @keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } * { box-sizing: border-box; margin: 0; }`}</style>

```
  {/* Nav */}
  <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${B.sandDeep}`, marginBottom: '2rem' }}>
    <Link to="/dashboard" style={{ color: B.inkMid, textDecoration: 'none', fontSize: '0.85rem' }}>← Dashboard</Link>
    <Link to="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
      <FictiflyLogo />
    </Link>
  </div>

  <div style={{ maxWidth: 640, margin: '0 auto' }}>

    {/* Hero */}
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <svg width="52" height="24" viewBox="0 0 52 24" fill="none" style={{ marginBottom: '1.2rem' }}>
        <circle cx="14" cy="10" r="6" stroke={B.seaMid} strokeWidth="2.2" fill="none"/>
        <path d="M2 22 C2 16, 26 16, 26 22" stroke={B.seaMid} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <circle cx="36" cy="10" r="5" stroke={B.terra} strokeWidth="2" fill="none" opacity="0.7"/>
        <path d="M24 22 C24 17, 46 17, 46 22" stroke={B.terra} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      </svg>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.terra, marginBottom: '0.8rem' }}>Character Generator</div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(2.2rem, 6.5vw, 3.4rem)', fontWeight: 700, color: B.ink, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
        Build a person,<br /><span style={{ color: B.seaDeep, fontStyle: 'italic', fontWeight: 500 }}>layer by layer.</span>
      </h1>
      <p style={{ color: B.inkMid, fontSize: '0.97rem', lineHeight: 1.65, maxWidth: 420, margin: '0 auto 1.5rem' }}>
        Choose your fields, generate a character, lock what you love, and regenerate the rest.
      </p>
      {!isUnlimited && (
        <div style={{ display: 'inline-block', background: B.sandMid, borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.78rem', color: B.inkMid }}>
          {usageCount}/{FREE_LIMIT} prompts used today
        </div>
      )}
    </div>

    {/* Tabs */}
    <div style={{ display: 'inline-flex', background: B.sandMid, borderRadius: '12px', padding: '4px', gap: '2px', marginBottom: '1.75rem', width: '100%' }}>
      {['generate', canSave ? 'saved' : null].filter(Boolean).map(t => (
        <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? B.white : 'transparent', border: 'none', borderRadius: '9px', color: tab === t ? B.ink : B.inkLight, fontFamily: "'DM Sans', sans-serif", fontWeight: tab === t ? 600 : 400, fontSize: '0.85rem', padding: '0.5rem 1.35rem', transition: 'all 0.18s', boxShadow: tab === t ? '0 1px 4px rgba(58,50,38,0.1)' : 'none', cursor: 'pointer' }}>
          {t === 'generate' ? 'Generate' : `Saved${savedCharacters.length > 0 ? ` (${savedCharacters.length})` : ''}`}
        </button>
      ))}
    </div>

    {/* ── GENERATE TAB ── */}
    {tab === 'generate' && (
      <div>
        {/* Field selector panel */}
        <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.5rem 1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: B.ink }}>Active fields</div>
              <div style={{ fontSize: '0.75rem', color: B.inkLight, marginTop: '0.15rem' }}>Toggle to include or exclude from generation</div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setActiveFields(new Set(ALL_FIELDS.map(f => f.key)))}
                style={{ fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", color: B.inkMid, background: 'transparent', border: `1px solid ${B.sandDeep}`, borderRadius: '7px', padding: '0.3rem 0.7rem', cursor: 'pointer' }}
              >All on</button>
              <button
                onClick={() => { setActiveFields(new Set()); setLockedFields(new Set()); }}
                style={{ fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", color: B.inkMid, background: 'transparent', border: `1px solid ${B.sandDeep}`, borderRadius: '7px', padding: '0.3rem 0.7rem', cursor: 'pointer' }}
              >All off</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {ALL_FIELDS.map(f => {
              const isActive = activeFields.has(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => isActive ? deselect(f.key) : reselect(f.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.3rem 0.7rem', borderRadius: '20px', cursor: 'pointer',
                    border: `1.5px solid ${isActive ? B.seaMid : B.sandDeep}`,
                    background: isActive ? '#EAF4FB' : 'transparent',
                    color: isActive ? B.seaDeep : B.inkLight,
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                >
                    <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.25rem 1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.82rem', color: B.inkMid }}>
            {lockedFields.size > 0
              ? <span>🔒 <strong>{lockedFields.size}</strong> field{lockedFields.size !== 1 ? 's' : ''} locked — will stay on regenerate</span>
              : <span style={{ color: B.inkLight }}>Lock fields you want to keep before regenerating</span>
            }
          </div>
          {!isUnlimited && (
            <div style={{ fontSize: '0.78rem', color: usageCount >= FREE_LIMIT ? B.terraDark : B.inkLight, background: usageCount >= FREE_LIMIT ? '#FDF0E8' : B.sandMid, borderRadius: '8px', padding: '0.35rem 0.8rem' }}>
              {usageCount >= FREE_LIMIT ? 'Daily limit reached. Come back tomorrow!' : `${FREE_LIMIT - usageCount} of ${FREE_LIMIT} remaining today`}
            </div>
          )}
          <button
            onClick={generate}
            disabled={loading || activeFields.size === 0}
            style={{ background: loading || activeFields.size === 0 ? B.sandDeep : B.seaDeep, color: B.white, border: 'none', borderRadius: '10px', padding: '0.65rem 1.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem', cursor: loading || activeFields.size === 0 ? 'not-allowed' : 'pointer', transition: 'background 0.18s', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = B.seaMid; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = B.seaDeep; }}
          >
            {loading
              ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.8s linear infinite' }} />Generating…</>
              : hasValues ? 'Regenerate →' : 'Generate character →'
            }
          </button>
        </div>

        {error && (
          <div style={{ background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '10px', color: B.terraDark, padding: '0.8rem 1.1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Character Sheet */}
        {hasValues && (
          <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(58,50,38,0.06)', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 500, color: B.ink }}>
                {values.name ? values.name : 'Character Sheet'}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  onClick={copySheet}
                  style={{ background: copiedSheet ? B.seaMid : 'transparent', border: `1px solid ${copiedSheet ? B.seaMid : B.sandDeep}`, color: copiedSheet ? B.white : B.inkMid, borderRadius: '8px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s' }}
                >
                  {copiedSheet ? '✓ Copied' : 'Copy sheet'}
                </button>
                {canSave && (
                  <button
                    onClick={saveCharacter}
                    disabled={savingId === 'saving'}
                    style={{ background: savingId === 'saved' ? '#F0F7ED' : 'transparent', border: `1px solid ${savingId === 'saved' ? '#6BAF72' : B.sandDeep}`, color: savingId === 'saved' ? '#3A7040' : B.inkMid, borderRadius: '8px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: savingId === 'saving' ? 'not-allowed' : 'pointer', transition: 'all 0.18s' }}
                  >
                    {savingId === 'saved' ? '✓ Saved!' : savingId === 'saving' ? 'Saving…' : '☆ Save character'}
                  </button>
                )}
              </div>
            </div>

            {/* Field rows — active fields only */}
            <div>
              {ALL_FIELDS.filter(f => activeFields.has(f.key)).map(f => (
                <FieldRow
                  key={f.key}
                  field={f}
                  value={values[f.key]}
                  locked={lockedFields.has(f.key)}
                  onToggleLock={toggleLock}
                  onDeselect={deselect}
                  onRefresh={refreshSingleField}
                  refreshing={refreshingField === f.key}
                />
              ))}
            </div>

            {/* Summary */}
            {summary && (
              <div style={{ marginTop: '1.5rem' }}>
                <Divider />
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Label>Character Summary</Label>
                    <button
                      onClick={copySummary}
                      style={{ background: copiedSummary ? B.seaMid : 'transparent', border: `1px solid ${copiedSummary ? B.seaMid : B.sandDeep}`, color: copiedSummary ? B.white : B.inkMid, borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s' }}
                    >
                      {copiedSummary ? '✓ Copied' : 'Copy summary'}
                    </button>
                  </div>
                  <p style={{ fontFamily: "'Fraunces', serif", fontSize: '1.02rem', fontWeight: 400, fontStyle: 'italic', color: B.inkMid, lineHeight: 1.75 }}>
                    {summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasValues && !loading && (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: B.inkLight, fontSize: '0.93rem', fontStyle: 'italic' }}>
            Select your fields and press generate to build a character.
          </div>
        )}
      </div>
    )}

    {/* ── SAVED TAB ── */}
    {tab === 'saved' && (
      <div>
        {loadingSaved ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: B.inkLight, fontSize: '0.93rem', fontStyle: 'italic' }}>Loading saved characters…</div>
        ) : savedCharacters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: B.inkLight, fontSize: '0.93rem', fontStyle: 'italic' }}>No saved characters yet — generate one and press Save!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {savedCharacters.map(c => (
              <div key={c.id} style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.5rem 1.75rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.05rem', fontWeight: 500, color: B.ink }}>
                    {c.character_data?.name || 'Unnamed Character'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", color: B.inkLight }}>
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => deleteCharacter(c.id)}
                      style={{ background: 'transparent', border: `1px solid ${B.sandDeep}`, color: B.inkLight, borderRadius: '7px', padding: '0.2rem 0.55rem', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.color = B.terraDark; e.currentTarget.style.borderColor = B.terra; }}
                      onMouseLeave={e => { e.currentTarget.style.color = B.inkLight; e.currentTarget.style.borderColor = B.sandDeep; }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {/* Quick summary of fields */}
                <div>
                  {ALL_FIELDS.filter(f => c.character_data?.[f.key]).map(f => (
                    <div key={f.key} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: `1px solid ${B.sandMid}` }}>

                      <div>
                        <Label>{f.label}</Label>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '0.95rem', color: B.ink, marginTop: '0.1rem' }}>{c.character_data[f.key]}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {c.summary && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${B.sandMid}` }}>
                    <Label>Summary</Label>
                    <p style={{ fontFamily: "'Fraunces', serif", fontSize: '0.93rem', fontStyle: 'italic', color: B.inkMid, lineHeight: 1.7, marginTop: '0.35rem' }}>{c.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>

  <BadgeToast badges={newBadges} onDismiss={() => setNewBadges([])} />
</div>
```

);
}