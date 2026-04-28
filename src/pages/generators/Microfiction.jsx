import { Link, useLocation } from 'react-router-dom';
import BadgeToast from '../../components/BadgeToast';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';

const GENRES = [
  "Action and/or Adventure","Comedy","Drama","Fairy Tale and/or Fantasy",
  "Ghost Story","Historical Fiction","Horror","Romance","Romantic Comedy",
  "Sci-Fi","Suspense and/or Thriller","Open Genre",
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
  100: <>Three ingredients, one story. The <strong style={{ color:"#3A3226", fontWeight:600 }}>action</strong> is your spark — it must happen somewhere in your narrative, whether your character lives it in the moment, revisits it in a flashback, or stumbles through it in a dream. The <strong style={{ color:"#3A3226", fontWeight:600 }}>word</strong> must show up exactly as spelled, but you can dress it up — <em>courageous</em> keeps <em>courage</em> intact. The <strong style={{ color:"#3A3226", fontWeight:600 }}>genre</strong> is your playground.</>,
  200: <>Three ingredients, one story. The <strong style={{ color:"#3A3226", fontWeight:600 }}>action</strong> is your spark — it must happen somewhere in your narrative, whether your character lives it in the moment, revisits it in a flashback, or stumbles through it in a dream. The <strong style={{ color:"#3A3226", fontWeight:600 }}>word</strong> must show up exactly as spelled, but you can dress it up — <em>courageous</em> keeps <em>courage</em> intact. The <strong style={{ color:"#3A3226", fontWeight:600 }}>genre</strong> is your playground.</>,
  300: <>Three ingredients, one story. The <strong style={{ color:"#3A3226", fontWeight:600 }}>action</strong> is your spark — it must happen somewhere in your narrative, whether your character lives it in the moment, revisits it in a flashback, or stumbles through it in a dream. The <strong style={{ color:"#3A3226", fontWeight:600 }}>word</strong> must show up exactly as spelled, but you can dress it up — <em>courageous</em> keeps <em>courage</em> intact. The <strong style={{ color:"#3A3226", fontWeight:600 }}>genre</strong> is your playground.</>,
};

