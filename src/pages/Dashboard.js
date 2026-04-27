import { useAuth } from '../context/AuthContext';
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

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: B.sand,
      backgroundImage: `radial-gradient(ellipse at 5% 5%, rgba(91,158,201,0.13) 0%, transparent 45%), radial-gradient(ellipse at 95% 90%, rgba(212,132,90,0.11) 0%, transparent 45%)`,
      fontFamily: "'DM Sans', sans-serif",
      color: B.ink,
      padding: '0 1.25rem 5rem',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
      `}</style>

      {/* Navbar */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '1.25rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${B.sandDeep}`,
        marginBottom: '2.5rem',
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700, color: B.ink }}>
          Fictifly
        </div>
        <button
          onClick={handleSignOut}
          style={{
            background: 'transparent',
            border: `1px solid ${B.sandDeep}`,
            borderRadius: '8px',
            color: B.inkMid,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.82rem',
            fontWeight: 500,
            padding: '0.4rem 0.9rem',
            cursor: 'pointer',
          }}
        >Sign out</button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.terra, marginBottom: '0.6rem' }}>
            Dashboard
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 700, color: B.ink, lineHeight: 1.1, marginBottom: '0.5rem' }}>
            Welcome back,{' '}
            <span style={{ color: B.seaDeep, fontStyle: 'italic', fontWeight: 500 }}>
              {profile?.username || 'Writer'}
            </span>
          </h1>
          <p style={{ color: B.inkMid, fontSize: '0.95rem' }}>
            {profile?.account_type === 'teacher' ? 'Educator account' : profile?.account_type === 'minor' ? 'Student account' : 'Writer account'}
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}>
          {[
            { label: 'Prompts Generated', value: '0', icon: '✦' },
            { label: 'Stories Submitted', value: '0', icon: '📝' },
            { label: 'Day Streak', value: '0', icon: '🔥' },
            { label: 'Badges Earned', value: '0', icon: '🏅' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: B.white,
              border: `1px solid ${B.sandDeep}`,
              borderRadius: '14px',
              padding: '1.25rem',
              boxShadow: '0 2px 12px rgba(58,50,38,0.05)',
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', fontWeight: 700, color: B.ink }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: B.inkLight, marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 600, color: B.ink, marginBottom: '1rem' }}>
            Start writing
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { title: 'Microfiction', desc: '100, 200, or 300 words', icon: '✍️', color: B.terra },
              { title: 'Flash Fiction', desc: '500 or 1,000 words', icon: '📖', color: B.seaDeep },
            ].map(action => (