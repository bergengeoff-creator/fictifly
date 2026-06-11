import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import FictiflyLogo from '../components/FictiflyLogo';

const HOW_TO_EARN = {
  'first-spark': 'Use any Fictifly generator or tool for the first time.',
  'first-draft': 'Write and mark your first story.',
  'on-a-roll': 'Maintain a 7-day writing streak.',
  'unbroken': 'Maintain a 30-day writing streak.',
  'genre-explorer': 'Write stories across 5 unique genres.',
  'genre-chameleon': 'Write stories across 10 unique genres.',
  'character-study': 'Save your first generated character.',
  'cast-of-characters': 'Save 25 characters to your collection.',
  'storyteller': 'Write 10 stories.',
  'prolific-storyteller': 'Save or submit 50 stories.',
  'prolific-writer': 'Save or submit 100 stories.',
  'microfiction-master': 'Write 50 microfiction pieces (100–300 words).',
  'flash-fiction-fan': 'Write 35 flash fiction pieces (500–1,000 words).',
  'story-collector': 'Submit 25 stories. Premium accounts only.',
  'rising-voice': 'Earn upvotes on your first submission.',
  'teachers-pick': 'Have your teacher select your story as exemplary.',
  'top-of-class': 'Earn the most upvotes in your class.',
  'most-improved': 'Be recognised by your teacher as most improved writer this term.',
  'first-send': 'Submit your first story to your class.',
  'kind-reader': 'Submit thoughtful feedback to 3 classmates.',
};

const EDUCATION_SLUGS = [
  'rising-voice', 'teachers-pick', 'top-of-class',
  'most-improved', 'first-send', 'kind-reader',
];

