import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

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

const FictiflyLogo = () => (
  <svg viewBox="0 0 250 45" xmlns="http://www.w3.org/2000/svg" style={{ width: '200px', height: '35px', display: 'block' }}>
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

const SORT_OPTIONS = [
  { value: 'written', label: 'Most Active' },
  { value: 'streak', label: 'Longest Streak' },
  { value: 'joined', label: 'Newest Members' },
];

const WriterCard = ({ writer }) => {
  const avatarSize = 52;
  const avatar = writer.avatar_url ? (
    <img src={writer.avatar_url} alt="avatar" style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', background: '#EDE3D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8878', fontWeight: 700, fontSize: avatarSize * 0.38, flexShrink: 0 }}>
      {writer.username ? writer.username[0].toUpperCase() : 'W'}
    </div>
  );

  return (
    <Link
      to={`/writers/${writer.username}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(58,50,38,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(58,50,38,0.05)'; }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.85rem' }}>
          {avatar}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#3A3226', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {writer.display_name || writer.username}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#9A8878' }}>@{writer.username}</div>
            <div style={{ fontSize: '0.72rem', color: '#B8A898', marginTop: '0.1rem' }}>
              {writer.account_type === 'teacher' ? '📚 Educator' : '✍️ Writer'}
              {writer.region ? ` · ${writer.region}` : ''}
            </div>
          </div>
        </div>

        {/* Bio */}
        {writer.bio ? (
          <p style={{ fontSize: '0.83rem', color: '#6B5D4E', lineHeight: 1.6, marginBottom: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {writer.bio}
          </p>
        ) : (
          <p style={{ fontSize: '0.83rem', color: '#B8A898', fontStyle: 'italic', marginBottom: '0.85rem' }}>No bio yet.</p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: writer.favourite_genres?.length > 0 || writer.badges?.length > 0 ? '0.85rem' : 0 }}>
          {[
            { label: 'Stories', value: writer.stories_written ?? 0 },
            { label: 'Streak', value: `${writer.streak ?? 0}d` },
            { label: 'Joined', value: new Date(writer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3A3226' }}>{stat.value}</div>
              <div style={{ fontSize: '0.65rem', color: '#9A8878', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Genres */}
        {writer.favourite_genres?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: writer.badges?.length > 0 ? '0.75rem' : 0 }}>
            {writer.favourite_genres.slice(0, 4).map(g => (
              <span key={g} style={{ padding: '0.15rem 0.55rem', borderRadius: '20px', background: '#EDE3D4', color: '#6B5D4E', fontSize: '0.7rem' }}>{g}</span>
            ))}
            {writer.favourite_genres.length > 4 && (
              <span style={{ padding: '0.15rem 0.55rem', borderRadius: '20px', background: '#F5EFE6', color: '#9A8878', fontSize: '0.7rem' }}>+{writer.favourite_genres.length - 4} more</span>
            )}
          </div>
        )}

        {/* Badges — show up to 3 */}
        {writer.badges?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {writer.badges.slice(0, 3).map(b => (
              <span key={b.id} title={b.description} style={{ background: '#F5EFE6', border: `1px solid ${BADGE_COLORS[b.name] || '#D9C9B0'}`, borderRadius: '8px', padding: '0.15rem 0.55rem', fontSize: '0.7rem', color: '#3A3226', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>{b.icon}</span>{b.name}
              </span>
            ))}
            {writer.badges.length > 3 && (
              <span style={{ background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', padding: '0.15rem 0.55rem', fontSize: '0.7rem', color: '#9A8878' }}>
                +{writer.badges.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

// Paywall prompt shown to free standard accounts
const PaywallPrompt = () => (
  <div style={{ maxWidth: '520px', margin: '5rem auto', textAlign: 'center', padding: '0 1.25rem' }}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3A3226', marginBottom: '0.5rem' }}>Writer Directory</h1>
    <p style={{ fontSize: '0.95rem', color: '#6B5D4E', lineHeight: 1.7, marginBottom: '2rem' }}>
      Discover other writers on Fictifly — browse profiles, read bios, and find writers who share your favourite genres. Available to premium members.
    </p>
    <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.75rem' }}>Premium includes</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
        {['Access to the Writer Directory', 'Appear in the Writer Directory', 'Community upvotes on your stories', 'Early access to new generators'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#3A3226' }}>
            <span style={{ color: '#6BAF72', fontWeight: 700 }}>✓</span> {f}
          </div>
        ))}
      </div>
    </div>
    <Link
      to="/dashboard"
      style={{ display: 'inline-block', background: '#D4845A', color: '#FFFCF8', borderRadius: '10px', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', marginBottom: '0.75rem' }}
    >
      Upgrade to Premium
    </Link>
    <div>
      <Link to="/dashboard" style={{ fontSize: '0.82rem', color: '#9A8878', textDecoration: 'none' }}>← Back to dashboard</Link>
    </div>
  </div>
);

export default function WriterDirectory() {
  const { profile } = useAuth();
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('written');
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [allGenres, setAllGenres] = useState([]);

  // Gate: only premium or teacher can access
  const canAccess = profile && (
    profile.is_premium ||
    profile.account_type === 'teacher'
  );

  useEffect(() => {
    if (!canAccess) return;
    fetchWriters();
  }, [canAccess, sort]);

  const fetchWriters = async () => {
    setLoading(true);

    // Fetch eligible writers:
    // - profile_public = true
    // - profile_complete = true
    // - is_premium = true OR account_type = 'teacher' with show_in_directory = true
    // - NOT minor or student
    const { data: writersData, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio, favourite_genres, account_type, region, created_at, show_in_directory')
      .eq('profile_public', true)
      .eq('profile_complete', true)
      .not('account_type', 'in', '("minor","student")')
      .or('is_premium.eq.true,and(account_type.eq.teacher,show_in_directory.eq.true)');

    if (error || !writersData) { setLoading(false); return; }

    // Fetch stats for all writers in parallel
    const writerIds = writersData.map(w => w.id);

    const [submissionsRes, streaksRes, badgesRes, userBadgesRes] = await Promise.all([
      supabase.from('submissions').select('user_id').in('user_id', writerIds),
      supabase.from('streaks').select('user_id, current_streak').in('user_id', writerIds),
      supabase.from('badges').select('*'),
      supabase.from('user_badges').select('user_id, badge_id').in('user_id', writerIds),
    ]);

    // Count stories per writer
    const storyCounts = {};
    (submissionsRes.data || []).forEach(s => {
      storyCounts[s.user_id] = (storyCounts[s.user_id] || 0) + 1;
    });

    // Map streaks
    const streakMap = {};
    (streaksRes.data || []).forEach(s => { streakMap[s.user_id] = s.current_streak; });

    // Map badges
    const badgeDetails = badgesRes.data || [];
    const userBadgeMap = {};
    (userBadgesRes.data || []).forEach(ub => {
      if (!userBadgeMap[ub.user_id]) userBadgeMap[ub.user_id] = [];
      const badge = badgeDetails.find(b => b.id === ub.badge_id);
      if (badge) userBadgeMap[ub.user_id].push(badge);
    });

    // Assemble enriched writers
    const enriched = writersData.map(w => ({
      ...w,
      stories_written: storyCounts[w.id] || 0,
      streak: streakMap[w.id] || 0,
      badges: userBadgeMap[w.id] || [],
    }));

    // Sort
    const sorted = [...enriched].sort((a, b) => {
      if (sort === 'written') return b.stories_written - a.stories_written;
      if (sort === 'streak') return b.streak - a.streak;
      if (sort === 'joined') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

    // Collect all unique genres for filter
    const genres = new Set();
    sorted.forEach(w => (w.favourite_genres || []).forEach(g => genres.add(g)));
    setAllGenres([...genres].sort());

    setWriters(sorted);
    setLoading(false);
  };

  // Client-side filter by search + genre
  const filtered = writers.filter(w => {
    const matchesSearch = !search ||
      (w.display_name || w.username).toLowerCase().includes(search.toLowerCase()) ||
      w.username.toLowerCase().includes(search.toLowerCase()) ||
      (w.bio || '').toLowerCase().includes(search.toLowerCase());
    const matchesGenre = !genreFilter ||
      (w.favourite_genres || []).includes(genreFilter);
    return matchesSearch && matchesGenre;
  });

  if (!canAccess) return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', paddingBottom: '1.25rem' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}><FictiflyLogo /></Link>
      </div>
      <PaywallPrompt />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
          <FictiflyLogo />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {profile?.account_type === 'teacher' && (
            <Link to="/classroom" style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', textDecoration: 'none' }}>My Classes</Link>
          )}
          <Link to="/dashboard" style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', textDecoration: 'none' }}>Dashboard</Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.6rem' }}>Community</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>Writer Directory</h1>
        <p style={{ color: '#6B5D4E', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Discover writers, explore profiles, find your people.
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search writers..."
            style={{ flex: 1, minWidth: '160px', background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#3A3226', fontFamily: 'sans-serif', fontSize: '0.88rem', padding: '0.55rem 0.9rem', outline: 'none' }}
          />

          {/* Genre filter */}
          <select
            value={genreFilter}
            onChange={e => setGenreFilter(e.target.value)}
            style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '8px', color: genreFilter ? '#3A3226' : '#9A8878', fontFamily: 'sans-serif', fontSize: '0.88rem', padding: '0.55rem 0.9rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">All genres</option>
            {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          {/* Sort */}
          <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '3px', gap: '3px' }}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: sort === opt.value ? '#FFFCF8' : 'transparent', color: sort === opt.value ? '#3A3226' : '#9A8878', fontWeight: sort === opt.value ? 600 : 400, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ fontSize: '0.78rem', color: '#9A8878', marginBottom: '1rem' }}>
            {filtered.length === 0 ? 'No writers found' : `${filtered.length} writer${filtered.length !== 1 ? 's' : ''}`}
            {genreFilter ? ` writing ${genreFilter}` : ''}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9A8878', fontStyle: 'italic', padding: '3rem 0' }}>
            Loading writers...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9A8878', padding: '3rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
            <div style={{ fontStyle: 'italic' }}>No writers match your search.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {filtered.map(writer => (
              <WriterCard key={writer.id} writer={writer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}