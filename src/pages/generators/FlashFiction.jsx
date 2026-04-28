import { Link, useLocation } from 'react-router-dom';
import BadgeToast from '../../components/BadgeToast';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';

const GENRES = [
  "Action/Adventure","Comedy","Crime Caper","Drama","Fairy Tale","Fantasy",
  "Ghost Story","Historical Fiction","Horror","Mystery","Political Satire",
  "Romance","Romantic Comedy","Sci-Fi","Spy","Suspense","Thriller","Open Genre",
];

const B = {
  sand:"#F5EFE6", sandMid:"#EDE3D4", sandDeep:"#D9C9B0",
  terra:"#D4845A", terraDark:"#B56840", seaMid:"#5B9EC9", seaDeep:"#2E6DA4",
  ink:"#3A3226", inkMid:"#6B5D4E", inkLight:"#9A8878", white:"#FFFCF8",
};

const GENRE_COLORS = [
  { bg:"#EAF4FB", border:"#5B9EC9", text:"#2E6DA4" },
  { bg:"#FDF0E8", border:"#D4845A", text:"#B56840" },
  { bg:"#F0F7ED", border:"#6BAF72", text:"#3A7040" },
  { bg:"#FDF5E8", border:"#C8A060", text:"#9A6830" },
  { bg:"#F5EDF5", border:"#B07AC0", text:"#7A4A90" },
];

const genreColor = (genre) => GENRE_COLORS[GENRES.indexOf(genre) % GENRE_COLORS.length] || GENRE_COLORS[0];
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const INSTRUCTIONS = {
  500: <>Three ingredients, one story. The <strong style={{ color:"#3A3226", fontWeight:600 }}>action</strong> is your spark — it must happen somewhere in your narrative, whether your character lives it in the moment, revisits it in a flashback, or stumbles through it in a dream. The <strong style={{ color:"#3A3226", fontWeight:600 }}>object</strong> must make a physical appearance somewhere in your story — it's not just a metaphor, it has to show up. The <strong style={{ color:"#3A3226", fontWeight:600 }}>genre</strong> is your playground.</>,
  1000: <>Three ingredients, one story. The <strong style={{ color:"#3A3226", fontWeight:600 }}>location</strong> is your world — it must be the predominant setting of your story. Other places may appear, but your assigned location takes center stage. The <strong style={{ color:"#3A3226", fontWeight:600 }}>object</strong> must make a physical appearance somewhere in your narrative — it's not just a metaphor, it has to show up. The <strong style={{ color:"#3A3226", fontWeight:600 }}>genre</strong> is your playground.</>,
};