export default function BadgePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [badge, setBadge] = useState(null);
  const [earnedAt, setEarnedAt] = useState(null);
  const [totalEarned, setTotalEarned] = useState(null);
  const [recentEarners, setRecentEarners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch badge by slug
      const { data: badgeData } = await supabase
        .from('badges')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!badgeData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBadge(badgeData);

      // Check if logged-in user has earned it
      if (user) {
        const { data: userBadge } = await supabase
          .from('user_badges')
          .select('earned_at')
          .eq('user_id', user.id)
          .eq('badge_id', badgeData.id)
          .maybeSingle();
        if (userBadge) setEarnedAt(userBadge.earned_at);

        // Total count — logged in only
        const { count } = await supabase
          .from('user_badges')
          .select('id', { count: 'exact', head: true })
          .eq('badge_id', badgeData.id);
        setTotalEarned(count || 0);
      }

      // Recent public earners (logged in or out)
      const { data: earnerData } = await supabase
        .from('user_badges')
        .select('earned_at, users!user_badges_user_id_fkey(id, username, display_name, avatar_url, profile_public)')
        .eq('badge_id', badgeData.id)
        .order('earned_at', { ascending: false })
        .limit(20);

      const publicEarners = (earnerData || [])
        .filter(e => e.users?.profile_public)
        .slice(0, 5);
      setRecentEarners(publicEarners);

      setLoading(false);
    };

    fetchData();
  }, [slug, user]);

  const handleShare = async () => {
    const url = `${window.location.origin}/badge/${slug}`;
    const shareData = {
      title: `I earned the ${badge?.name} badge on Fictifly`,
      text: `I just earned the ${badge?.name} badge on Fictifly — a creative writing platform. ${HOW_TO_EARN[slug] || ''}`,
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // User cancelled share — do nothing
      }
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        // Clipboard failed — show URL
        prompt('Copy this link:', url);
      }
    }
  };

  const getAvatarDisplay = (profile, size = 36) => {
    if (profile.avatar_url) return (
      <img src={profile.avatar_url} alt={profile.username} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    );
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#EDE3D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8878', fontWeight: 700, fontSize: size * 0.38 }}>
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
        <h1 style={{ color: '#3A3226', marginBottom: '0.5rem' }}>Badge not found</h1>
        <p style={{ color: '#9A8878', marginBottom: '1.5rem' }}>That badge doesn't exist.</p>
        <Link to="/badges" style={{ color: '#2E6DA4', textDecoration: 'none', fontWeight: 600 }}>View all badges →</Link>
      </div>
    </div>
  );

  const isDeepBlue = badge.background === 'deep-blue';
  const bgColor = isDeepBlue ? '#13233A' : '#F5EFE6';
  const svgSrc = badge.svg_filename ? `/badges/${badge.svg_filename}` : null;
  const isEducation = EDUCATION_SLUGS.includes(slug);
  const tierLabel = badge.premium_only ? 'Premium' : badge.student_only ? 'Education' : 'Free';
  const tierColor = badge.premium_only ? '#E7C74A' : badge.student_only ? '#5B9EC9' : '#9A8878';

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>

      {/* Header */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/badges" style={{ color: '#6B5D4E', textDecoration: 'none', fontSize: '0.85rem' }}>← All badges</Link>
        <Link to={user ? '/dashboard' : '/login'} style={{ textDecoration: 'none' }}>
          <FictiflyLogo />
        </Link>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Badge display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          {/* Badge image */}
          <div style={{
            width: '200px',
            height: '200px',
            borderRadius: '24px',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: isDeepBlue
              ? '0 8px 40px rgba(14,22,41,0.4)'
              : '0 8px 32px rgba(58,50,38,0.12)',
            border: `1px solid ${isDeepBlue ? 'rgba(91,158,202,0.2)' : '#D9C9B0'}`,
            overflow: 'hidden',
          }}>
            {svgSrc && (
              <img
                src={svgSrc}
                alt={badge.name}
                style={{ width: '175px', height: '175px', objectFit: 'contain' }}
              />
            )}
          </div>

          {/* Tier + education tag */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: tierColor,
              background: `${tierColor}18`,
              border: `1px solid ${tierColor}30`,
            }}>
              {tierLabel}
            </span>
            {isEducation && (
              <span style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#5B9EC9',
                background: 'rgba(91,158,202,0.1)',
                border: '1px solid rgba(91,158,202,0.25)',
              }}>
                Classroom
              </span>
            )}
          </div>

          {/* Badge name */}
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '2rem',
            fontWeight: 400,
            color: '#3A3226',
            textAlign: 'center',
            marginBottom: '0.5rem',
            lineHeight: 1.2,
          }}>
            {badge.name}
          </h1>

          {/* Earned status */}
          {user && earnedAt && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(75,123,111,0.1)',
              border: '1px solid rgba(75,123,111,0.25)',
              borderRadius: '20px',
              padding: '0.3rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#4A7B6F',
              marginBottom: '0.75rem',
            }}>
              ✓ Earned {new Date(earnedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}

          {/* Total earned count — logged in only */}
          {user && totalEarned !== null && (
            <div style={{ fontSize: '0.82rem', color: '#9A8878', marginBottom: '0.5rem' }}>
              {totalEarned === 1 ? '1 writer has' : `${totalEarned.toLocaleString()} writers have`} earned this badge
            </div>
          )}
        </div>

        {/* How to earn */}
        <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.6rem' }}>
            How to earn
          </div>
          <div style={{ fontSize: '0.95rem', color: '#3A3226', lineHeight: 1.65 }}>
            {HOW_TO_EARN[slug] || badge.description}
          </div>
        </div>

        {/* Share button */}
        {user && earnedAt && (
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              background: '#3A3226',
              color: '#FFFCF8',
              border: 'none',
              borderRadius: '10px',
              padding: '0.85rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1.25rem',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#6B5D4E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3A3226'; }}
          >
            {copied ? '✓ Link copied!' : '↗ Share this badge'}
          </button>
        )}

        {/* Recent earners */}
        {recentEarners.length > 0 && (
          <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '1rem' }}>
              Recently earned by
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentEarners.map((earner, i) => (
                <Link
                  key={i}
                  to={`/writers/${earner.users.username}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  {getAvatarDisplay(earner.users)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#3A3226' }}>
                      {earner.users.display_name || earner.users.username}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9A8878' }}>
                      @{earner.users.username}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9A8878', whiteSpace: 'nowrap' }}>
                    {new Date(earner.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Logged-out CTA */}
        {!user && (
          <div style={{ background: '#FFFCF8', border: '1px solid #5B9EC9', borderLeft: '4px solid #5B9EC9', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 400, color: '#3A3226', marginBottom: '0.4rem' }}>
              Start earning this badge
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6B5D4E', marginBottom: '1rem', lineHeight: 1.55 }}>
              Join Fictifly free — no credit card required.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/age-gate')}
                style={{ background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Join free →
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'transparent', color: '#6B5D4E', border: '1px solid #D9C9B0', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Log in
              </button>
            </div>
          </div>
        )}

        {/* View all badges link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/badges" style={{ color: '#2E6DA4', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
            View all badges →
          </Link>
        </div>

      </div>
    </div>
  );
}