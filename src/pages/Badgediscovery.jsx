import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import FictiflyLogo from '../components/FictiflyLogo';

const EDUCATION_SLUGS = [
  'rising-voice',
  'teachers-pick',
  'top-of-class',
  'most-improved',
  'first-send',
  'kind-reader',
];

const TIER_LABELS = {
  premium_only: { label: 'Premium', color: '#E7C74A', bg: 'rgba(231,199,74,0.12)', border: 'rgba(231,199,74,0.25)' },
  student_only: { label: 'Education', color: '#5B9EC9', bg: 'rgba(91,158,202,0.12)', border: 'rgba(91,158,202,0.25)' },
  free: { label: 'Free', color: '#9A8878', bg: 'rgba(217,201,176,0.12)', border: 'rgba(217,201,176,0.25)' },
};

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
  'rising-voice': 'Earn upvotes on your first submission. Threshold set by your teacher.',
  'teachers-pick': 'Have your teacher select your story as exemplary.',
  'top-of-class': 'Earn the most upvotes in your class.',
  'most-improved': 'Be recognised by your teacher as the most improved writer this term.',
  'first-send': 'Submit your first story to your class.',
  'kind-reader': 'Submit thoughtful feedback to 3 classmates.',
};

function BadgeCard({ badge, earned, earnedAt, isLoggedIn }) {
  const isDeepBlue = badge.background === 'deep-blue';
  const bgColor = isDeepBlue ? '#13233A' : '#F5EFE6';
  const svgSrc = badge.svg_filename ? `/badges/${badge.svg_filename}` : null;

  const tierInfo = badge.premium_only
    ? TIER_LABELS.premium_only
    : badge.student_only
    ? TIER_LABELS.student_only
    : TIER_LABELS.free;

  return (
    <Link
      to={`/badge/${badge.slug}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: '#FFFCF8',
        border: '1px solid #D9C9B0',
        borderRadius: '14px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        opacity: isLoggedIn && !earned ? 0.6 : 1,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(58,50,38,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Badge image */}
        <div style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: '10px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${isDeepBlue ? 'rgba(91,158,202,0.2)' : '#EDE3D4'}`,
          filter: isLoggedIn && !earned ? 'grayscale(100%)' : 'none',
        }}>
          {svgSrc && (
            <img
              src={svgSrc}
              alt={badge.name}
              style={{ width: '85%', height: '85%', objectFit: 'contain' }}
            />
          )}
          {/* Locked overlay */}
          {isLoggedIn && !earned && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(245,239,230,0.5)',
              borderRadius: '10px',
            }}>
              <div style={{ fontSize: '1.4rem', opacity: 0.5 }}>🔒</div>
            </div>
          )}
          {/* Earned checkmark */}
          {earned && (
            <div style={{
              position: 'absolute',
              top: '0.4rem',
              right: '0.4rem',
              background: '#4A7B6F',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              color: '#FFFCF8',
              fontWeight: 700,
            }}>✓</div>
          )}
        </div>

        {/* Badge info */}
        <div>
          {/* Tier pill */}
          <div style={{
            display: 'inline-block',
            padding: '0.15rem 0.5rem',
            borderRadius: '20px',
            fontSize: '0.6rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: tierInfo.color,
            background: tierInfo.bg,
            border: `1px solid ${tierInfo.border}`,
            marginBottom: '0.4rem',
          }}>
            {tierInfo.label}
          </div>

          {/* Name */}
          <div style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#3A3226',
            marginBottom: '0.3rem',
            lineHeight: 1.3,
          }}>
            {badge.name}
          </div>

          {/* How to earn */}
          <div style={{
            fontSize: '0.75rem',
            color: '#9A8878',
            lineHeight: 1.5,
            marginBottom: earned && earnedAt ? '0.5rem' : 0,
          }}>
            {HOW_TO_EARN[badge.slug] || badge.description}
          </div>

          {/* Earned date */}
          {earned && earnedAt && (
            <div style={{
              fontSize: '0.68rem',
              color: '#4A7B6F',
              fontWeight: 600,
            }}>
              Earned {new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function BadgeDiscovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allBadges, setAllBadges] = useState([]);
  const [earnedMap, setEarnedMap] = useState({}); // slug → earned_at
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch all badges
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .order('sort_order', { ascending: true });
      setAllBadges(badges || []);

      // Fetch user's earned badges if logged in
      if (user) {
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('badge_id, earned_at, badges(slug)')
          .eq('user_id', user.id);

        const map = {};
        (userBadges || []).forEach(ub => {
          if (ub.badges?.slug) {
            map[ub.badges.slug] = ub.earned_at;
          }
        });
        setEarnedMap(map);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const generalBadges = allBadges.filter(b => !EDUCATION_SLUGS.includes(b.slug));
  const educationBadges = allBadges.filter(b => EDUCATION_SLUGS.includes(b.slug));

  // Sort: earned first (by earned_at desc), then unearned by sort_order
  const sortBadges = (badges) => {
    const earned = badges.filter(b => earnedMap[b.slug]).sort((a, b) =>
      new Date(earnedMap[b.slug]) - new Date(earnedMap[a.slug])
    );
    const unearned = badges.filter(b => !earnedMap[b.slug]);
    return [...earned, ...unearned];
  };

  const sortedGeneral = user ? sortBadges(generalBadges) : generalBadges;
  const sortedEducation = user ? sortBadges(educationBadges) : educationBadges;
  const earnedBadges = allBadges.filter(b => earnedMap[b.slug]);

  const sectionTitle = {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#9A8878',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const sectionTitleAfter = {
    flex: 1,
    height: '1px',
    background: '#D9C9B0',
    opacity: 0.5,
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9A8878', fontStyle: 'italic' }}>
      Loading badges...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>

      {/* Header */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to={user ? '/dashboard' : '/login'} style={{ textDecoration: 'none' }}>
          <FictiflyLogo />
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
            >
              ← Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/age-gate')}
                style={{ background: '#2E6DA4', border: 'none', borderRadius: '8px', color: '#FFFCF8', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Join free
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.5rem' }}>
            Fictifly
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2.2rem', fontWeight: 300, color: '#3A3226', marginBottom: '0.5rem', lineHeight: 1.2 }}>
            Badge <em style={{ fontStyle: 'italic', color: '#D4845A' }}>Collection</em>
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#6B5D4E', lineHeight: 1.65, maxWidth: '540px' }}>
            Earn badges by writing, exploring genres, building characters, and showing up consistently.
            {!user && ' Join Fictifly free to start earning.'}
          </p>
        </div>

        {/* Logged-in: Your earned badges summary */}
        {user && earnedBadges.length > 0 && (
          <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3A3226', marginBottom: '0.15rem' }}>
                {earnedBadges.length} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#9A8878' }}>of {allBadges.length}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>badges earned</div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {earnedBadges.slice(0, 5).map(b => (
                <div key={b.slug} style={{
                  width: '36px', height: '36px',
                  borderRadius: '8px',
                  background: b.background === 'deep-blue' ? '#13233A' : '#F5EFE6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #D9C9B0',
                  overflow: 'hidden',
                }}>
                  {b.svg_filename && (
                    <img src={`/badges/${b.svg_filename}`} alt={b.name} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                  )}
                </div>
              ))}
              {earnedBadges.length > 5 && (
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EDE3D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 600, color: '#6B5D4E' }}>
                  +{earnedBadges.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logged-out CTA */}
        {!user && (
          <div style={{ background: '#FFFCF8', border: '1px solid #5B9EC9', borderLeft: '4px solid #5B9EC9', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#2E6DA4', marginBottom: '0.2rem' }}>Start earning badges</div>
              <div style={{ fontSize: '0.85rem', color: '#6B5D4E' }}>Join Fictifly free — no credit card required.</div>
            </div>
            <button
              onClick={() => navigate('/age-gate')}
              style={{ background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Join free →
            </button>
          </div>
        )}

        {/* Writing Badges */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={sectionTitle}>
            Writing Badges
            <div style={sectionTitleAfter} />
            <span style={{ fontSize: '0.7rem', color: '#9A8878', whiteSpace: 'nowrap' }}>{generalBadges.length} badges</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {sortedGeneral.map(badge => (
              <BadgeCard
                key={badge.slug}
                badge={badge}
                earned={!!earnedMap[badge.slug]}
                earnedAt={earnedMap[badge.slug]}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </div>

        {/* Education Badges */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={sectionTitle}>
            Education Badges
            <div style={sectionTitleAfter} />
            <span style={{ fontSize: '0.7rem', color: '#9A8878', whiteSpace: 'nowrap' }}>{educationBadges.length} badges</span>
          </div>
          <div style={{ background: '#EAF4FB', border: '1px solid #5B9EC9', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#2E6DA4', lineHeight: 1.55 }}>
            These badges are available to students and educators using Fictifly in the classroom.{' '}
            <span style={{ color: '#6B5D4E' }}>Teacher and student accounts only.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {sortedEducation.map(badge => (
              <BadgeCard
                key={badge.slug}
                badge={badge}
                earned={!!earnedMap[badge.slug]}
                earnedAt={earnedMap[badge.slug]}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {!user && (
          <div style={{ textAlign: 'center', padding: '2rem 0', borderTop: '1px solid #D9C9B0' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 300, color: '#3A3226', marginBottom: '0.5rem' }}>
              Ready to start writing?
            </div>
            <div style={{ fontSize: '0.88rem', color: '#6B5D4E', marginBottom: '1.25rem' }}>
              Join free and earn your first badge today.
            </div>
            <button
              onClick={() => navigate('/age-gate')}
              style={{ background: '#D4845A', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Start writing free →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}