const PromptCard = ({ prompt, onSave, isSaved, onRemove, onMarkWritten, isWritten }) => {  
  const [copied, setCopied] = useState(false);
  const gc = genreColor(prompt.genre);

  const handleCopy = () => {
    const text = `${prompt.wordCount}-WORD CHALLENGE\nGENRE: ${prompt.genre}\nACTION: ${prompt.action}\nWORD: ${prompt.word}`;
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
        <div style={{ display:'flex', alignItems:'baseline', gap:'0.75rem' }}>
          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:B.inkLight, minWidth:62 }}>Action</span>
          <span style={{ fontFamily:"'Fraunces', serif", fontSize:'1.2rem', fontWeight:500, color:B.ink, fontStyle:'italic' }}>{prompt.action}</span>
        </div>
        <div style={{ height:'1px', background:B.sandMid }} />
        <div style={{ display:'flex', alignItems:'baseline', gap:'0.75rem' }}>
          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:B.inkLight, minWidth:62 }}>Word</span>
          <span style={{ fontFamily:"'Fraunces', serif", fontSize:'1.2rem', fontWeight:500, color:B.seaDeep, fontStyle:'italic' }}>{prompt.word}</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <button onClick={handleCopy} style={{ background:copied ? B.seaMid : 'transparent', border:`1px solid ${copied ? B.seaMid : B.sandDeep}`, color:copied ? B.white : B.inkMid, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}>{copied ? '✓ Copied' : 'Copy'}</button>
        {isSaved ? (
          <button onClick={() => onRemove(prompt.id)} style={{ background:B.terra, border:`1px solid ${B.terra}`, color:B.white, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer' }}>★ Saved</button>
        ) : (
          <button onClick={() => onSave(prompt)} style={{ background:'transparent', border:`1px solid ${B.sandDeep}`, color:B.inkMid, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}>☆ Save</button>
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

export default function Microfiction() {
  const { user, profile } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
const [tab, setTab] = useState(new URLSearchParams(location.search).get('tab') || 'generate');
  const [wordCount, setWordCount] = useState(100);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsage = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('prompt_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .single();
    setUsageCount(data ? data.count : 0);
  };

  const fetchSavedPrompts = async () => {
    setLoadingSaved(true);
    const { data } = await supabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', user.id)
      .eq('prompt_type', 'microfiction')
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
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Generate exactly ${count} microfiction writing prompt(s) for a ${wordCount}-word challenge. For each prompt provide a creative gerund ACTION word and a single evocative WORD.

${wordCount === 100
  ? 'This is a 100-WORD challenge. Prompts must be razor-sharp and singular. Choose action words and words that point to a single contained moment, image, or emotional beat.'
  : wordCount === 200
  ? 'This is a 200-WORD challenge. Prompts should suggest a small but complete arc — a before and after, a shift in a relationship, a decision with weight.'
  : 'This is a 300-WORD challenge. Prompts can carry real narrative complexity — a character with history, a situation with stakes, a world with texture.'}

Be creative and varied. The genres are assigned: ${genres.map((g, i) => `Prompt ${i + 1}: "${g}"`).join(', ')}.

Respond ONLY with a JSON array, no markdown, no explanation:
[{"action":"...","word":"..."},...]`
          }],
        }),
      });
      const data = await response.json();
      const text = data.content.map(b => b.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const result = parsed.map((p, i) => ({
        id: Date.now() + i,
        genre: genres[i],
        action: p.action,
        word: p.word,
        wordCount,
        prompt_type: 'microfiction',
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
      prompt_type: 'microfiction',
      word_count: prompt.wordCount,
      action: prompt.action,
      word: prompt.word,
    }).select().single();
    if (!saveError && data) {
      setSaved(prev => [data, ...prev]);
setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, dbId: data.id } : p));    }
  };

  const removePrompt = async (id) => {
    await supabase.from('saved_prompts').delete().eq('id', id);
    setSaved(prev => prev.filter(p => p.id !== id));
  };
  const markWritten = async (savedPromptId) => {
  const { data, error: subError } = await supabase.from('submissions').insert({
    user_id: user.id,
    prompt_id: savedPromptId,
    prompt_type: 'microfiction',
    genre: prompts.find(p => p.dbId === savedPromptId)?.genre || null,
    word_count: wordCount,
  }).select().single();
  if (!subError && data) {
    setWrittenPrompts(prev => [...prev, savedPromptId]);
  }
};

  const isSaved = (prompt) => saved.some(s => s.action === prompt.action && s.word === prompt.word && s.genre === prompt.genre);

  return (
    <div style={{ minHeight:'100vh', background:B.sand, backgroundImage:`radial-gradient(ellipse at 5% 5%, rgba(91,158,201,0.13) 0%, transparent 45%), radial-gradient(ellipse at 95% 90%, rgba(212,132,90,0.11) 0%, transparent 45%)`, fontFamily:"'DM Sans', sans-serif", color:B.ink, padding:'0 1.25rem 5rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap'); @keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } } * { box-sizing: border-box; margin: 0; }`}</style>

      {/* Navbar */}
      <div style={{ maxWidth:640, margin:'0 auto', padding:'1.25rem 0', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${B.sandDeep}`, marginBottom:'2rem' }}>
        <Link to="/dashboard" style={{ color:B.inkMid, textDecoration:'none', fontSize:'0.85rem' }}>← Dashboard</Link>
        <div style={{ fontFamily:"'Fraunces', serif", fontSize:'1.3rem', fontWeight:700, color:B.ink }}>Fictifly</div>
      </div>

      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <svg width="52" height="24" viewBox="0 0 52 24" fill="none" style={{ marginBottom:'1.2rem' }}>
            <path d="M4 16 C10 7, 18 7, 26 16 C34 25, 42 25, 48 16" stroke={B.seaMid} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:B.terra, marginBottom:'0.8rem' }}>Microfiction Challenge</div>
          <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(2.2rem, 6.5vw, 3.6rem)', fontWeight:700, color:B.ink, lineHeight:1.08, letterSpacing:'-0.02em', marginBottom:'1rem' }}>
            Your story<br /><span style={{ color:B.seaDeep, fontStyle:'italic', fontWeight:500 }}>starts here.</span>
          </h1>
          <p style={{ color:B.inkMid, fontSize:'0.97rem', lineHeight:1.65, maxWidth:420, margin:'0 auto 1.5rem' }}>
            AI-crafted prompts tailored to your word count. Pick your challenge, choose a genre, and write.
          </p>
          {!isUnlimited && (
            <div style={{ display:'inline-block', background:B.sandMid, borderRadius:'8px', padding:'0.4rem 0.9rem', fontSize:'0.78rem', color:B.inkMid }}>
              {usageCount}/{FREE_LIMIT} prompts used today
            </div>
          )}
        </div>

        {/* Tabs */}
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
                  {[100,200,300].map(n => <ToggleBtn key={n} active={wordCount===n} onClick={() => setWordCount(n)} wide>{n} words</ToggleBtn>)}
                </div>
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
                 <div style={{ fontSize: '0.78rem', color: usageCount >= FREE_LIMIT ? '#B56840' : '#9A8878', background: usageCount >= FREE_LIMIT ? '#FDF0E8' : B.sandMid, borderRadius: '8px', padding: '0.4rem 0.9rem', marginBottom: '0.5rem' }}>
                    {usageCount >= FREE_LIMIT
                    ? 'You have used all your prompts for today. Come back tomorrow!'
                    : `${FREE_LIMIT - usageCount} of ${FREE_LIMIT} prompts remaining today.`}
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
                  <PromptCard key={p.id} prompt={p} onSave={sa<PromptCard key={p.id} prompt={p} onSave={savePrompt} onRemove={removePrompt} isSaved={isSaved(p)} onMarkWritten={markWritten} isWritten={writtenPrompts.includes(p.dbId)} />vePrompt} onRemove={removePrompt} isSaved={isSaved(p)} />
                ))}
              </div>
            )}

            {!loading && prompts.length === 0 && (
              <div style={{ textAlign:'center', padding:'3.5rem 0', color:B.inkLight, fontSize:'0.93rem', fontStyle:'italic' }}>
                Configure your challenge above and press generate.
              </div>
            )}
          </div>
        )}

      <div style={{ display:'flex', gap:'0.5rem' }}>
        <button onClick={handleCopy} style={{ background:copied ? B.seaMid : 'transparent', border:`1px solid ${copied ? B.seaMid : B.sandDeep}`, color:copied ? B.white : B.inkMid, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}>{copied ? '✓ Copied' : 'Copy'}</button>
        {isSaved ? (
          <button onClick={() => onRemove(prompt.id)} style={{ background:B.terra, border:`1px solid ${B.terra}`, color:B.white, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer' }}>★ Saved</button>
        ) : (
          <button onClick={() => onSave(prompt)} style={{ background:'transparent', border:`1px solid ${B.sandDeep}`, color:B.inkMid, borderRadius:'8px', padding:'0.35rem 0.9rem', fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif", fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}>☆ Save</button>
        )}
      </div>
        )}
</div>
      <BadgeToast badges={newBadges} onDismiss={() => setNewBadges([])} />
    </div>
  );
}
