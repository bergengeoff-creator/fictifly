import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [totalPromptsGenerated, setTotalPromptsGenerated] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: saved } = await supabase
        .from('saved_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setSavedPrompts(saved || []);

      const { data: usage } = await supabase
        .from('prompt_usage')
        .select('count')
        .eq('user_id', user.id);
      const total = usage ? usage.reduce((sum, row) => sum + row.count, 0) : 0;
      setTotalPromptsGenerated(total);

      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();
      setCurrentStreak(streakData ? streakData.current_streak : 0);
      // Fetch badges
const { data: badgeData } = await supabase
  .from('user_badges')
  .select('*, badges(*)')
  .eq('user_id', user.id)
  .not('badges', 'is', null);
setEarnedBadges((badgeData || []).filter(ub => ub.badges));
setBadgeCount(badgeData ? badgeData.length : 0);
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isNewUser = profile && !profile.bio && !profile.avatar_url && !profile.avatar_preset;

  const stats = [
    { label: 'Prompts Generated', value: totalPromptsGenerated },
    { label: 'Stories Submitted', value: '0' },
    { label: 'Day Streak', value: currentStreak },
    { label: 'Badges Earned', value: badgeCount },
  ];

  const generators = [
    { title: 'Microfiction', desc: '100, 200, or 300 words', color: '#D4845A', path: '/generators/microfiction' },
    { title: 'Flash Fiction', desc: '500 or 1,000 words', color: '#2E6DA4', path: '/generators/flash-fiction' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Fictifly</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {profile && profile.account_type === 'teacher' && (
            <Link to="/classroom" style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer', textDecoration: 'none' }}>My Classes</Link>
          )}
          <Link to="/profile" style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer', textDecoration: 'none' }}>My Profile</Link>
          <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.6rem' }}>Dashboard</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {isNewUser ? 'Welcome, ' : 'Welcome back, '}
          <span style={{ color: '#2E6DA4', fontStyle: 'italic', fontWeight: 500 }}>
            {profile ? (profile.display_name || profile.username) : 'Writer'}
          </span>
        </h1>
        <p style={{ color: '#6B5D4E', fontSize: '0.95rem', marginBottom: '2rem' }}>
          {profile && profile.account_type === 'teacher' ? 'Educator account' : profile && profile.account_type === 'minor' ? 'Student account' : 'Writer account'}
        </p>

        {isNewUser && (
          <div style={{ background: '#EAF4FB', border: '1px solid #5B9EC9', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#2E6DA4', marginBottom: '0.2rem' }}>Complete your profile</div>
              <div style={{ fontSize: '0.85rem', color: '#6B5D4E' }}>Add a bio, avatar, and favourite genres to personalise your experience.</div>
            </div>
            <Link to="/profile" style={{ background: '#2E6DA4', color: '#FFFCF8', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Complete profile</Link>
          </div>
        )}

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
            <Link key={g.title} to={g.path} style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderLeft: '4px solid ' + g.color, borderRadius: '12px', padding: '1.25rem 1.5rem', cursor: 'pointer', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', textDecoration: 'none', display: 'block' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(58,50,38,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(58,50,38,0.05)'; }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3A3226', marginBottom: '0.25rem' }}>{g.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#9A8878' }}>{g.desc}</div>
            </Link>
          ))}
        </div>

        <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Saved Prompts</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/generators/microfiction" style={{ fontSize: '0.78rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Microfiction</Link>
              <span style={{ color: '#9A8878', fontSize: '0.78rem' }}>·</span>
              <Link to="/generators/flash-fiction" style={{ fontSize: '0.78rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Flash Fiction</Link>
            </div>
          </div>
          {savedPrompts.length === 0 ? (
            <p style={{ color: '#9A8878', fontSize: '0.9rem', fontStyle: 'italic' }}>Your saved prompts will appear here once you start generating.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {savedPrompts.slice(0, 3).map(p => (
                <div key={p.id} style={{ background: '#F5EFE6', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9A8878', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{p.prompt_type === 'microfiction' ? 'Microfiction' : 'Flash Fiction'} · {p.word_count} words</div>
                    <div style={{ fontSize: '0.88rem', color: '#3A3226', fontWeight: 500 }}>{p.genre}</div>
                    <div style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>{p.action || p.location} · {p.word || p.object}</div>
                  </div>
                  <Link to={p.prompt_type === 'microfiction' ? '/generators/microfiction?tab=saved' : '/generators/flash-fiction?tab=saved'} style={{ fontSize: '0.75rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>View →</Link>
                </div>
              ))}
              {savedPrompts.length > 3 && (
                <p style={{ fontSize: '0.82rem', color: '#9A8878', textAlign: 'center' }}>And {savedPrompts.length - 3} more — view all in the generators above.</p>
              )}
            </div>
          )}
        </div>
{earnedBadges.length > 0 && (
          <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>Badges</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {earnedBadges.filter(ub => ub.badges).map((ub) => (
                <div key={ub.id} title={ub.badges?.description} style={{ background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#3A3226' }}>
                  <span style={{ fontSize: '1.3rem' }}>{ub.badges.icon}</span>
                  {ub.badges.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}