const PromptCard = ({ prompt, onSave, isSaved, onRemove, onMarkWritten, isWritten }) => {
  const [copied, setCopied] = useState(false);
  const gc = genreColor(prompt.genre);
  const is500 = prompt.wordCount === 500;

  const handleCopy = () => {
    const middle = is500 ? `ACTION: ${prompt.action}` : `LOCATION: ${prompt.location}`;
    const text = `${prompt.wordCount}-WORD CHALLENGE\nGENRE: ${prompt.genre}\n${middle}\nOBJECT: ${prompt.object}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ background:B.white, border:`1px solid ${B.sandDeep}`, borderRadius:'14px', padding:'1.5rem 1.75rem', display:'flex', flexDirection:'column', gap:'1rem', boxShadow:'0 2px 12px rgba(58,50,38,0.06)', transition:'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 24px rgba(58,50,38,0.11)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(58,50,38,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}>
      <div style={{ display:'flex', gap:'0.45rem', flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ background:B.terra, color:B.white, fontSize:'0.62rem', fontFamily:"'DM Sans', sans-serif", fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', padding:'0.22rem 0.65rem', borderRadius:'20px' }}>{prompt.wordCount} words</span>
        <span style={{ background:gc.bg, color:gc.text, border:`1px solid ${gc.border}`, fontSize:'0.62rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, letterSpacing:'0.06em', padding:'0.22rem 0.65rem', borderRadius:'20px' }}>{prompt.genre}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.55rem' }}>
        {is500 ? (
          <div style={{ display:'flex', alignItems:'baseline', gap:'0.75rem' }}>
            <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:B.inkLight, minWidth:62 }}>Action</span>
            <span style={{ fontFamily:"'Fraunces', serif", fontSize:'1.2rem', fontWeight:500, color:B.ink, fontStyle:'italic' }}>{prompt.action}</span>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'baseline', gap:'0.75rem' }}>
            <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:B.inkLight, minWidth:62 }}>Location</span>
            <span style={{ fontFamily:"'Fraunces', serif", fontSize:'1.2rem', fontWeight:500, color:B.ink, fontStyle:'italic' }}>{prompt.location}</span>
          </div>
        )}
        <div style={{ height:'1px', background:B.sandMid }} />
        <div style={{ display:'flex', alignItems:'baseline', gap:'0.75rem' }}>
          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:B.inkLight, minWidth:62 }}>Object</span>
          <span style={{ fontFamily:"'Fraunces', serif", fontSize:'1.2rem', fontWeight:500, color:B.seaDeep, fontStyle:'italic' }}>{prompt.object}</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
        <button onClick={handleCopy} style={{ background:copied ? B.seaMid : 'transparent', border:`1px solid ${copied ? B.seaMid : B.sandDeep}`, color:copied ? B.white : B.inkMid, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}>{copied ? '✓ Copied' : 'Copy'}</button>
        {isSaved ? (
          <button onClick={() => onRemove(prompt.id)} style={{ background:B.terra, border:`1px solid ${B.terra}`, color:B.white, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer' }}>★ Saved</button>
        ) : (
          <button onClick={() => onSave(prompt)} style={{ background:'transparent', border:`1px solid ${B.sandDeep}`, color:B.inkMid, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}>☆ Save</button>
        )}
        {prompt.dbId && (
          isWritten ? (
            <button style={{ background:'#F0F7ED', border:'1px solid #6BAF72', color:'#3A7040', borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'default' }}>✓ Written!</button>
          ) : (
            <button onClick={() => onMarkWritten(prompt.dbId)} style={{ background:'transparent', border:`1px solid ${B.sandDeep}`, color:B.inkMid, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer' }}>✍️ I wrote this!</button>
          )
        )}
      </div>
    </div>
  );
};

const ToggleBtn = ({ active, onClick, children, wide }) => (
  <button onClick={onClick} style={{ height:36, padding:wide ? '0 1.1rem' : '0 1rem', borderRadius:'8px', border:`1.5px solid ${active ? B.terra : B.sandDeep}`, background:active ? B.terra : 'transparent', color:active ? B.white : B.inkMid, fontFamily:"'DM Sans', sans-serif", fontSize:'0.8rem', fontWeight:500, cursor:'pointer', transition:'all 0.18s', whiteSpace:'nowrap' }}>{children}</button>
);

const Label = ({ children }) => (
  <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:B.inkLight, minWidth:68 }}>{children}</span>
);

const Divider = () => <div style={{ height:'1px', background:B.sandMid }} />;

export default function FlashFiction() {
  const { user, profile } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const [tab, setTab] = useState(new URLSearchParams(location.search).get('tab') || 'generate');
  const [wordCount, setWordCount] = useState(500);
  const [count, setCount] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState('random');
  const [customGenre, setCustomGenre] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [writtenPrompts, setWrittenPrompts] = useState([]);

  const FREE_LIMIT =
    profile && profile.account_type === 'teacher' ? Infinity
    : profile && profile.account_type === 'premium' ? Infinity
    : profile && profile.account_type === 'student' ? 15
    : profile && profile.account_type === 'minor' ? 10
    : 6;
  const isUnlimited = profile && (profile.account_type === 'premium' || profile.account_type === 'teacher');

  useEffect(() => {
    fetchSavedPrompts();
    fetchUsage();
    fetchWrittenPrompts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWrittenPrompts = async () => {
  const { data } = await supabase
    .from('submissions')
    .select('prompt_id')
    .eq('user_id', user.id);
  setWrittenPrompts(data ? data.map(s => s.prompt_id) : []);
};

  const fetchUsage = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('prompt_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();
    setUsageCount(data ? data.count : 0);
  };

  const fetchSavedPrompts = async () => {
    setLoadingSaved(true);
    const { data } = await supabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', user.id)
      .eq('prompt_type', 'flash-fiction')
      .order('created_at', { ascending: false });
    setSaved(data || []);
    setLoadingSaved(false);
  };

  const trackUsage = async (newCount) => {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('prompt_usage').upsert({
      user_id: user.id,
      usage_date: today,
      count: newCount,
    }, { onConflict: 'user_id,usage_date' });
    setUsageCount(newCount);
  };

  const handleWordCount = (wc) => {
    setWordCount(wc);
    setPrompts([]);
  };

  const generate = useCallback(async () => {
    if (!isUnlimited && usageCount + count > FREE_LIMIT) {
      setError(`Free accounts are limited to ${FREE_LIMIT} prompts per day. Upgrade to premium for unlimited prompts.`);
      return;
    }
    setLoading(true);
    setError(null);
    const resolvedGenre = selectedGenre === 'random' ? null
      : selectedGenre === 'custom' ? (customGenre.trim() || 'Open Genre')
      : selectedGenre;
    const genres = Array.from({ length: count }, () => resolvedGenre || pickRandom(GENRES));

    const promptContent = wordCount === 500
      ? `Generate exactly ${count} short story writing prompt(s) for a 500-word challenge. For each prompt provide:
- An ACTION: a creative gerund word that must occur in the story (e.g. "Warning", "Unraveling", "Wandering")
- An OBJECT: a single concrete physical object, simply named (e.g. "a sealed envelope", "a compass")
Be varied and keep descriptions minimal. Genres: ${genres.map((g, i) => `Prompt ${i + 1}: "${g}"`).join(', ')}.
Respond ONLY with JSON: [{"action":"...","object":"..."},...]`
      : `Generate exactly ${count} short story writing prompt(s) for a 1000-word challenge. For each prompt provide:
- A LOCATION: a simple evocative place, simply named (e.g. "a visitor center", "a pawnshop")
- An OBJECT: a single concrete physical object, simply named (e.g. "a stopwatch", "a compass")
Be varied and keep descriptions minimal. Genres: ${genres.map((g, i) => `Prompt ${i + 1}: "${g}"`).join(', ')}.
Respond ONLY with JSON: [{"location":"...","object":"..."},...]`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: promptContent }],
        }),
      });
      const data = await response.json();
      const text = data.content.map(b => b.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const result = parsed.map((p, i) => ({
        id: Date.now() + i,
        genre: genres[i],
        wordCount,
        prompt_type: 'flash-fiction',
        ...(wordCount === 500 ? { action: p.action } : { location: p.location }),
        object: p.object,
      }));
      setPrompts(result);
      await trackUsage(usageCount + count);
      await fetch('/api/update-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const badgeRes = await fetch('/api/check-badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const badgeData = await badgeRes.json();
      if (badgeData.newlyEarned && badgeData.newlyEarned.length > 0) {
        setNewBadges(badgeData.newlyEarned);
      }
    } catch {
      setError('Something went wrong generating prompts. Please try again.');
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, wordCount, selectedGenre, customGenre, usageCount, isUnlimited]);

  const savePrompt = async (prompt) => {
    const { data, error: saveError } = await supabase.from('saved_prompts').insert({
      user_id: user.id,
      genre: prompt.genre,
      prompt_type: 'flash-fiction',
      word_count: prompt.wordCount,
      action: prompt.action || null,
      location: prompt.location || null,
      object: prompt.object,
    }).select().single();
    if (!saveError && data) {
      setSaved(prev => [data, ...prev]);
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, dbId: data.id } : p));
    }
  };

  const removePrompt = async (id) => {
    await supabase.from('saved_prompts').delete().eq('id', id);
    setSaved(prev => prev.filter(p => p.id !== id));
  };

const markWritten = async (savedPromptId) => {
  const { data, error: subError } = await supabase.from('submissions').insert({
    user_id: user.id,
    prompt_id: savedPromptId,
    prompt_type: 'flash-fiction',
    genre: prompts.find(p => p.dbId === savedPromptId)?.genre || null,
    word_count: wordCount,
  }).select().single();
  if (!subError && data) {
    setWrittenPrompts(prev => [...prev, savedPromptId]);
    const badgeRes = await fetch('/api/check-badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    const badgeData = await badgeRes.json();
    if (badgeData.newlyEarned && badgeData.newlyEarned.length > 0) {
      setNewBadges(badgeData.newlyEarned);
    }
  }
};

  const isSaved = (prompt) => saved.some(s =>
    s.genre === prompt.genre &&
    s.word_count === prompt.wordCount &&
    s.object === prompt.object
  );

  return (
    <div style={{ minHeight:'100vh', background:B.sand, backgroundImage:`radial-gradient(ellipse at 5% 5%, rgba(91,158,201,0.13) 0%, transparent 45%), radial-gradient(ellipse at 95% 90%, rgba(212,132,90,0.11) 0%, transparent 45%)`, fontFamily:"'DM Sans', sans-serif", color:B.ink, padding:'0 1.25rem 5rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap'); @keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } } * { box-sizing: border-box; margin: 0; }`}</style>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'1.25rem 0', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${B.sandDeep}`, marginBottom:'2rem' }}>
        <Link to="/dashboard" style={{ color:B.inkMid, textDecoration:'none', fontSize:'0.85rem' }}>← Dashboard</Link>
        <div style={{ fontFamily:"'Fraunces', serif", fontSize:'1.3rem', fontWeight:700, color:B.ink }}>Fictifly</div>
      </div>

      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <svg width="52" height="24" viewBox="0 0 52 24" fill="none" style={{ marginBottom:'1.2rem' }}>
            <path d="M4 16 C10 7, 18 7, 26 16 C34 25, 42 25, 48 16" stroke={B.seaMid} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:B.terra, marginBottom:'0.8rem' }}>Flash Fiction Challenge</div>
          <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(2.2rem, 6.5vw, 3.6rem)', fontWeight:700, color:B.ink, lineHeight:1.08, letterSpacing:'-0.02em', marginBottom:'1rem' }}>
            Set the scene,<br /><span style={{ color:B.seaDeep, fontStyle:'italic', fontWeight:500 }}>tell the story.</span>
          </h1>
          <p style={{ color:B.inkMid, fontSize:'0.97rem', lineHeight:1.65, maxWidth:420, margin:'0 auto 1.5rem' }}>
            AI-crafted flash fiction prompts. Choose your word count, pick a genre, and write.
          </p>
          {!isUnlimited && (
            <div style={{ display:'inline-block', background:B.sandMid, borderRadius:'8px', padding:'0.4rem 0.9rem', fontSize:'0.78rem', color:B.inkMid }}>
              {usageCount}/{FREE_LIMIT} prompts used today
            </div>
          )}
        </div>

        <div style={{ display:'inline-flex', background:B.sandMid, borderRadius:'12px', padding:'4px', gap:'2px', marginBottom:'1.75rem', width:'100%' }}>
          {['generate','saved'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, background:tab===t ? B.white : 'transparent', border:'none', borderRadius:'9px', color:tab===t ? B.ink : B.inkLight, fontFamily:"'DM Sans', sans-serif", fontWeight:tab===t ? 600 : 400, fontSize:'0.85rem', padding:'0.5rem 1.35rem', transition:'all 0.18s', boxShadow:tab===t ? '0 1px 4px rgba(58,50,38,0.1)' : 'none', cursor:'pointer' }}>
              {t === 'saved' ? `Saved${saved.length > 0 ? ` (${saved.length})` : ''}` : 'Generate'}
            </button>
          ))}
        </div>

        {tab === 'generate' && (
          <div>
            <div style={{ background:B.white, border:`1px solid ${B.sandDeep}`, borderRadius:'16px', padding:'1.6rem 1.75rem', marginBottom:'1.25rem', boxShadow:'0 2px 12px rgba(58,50,38,0.05)', display:'flex', flexDirection:'column', gap:'1.15rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                <Label>Challenge</Label>
                <div style={{ display:'flex', gap:'0.4rem' }}>
                  <ToggleBtn active={wordCount===500} onClick={() => handleWordCount(500)} wide>500 words</ToggleBtn>
                  <ToggleBtn active={wordCount===1000} onClick={() => handleWordCount(1000)} wide>1,000 words</ToggleBtn>
                </div>
              </div>
              <div style={{ background:B.sand, borderRadius:'8px', padding:'0.65rem 0.9rem', fontSize:'0.8rem', color:B.inkMid }}>
                {wordCount === 500 ? '✦ Generates a Genre, an Action, and an Object' : '✦ Generates a Genre, a Location, and an Object'}
              </div>
              <Divider />
              <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                  <Label>Genre</Label>
                  <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                    <ToggleBtn active={selectedGenre==='random'} onClick={() => setSelectedGenre('random')}>Random</ToggleBtn>
                    <div style={{ position:'relative' }}>
                      <select value={selectedGenre !== 'random' && selectedGenre !== 'custom' ? selectedGenre : ''} onChange={e => { if (e.target.value) setSelectedGenre(e.target.value); }}
                        style={{ height:36, padding:'0 1.8rem 0 0.8rem', borderRadius:'8px', border:`1.5px solid ${selectedGenre !== 'random' && selectedGenre !== 'custom' ? B.terra : B.sandDeep}`, background:selectedGenre !== 'random' && selectedGenre !== 'custom' ? B.terra : 'transparent', color:selectedGenre !== 'random' && selectedGenre !== 'custom' ? B.white : B.inkMid, fontFamily:"'DM Sans', sans-serif", fontSize:'0.8rem', fontWeight:500, cursor:'pointer', outline:'none', appearance:'none' }}>
                        <option value="" disabled>Pick a genre…</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <span style={{ position:'absolute', right:'0.55rem', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:'0.55rem', color:selectedGenre !== 'random' && selectedGenre !== 'custom' ? B.white : B.inkLight }}>▼</span>
                    </div>
                    <ToggleBtn active={selectedGenre==='custom'} onClick={() => setSelectedGenre('custom')}>Custom</ToggleBtn>
                  </div>
                </div>
                {selectedGenre === 'custom' && (
                  <div style={{ paddingLeft:'calc(68px + 0.75rem)' }}>
                    <input type="text" placeholder="e.g. Magical Realism, Weird West…" value={customGenre} onChange={e => setCustomGenre(e.target.value)}
                      style={{ background:B.sand, border:`1.5px solid ${B.sandDeep}`, borderRadius:'8px', color:B.ink, fontFamily:"'DM Sans', sans-serif", fontSize:'0.85rem', padding:'0.42rem 0.9rem', outline:'none', width:'100%', maxWidth:290 }} />
                  </div>
                )}
              </div>
              <Divider />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <Label>Prompts</Label>
                  <div style={{ display:'flex', gap:'0.4rem' }}>
                    {[1,3,5].map(n => (
                      <button key={n} onClick={() => setCount(n)} style={{ width:36, height:36, borderRadius:'8px', border:`1.5px solid ${count===n ? B.terra : B.sandDeep}`, background:count===n ? B.terra : 'transparent', color:count===n ? B.white : B.inkMid, fontFamily:"'DM Sans', sans-serif", fontSize:'0.85rem', fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}>{n}</button>
                    ))}
                  </div>
                </div>
                {!isUnlimited && (
                  <div style={{ fontSize:'0.78rem', color:usageCount >= FREE_LIMIT ? '#B56840' : '#9A8878', background:usageCount >= FREE_LIMIT ? '#FDF0E8' : B.sandMid, borderRadius:'8px', padding:'0.4rem 0.9rem', marginBottom:'0.5rem' }}>
                    {usageCount >= FREE_LIMIT ? 'You have used all your prompts for today. Come back tomorrow!' : `${FREE_LIMIT - usageCount} of ${FREE_LIMIT} prompts remaining today.`}
                  </div>
                )}
                <button onClick={generate} disabled={loading} style={{ background:loading ? B.sandDeep : B.seaDeep, color:B.white, border:'none', borderRadius:'10px', padding:'0.65rem 1.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:600, fontSize:'0.88rem', cursor:loading ? 'not-allowed' : 'pointer', transition:'background 0.18s', display:'flex', alignItems:'center', gap:'0.45rem' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background=B.seaMid; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background=B.seaDeep; }}>
                  {loading ? <><div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', animation:'spin 0.8s linear infinite' }} />Generating…</> : 'Generate prompts →'}
                </button>
              </div>
            </div>

            {error && <div style={{ background:'#FDF0E8', border:`1px solid ${B.terra}`, borderRadius:'10px', color:B.terraDark, padding:'0.8rem 1.1rem', fontSize:'0.85rem', marginBottom:'1rem' }}>{error}</div>}

            {!loading && prompts.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.8rem', animation:'fadeUp 0.4s ease' }}>
                <div style={{ background:B.sandMid, border:`1px solid ${B.sandDeep}`, borderLeft:`4px solid ${B.seaMid}`, borderRadius:'10px', padding:'1rem 1.25rem', fontSize:'0.88rem', lineHeight:1.65, color:B.inkMid, marginBottom:'0.2rem' }}>
                  {INSTRUCTIONS[wordCount]}
                </div>
                {prompts.map(p => (
<PromptCard key={p.id} prompt={{ ...p, wordCount: p.word_count, id: p.id, dbId: p.id }} onSave={savePrompt} onRemove={removePrompt} isSaved={true} onMarkWritten={markWritten} isWritten={writtenPrompts.includes(p.id)} />                ))}
              </div>
            )}

            {!loading && prompts.length === 0 && (
              <div style={{ textAlign:'center', padding:'3.5rem 0', color:B.inkLight, fontSize:'0.93rem', fontStyle:'italic' }}>
                Choose your challenge and genre, then press generate.
              </div>
            )}
          </div>
        )}

        {tab === 'saved' && (
          <div>
            {loadingSaved ? (
              <div style={{ textAlign:'center', padding:'3.5rem 0', color:B.inkLight, fontSize:'0.93rem', fontStyle:'italic' }}>Loading saved prompts...</div>
            ) : saved.length === 0 ? (
              <div style={{ textAlign:'center', padding:'3.5rem 0', color:B.inkLight, fontSize:'0.93rem', fontStyle:'italic' }}>No saved prompts yet — generate some and save your favorites.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.8rem' }}>
                {saved.map(p => (
                  <PromptCard key={p.id} prompt={{ ...p, wordCount: p.word_count, id: p.id, dbId: p.id }} onSave={savePrompt} onRemove={removePrompt} isSaved={true} onMarkWritten={markWritten} isWritten={writtenPrompts.includes(p.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <BadgeToast badges={newBadges} onDismiss={() => setNewBadges([])} />
    </div>
  );
}
