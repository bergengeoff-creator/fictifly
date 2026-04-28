import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const PromptCard = ({ prompt, onSave, isSaved, onRemove }) => {
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
