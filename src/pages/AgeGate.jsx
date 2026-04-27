import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function AgeGate() {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) {
      setError('Please select an option to continue.');
      return;
    }
    if (selected === 'under13') {
      setError('Sorry, this platform is not available for users under 13.');
      return;
    }
    if (selected === '13to17') {
      navigate('/signup', { state: { isMinor: true } });
    } else {
      navigate('/signup', { state: { isMinor: false } });
    }
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
      padding: '1.25rem',
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
        textAlign: 'center',
      }}>
        <svg width="52" height="24" viewBox="0 0 52 24" fill="none" style={{ marginBottom: '1.2rem' }}>
          <path d="M4 16 C10 7, 18 7, 26 16 C34 25, 42 25, 48 16" stroke={B.seaMid} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>

        <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.terra, marginBottom: '0.8rem' }}>
          Welcome
        </div>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 700, color: B.ink, marginBottom: '0.75rem', lineHeight: 1.1 }}>
          Before we begin
        </h1>

        <p style={{ color: B.inkMid, fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '2rem' }}>
          Please select your age group so we can set up your account correctly.
        </p>

        <div style={{