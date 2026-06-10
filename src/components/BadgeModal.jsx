import { useEffect, useCallback } from 'react';

// Maps each badge slug to its congratulatory copy
const BADGE_COPY = {
  'first-spark': {
    headline: 'The spark is lit.',
    why: 'You used a Fictifly generator for the first time.',
    next: 'Write your first story to earn First Draft.',
  },
  'first-draft': {
    headline: 'Your first story is written.',
    why: 'You marked a story as written for the first time.',
    next: 'Keep writing — 9 more stories earns you Storyteller.',
  },
  'on-a-roll': {
    headline: 'Seven days in a row.',
    why: 'You kept a 7-day writing streak alive.',
    next: 'Keep the streak going — 30 days earns you Unbroken.',
  },
  'unbroken': {
    headline: '30 days. Unbroken.',
    why: 'You maintained a 30-day writing streak.',
    next: 'You\'re a dedicated writer. Keep showing up.',
  },
  'genre-explorer': {
    headline: 'Five genres explored.',
    why: 'You wrote across 5 different genres.',
    next: 'Explore 10 genres to earn Genre Chameleon.',
  },
  'genre-chameleon': {
    headline: 'Ten genres, one writer.',
    why: 'You wrote across 10 unique genres.',
    next: 'You can write anything. Keep exploring.',
  },
  'character-study': {
    headline: 'Your first character, saved.',
    why: 'You saved your first generated character.',
    next: 'Save 25 characters to earn Cast of Characters.',
  },
  'cast-of-characters': {
    headline: 'Twenty-five characters deep.',
    why: 'You\'ve saved 25 characters to your collection.',
    next: 'Keep building — your cast is growing.',
  },
  'storyteller': {
    headline: 'Ten stories told.',
    why: 'You\'ve written 10 stories.',
    next: 'Keep writing — 50 saves or submissions earns Prolific Storyteller.',
  },
  'prolific-storyteller': {
    headline: 'Fifty stories. Sealed.',
    why: 'You\'ve saved or submitted 50 stories.',
    next: 'Double down — 100 earns you Prolific Writer.',
  },
  'prolific-writer': {
    headline: 'One hundred stories.',
    why: 'You\'ve saved or submitted 100 stories.',
    next: 'You\'re a prolific writer. The well never runs dry.',
  },
  'microfiction-master': {
    headline: 'Fifty microfictions mastered.',
    why: 'You\'ve written 50 pieces of microfiction (100–300 words).',
    next: 'A master of the short form. Keep writing.',
  },
  'flash-fiction-fan': {
    headline: 'Thirty-five flash fictions.',
    why: 'You\'ve written 35 pieces of flash fiction (500–1,000 words).',
    next: 'The flash fiction form suits you. Keep going.',
  },
  'story-collector': {
    headline: 'Twenty-five stories submitted.',
    why: 'You\'ve submitted 25 stories to the platform.',
    next: 'Your collection is growing. Keep sharing.',
  },
  'rising-voice': {
    headline: 'Your voice is rising.',
    why: 'Your first submission earned the upvotes to be heard.',
    next: 'Keep sharing — the community is listening.',
  },
  'teachers-pick': {
    headline: 'Teacher\'s Pick.',
    why: 'Your teacher selected your story as exemplary.',
    next: 'A story worth celebrating. Keep writing like this.',
  },
  'top-of-class': {
    headline: 'Top of the class.',
    why: 'Your story was the most upvoted in your class.',
    next: 'The class has spoken. Keep raising the bar.',
  },
  'most-improved': {
    headline: 'Most improved this term.',
    why: 'Your teacher recognised your growth over the term.',
    next: 'Growth is the goal. Keep at it.',
  },
  'first-send': {
    headline: 'First story sent.',
    why: 'You submitted your first story to your class.',
    next: 'Great start — give feedback to earn Kind Reader.',
  },
  'kind-reader': {
    headline: 'A kind reader.',
    why: 'You gave thoughtful feedback to three classmates.',
    next: 'Reading well is writing well. Keep engaging.',
  },
};

const SAND_BG = '#F5EFE6';
const DEEP_BLUE_BG = '#13233A';

export default function BadgeModal({ badges, onDismiss }) {
  // Show one badge at a time — the first in the array
  const badge = badges[0];

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Escape key closes
  useEffect(() => {
    if (!badge) return;
    const handleKey = (e) => { if (e.key === 'Escape') handleDismiss(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [badge, handleDismiss]);

  if (!badge) return null;

  const slug = badge.slug || '';
  const copy = BADGE_COPY[slug] || {
    headline: 'Badge earned!',
    why: badge.description || 'You earned a new badge.',
    next: 'Keep writing.',
  };

  const isDeepBlue = badge.background === 'deep-blue';
  const badgeBg = isDeepBlue ? DEEP_BLUE_BG : SAND_BG;
  const svgSrc = badge.svg_filename
    ? `/badges/${badge.svg_filename}`
    : null;

  const remaining = badges.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(58,50,38,0.55)',
          zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.25rem',
          animation: 'backdropIn 0.25s ease',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#FFFCF8',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 16px 64px rgba(58,50,38,0.25)',
            animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Badge SVG display area */}
          <div style={{
            background: badgeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 2rem',
            position: 'relative',
          }}>
            {/* Subtle radial glow */}
            <div style={{
              position: 'absolute', inset: 0,
              background: isDeepBlue
                ? 'radial-gradient(ellipse at center, rgba(91,158,202,0.15) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(212,132,90,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            {svgSrc ? (
              <img
                src={svgSrc}
                alt={badge.name}
                style={{
                  width: '140px',
                  height: '140px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))',
                  animation: 'badgePop 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
                  position: 'relative', zIndex: 1,
                }}
              />
            ) : (
              // Fallback if SVG not found
              <div style={{
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: isDeepBlue ? '#20466D' : '#EDE3D4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem',
              }}>
                {badge.icon || '✦'}
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '1.75rem 2rem 2rem' }}>
            {/* Eyebrow */}
            <div style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#D4845A',
              marginBottom: '0.5rem',
            }}>
              Badge earned
            </div>

            {/* Badge name */}
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '1.4rem',
              fontWeight: 600,
              color: '#3A3226',
              marginBottom: '0.35rem',
              lineHeight: 1.2,
            }}>
              {badge.name}
            </div>

            {/* Headline */}
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '0.95rem',
              fontStyle: 'italic',
              color: '#6B5D4E',
              marginBottom: '1.1rem',
              lineHeight: 1.5,
            }}>
              {copy.headline}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#EDE3D4', marginBottom: '1rem' }} />

            {/* Why earned */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#9A8878',
                marginBottom: '0.3rem',
              }}>
                Why you earned it
              </div>
              <div style={{ fontSize: '0.85rem', color: '#3A3226', lineHeight: 1.55 }}>
                {copy.why}
              </div>
            </div>

            {/* What's next */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#9A8878',
                marginBottom: '0.3rem',
              }}>
                What's next
              </div>
              <div style={{ fontSize: '0.85rem', color: '#3A3226', lineHeight: 1.55 }}>
                {copy.next}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleDismiss}
              style={{
                width: '100%',
                background: '#3A3226',
                color: '#FFFCF8',
                border: 'none',
                borderRadius: '10px',
                padding: '0.85rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6B5D4E'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3A3226'; }}
            >
              {remaining > 0 ? `Next badge (${remaining} more)` : 'Keep writing'}
            </button>

            {/* Multiple badge indicator */}
            {remaining > 0 && (
              <div style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#9A8878',
                marginTop: '0.75rem',
              }}>
                You earned {badges.length} badges this session
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes badgePop {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}