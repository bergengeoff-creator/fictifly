import { useState, useEffect, useRef } from 'react';
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
  'teachers-pick', 'top-of-class',
  'most-improved', 'first-send', 'kind-reader',
];

// Share popover component
function SharePopover({ badge, slug, onClose }) {
  const popoverRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/badge/${slug}`;
  const text = `I just earned the ${badge.name} badge on Fictifly. Can you earn it too?`;
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1800);
    } catch (e) {
      prompt('Copy this link:', url);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = `/badges/share/${slug}-share.png`;
    a.download = `${badge.name.replace(/\s+/g, '-').toLowerCase()}-fictifly.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  };

  const shareOptions = [
    {
      name: 'X / Twitter',
      color: '#000000',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        background: '#FFFCF8',
        border: '1px solid #D9C9B0',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(58,50,38,0.15)',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'popoverIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Share message preview */}
      <div style={{
        padding: '0.85rem 1rem',
        borderBottom: '1px solid #EDE3D4',
        fontSize: '0.78rem',
        color: '#6B5D4E',
        lineHeight: 1.5,
        fontStyle: 'italic',
      }}>
        "{text}"
      </div>

      {/* Social options */}
      {shareOptions.map(opt => (
        <a
          key={opt.name}
          href={opt.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            textDecoration: 'none',
            color: '#3A3226',
            fontSize: '0.88rem',
            fontWeight: 500,
            borderBottom: '1px solid #F5EFE6',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5EFE6'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ color: opt.color, display: 'flex', alignItems: 'center' }}>
            {opt.icon}
          </span>
          {opt.name}
        </a>
      ))}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'transparent',
          border: 'none',
          color: copied ? '#4A7B6F' : '#3A3226',
          fontSize: '0.88rem',
          fontWeight: 500,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s',
          fontFamily: 'sans-serif',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F5EFE6'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ color: '#9A8878', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
        </span>
        {copied ? '✓ Link copied!' : 'Copy link'}
      </button>

      {/* Download badge image */}
      <button
        onClick={handleDownload}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid #F5EFE6',
          color: '#3A3226',
          fontSize: '0.88rem',
          fontWeight: 500,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s',
          fontFamily: 'sans-serif',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F5EFE6'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ color: '#9A8878', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </span>
        Download badge image
      </button>

      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

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
  const [showSharePopover, setShowSharePopover] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

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

      if (user) {
        const { data: userBadge } = await supabase
          .from('user_badges')
          .select('earned_at')
          .eq('user_id', user.id)
          .eq('badge_id', badgeData.id)
          .maybeSingle();
        if (userBadge) setEarnedAt(userBadge.earned_at);

        const { count } = await supabase
          .from('user_badges')
          .select('id', { count: 'exact', head: true })
          .eq('badge_id', badgeData.id);
        setTotalEarned(count || 0);
      }

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

  const handleShareClick = async () => {
    const url = `${window.location.origin}/badge/${slug}`;
    const text = `I just earned the ${badge?.name} badge on Fictifly. Can you earn it too?`;
    const shareData = { title: `${badge?.name} — Fictifly`, text, url };

    // Use native share on mobile if available
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // User cancelled — do nothing
      }
    } else {
      // Desktop — show popover
      setShowSharePopover(prev => !prev);
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
          <div style={{
            width: '200px', height: '200px', borderRadius: '24px',
            background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: isDeepBlue ? '0 8px 40px rgba(14,22,41,0.4)' : '0 8px 32px rgba(58,50,38,0.12)',
            border: `1px solid ${isDeepBlue ? 'rgba(91,158,202,0.2)' : '#D9C9B0'}`,
            overflow: 'hidden',
          }}>
            {svgSrc && <img src={svgSrc} alt={badge.name} style={{ width: '175px', height: '175px', objectFit: 'contain' }} />}
          </div>

          {/* Tier + education tags */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tierColor, background: `${tierColor}18`, border: `1px solid ${tierColor}30` }}>
              {tierLabel}
            </span>
            {isEducation && (
              <span style={{ padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5B9EC9', background: 'rgba(91,158,202,0.1)', border: '1px solid rgba(91,158,202,0.25)' }}>
                Classroom
              </span>
            )}
          </div>

          {/* Badge name */}
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 400, color: '#3A3226', textAlign: 'center', marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {badge.name}
          </h1>

          {/* Earned status */}
          {user && earnedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(75,123,111,0.1)', border: '1px solid rgba(75,123,111,0.25)', borderRadius: '20px', padding: '0.3rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, color: '#4A7B6F', marginBottom: '0.75rem' }}>
              ✓ Earned {new Date(earnedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}

          {/* Total earned count */}
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

        {/* Share button + popover */}
        {user && earnedAt && (
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <button
              onClick={handleShareClick}
              style={{
                width: '100%', background: '#3A3226', color: '#FFFCF8',
                border: 'none', borderRadius: '10px', padding: '0.85rem',
                fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6B5D4E'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3A3226'; }}
            >
              ↗ Share this badge
            </button>
            {showSharePopover && (
              <SharePopover
                badge={badge}
                slug={slug}
                onClose={() => setShowSharePopover(false)}
              />
            )}
          </div>
        )}

        {/* Recent earners */}
        {recentEarners.length > 0 && (
          <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '1rem' }}>
              Recently earned by
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentEarners.map((earner, i) => (
                <Link key={i} to={`/writers/${earner.users.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getAvatarDisplay(earner.users)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#3A3226' }}>{earner.users.display_name || earner.users.username}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9A8878' }}>@{earner.users.username}</div>
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
              <button onClick={() => navigate('/age-gate')} style={{ background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                Join free →
              </button>
              <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#6B5D4E', border: '1px solid #D9C9B0', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                Log in
              </button>
            </div>
          </div>
        )}

        {/* View all badges */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/badges" style={{ color: '#2E6DA4', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
            View all badges →
          </Link>
        </div>

      </div>
    </div>
  );
}