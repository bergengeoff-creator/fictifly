import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const BADGE_COLORS = {
  'First Spark': '#D4845A',
  'Story Hoarder': '#2E6DA4',
  'Dedicated Writer': '#E86A3A',
  'Week Warrior': '#C8A060',
  'Genre Explorer': '#6BAF72',
  'Microfiction Master': '#B07AC0',
  'Flash Fiction Fan': '#5B9EC9',
  'Prolific Writer': '#F2C94C',
  'First Draft': '#6BAF72',
  'Storyteller': '#2E6DA4',
  'Prolific Storyteller': '#B07AC0',
};

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ prompts: 0, written: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!profileData.profile_public) {
        setIsPrivate(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch badges
      const { data: userBadgeData } = await supabase
        .from('user_badges')
        .select('id, badge_id, earned_at')
        .eq('user_id', profileData.id);

      if (userBadgeData && userBadgeData.length > 0) {
        const badgeIds = userBadgeData.map(ub => ub.badge_id);
        const { data: badgeDetails } = await supabase
          .from('badges')
          .select('*')
          .in('id', badgeIds);
        const merged = userBadgeData.map(ub => ({
          ...ub,
          badges: badgeDetails ? badgeDetails.find(b => b.id === ub.badge_id) : null
        })).filter(ub => ub.badges);
        setBadges(merged);
      }

      // Fetch stats
      const { data: usageData } = await supabase
        .from('prompt_usage')
        .select('count')
        .eq('user_id', profileData.id);
      const totalPrompts = usageData ? usageData.reduce((sum, row) => sum + row.count, 0) : 0;

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', profileData.id);
      const totalWritten = submissionsData ? submissionsData.length : 0;

      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', profileData.id)
        .maybeSingle();
      const streak = streakData ? streakData.current_streak : 0;

      setStats({ prompts: totalPrompts, written: totalWritten, streak });

      // Fetch public stories
      const { data: storiesData } = await supabase
        .from('submissions')
        .select('*, saved_prompts(genre, word_count, action, word, location, object, prompt_type)')
        .eq('user_id', profileData.id)
        .eq('sharing', 'public')
        .order('created_at', { ascending: false });
      setStories(storiesData || []);

      setLoading(false);
    };
  };
    

    fetchProfile();
  }, [username]);

  const getAvatarDisplay = (size = 80) => {
    if (!profile) return null;
    if (profile.avatar_url) return (
      <img src={profile.avatar_url} alt="avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    );
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#EDE3D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8878', fontWeight: 700, fontSize: size * 0.4 }}>
        {profile.username ? profile.username[0].toUpperCase() : 'W'}
      </div>
    );
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9A8878', fontStyle: 'italic' }}>
      Loading...
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ color: '#3A3226', marginBottom: '0.5rem' }}>Writer not found</h1>
        <p style={{ color: '#9A8878', marginBottom: '1.5rem' }}>No writer with that username exists.</p>
        <Link to="/login" style={{ color: '#2E6DA4', textDecoration: 'none', fontWeight: 600 }}>Go to Fictifly →</Link>
      </div>
    </div>
  );

  if (isPrivate) return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h1 style={{ color: '#3A3226', marginBottom: '0.5rem' }}>Private profile</h1>
        <p style={{ color: '#9A8878', marginBottom: '1.5rem' }}>This writer has set their profile to private.</p>
        <Link to="/login" style={{ color: '#2E6DA4', textDecoration: 'none', fontWeight: 600 }}>Go to Fictifly →</Link>
      </div>
    </div>
  );

  const sectionStyle = { background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <Link to="/login" style={{ color: '#6B5D4E', textDecoration: 'none', fontSize: '0.85rem' }}>← Fictifly</Link>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Fictifly</div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {getAvatarDisplay(90)}
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>{profile.display_name || profile.username}</h1>
            <div style={{ fontSize: '0.85rem', color: '#9A8878', marginBottom: '0.25rem' }}>@{profile.username}</div>
            <div style={{ fontSize: '0.78rem', color: '#9A8878' }}>
              {profile.account_type === 'teacher' ? 'Educator' : profile.account_type === 'minor' ? 'Writer (13-17)' : 'Writer'}
              {profile.region ? ` · ${profile.region}` : ''}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Prompts Generated', value: stats.prompts },
            { label: 'Stories Written', value: stats.written },
            { label: 'Day Streak', value: stats.streak },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '12px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(58,50,38,0.05)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3A3226' }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#9A8878', marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>About</div>
          {profile.bio ? (
            <p style={{ color: '#3A3226', lineHeight: 1.65, fontSize: '0.95rem' }}>{profile.bio}</p>
          ) : (
            <p style={{ color: '#9A8878', fontStyle: 'italic', fontSize: '0.9rem' }}>No bio yet.</p>
          )}
        </div>

        {/* Favourite genres */}
        {profile.favourite_genres && profile.favourite_genres.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>Favourite genres</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {profile.favourite_genres.map(g => (
                <span key={g} style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#EDE3D4', color: '#6B5D4E', fontSize: '0.78rem' }}>{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* Educator info */}
        {profile.account_type === 'teacher' && (profile.school_name || profile.subject) && (
          <div style={sectionStyle}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>Educator</div>
            {profile.school_name && <div style={{ fontSize: '0.9rem', color: '#3A3226', marginBottom: '0.25rem' }}>{profile.school_name}</div>}
            {profile.subject && <div style={{ fontSize: '0.85rem', color: '#6B5D4E' }}>{profile.subject}</div>}
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>Badges</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {badges.map(ub => (
                <div key={ub.id} title={ub.badges?.description} style={{ background: '#F5EFE6', border: `1px solid ${BADGE_COLORS[ub.badges?.name] || '#D9C9B0'}`, borderRadius: '10px', padding: '0.6rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500, color: '#3A3226' }}>
                  <span style={{ fontSize: '1.1rem' }}>{ub.badges?.icon}</span>
                  {ub.badges?.name}
                </div>
              ))}
            </div>
          </div>
        )}
{stories.length > 0 && (
  <div style={sectionStyle}>
    <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '1rem' }}>Stories</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {stories.map(s => (
        <div key={s.id} style={{ borderBottom: '1px solid #EDE3D4', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {s.title && <div style={{ fontWeight: 700, fontSize: '1rem', color: '#3A3226' }}>{s.title}</div>}
            <span style={{ background: '#EDE3D4', color: '#6B5D4E', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {s.saved_prompts?.prompt_type === 'microfiction' ? 'Microfiction' : 'Flash Fiction'} · {s.saved_prompts?.word_count} words
            </span>
            {s.saved_prompts?.genre && (
              <span style={{ background: '#EAF4FB', color: '#2E6DA4', fontSize: '0.65rem', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '20px' }}>{s.saved_prompts.genre}</span>
            )}
          </div>
          <p style={{ fontSize: '0.92rem', color: '#3A3226', lineHeight: 1.75, fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>{s.content}</p>
          <div style={{ fontSize: '0.72rem', color: '#9A8878', marginTop: '0.5rem' }}>
            {new Date(s.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: '#9A8878' }}>
          <Link to="/age-gate" style={{ color: '#2E6DA4', textDecoration: 'none', fontWeight: 600 }}>Join Fictifly</Link> to start writing!
        </div>
      </div>
    </div>
  );
}
