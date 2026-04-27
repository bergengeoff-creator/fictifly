import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const stats = [
    { label: 'Prompts Generated', value: '0' },
    { label: 'Stories Submitted', value: '0' },
    { label: 'Day Streak', value: '0' },
    { label: 'Badges Earned', value: '0' },
  ];

  const generators = [
    { title: 'Microfiction', desc: '100, 200, or 300 words', color: '#D4845A' },
    { title: 'Flash Fiction', desc: '500 or 1,000 words', color: '#2E6DA4' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Fictifly</div>
        <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.6rem' }}>Dashboard</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Welcome back, <span style={{ color: '#2E6DA4', fontStyle: 'italic', fontWeight: 500 }}>{profile ? profile.username : 'Writer'}</span>
        </h1>
        <p style={{ color: '#6B5D4E', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
          {profile && profile.account_type === 'teacher' ? 'Educator account' : profile && profile.account_type === 'minor' ? 'Student account' : 'Writer account'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3A3226' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#9A8878', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>Start writing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {generators.map((g) => (
            <div key={g.title} style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderLeft: '4px solid ' + g.color, borderRadius: '12px', padding: '1.25rem 1.5rem', cursor: 'pointer', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3A3226', marginBottom: '0.25rem' }}>{g.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#9A8878' }}>{g.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>Saved Prompts</h2>
          <p style={{ color: '#9A8878', fontSize: '0.9rem', fontStyle: 'italic' }}>Your saved prompts will appear here once you start generating.</p>
        </div>
      </div>
    </div>
  );
}
