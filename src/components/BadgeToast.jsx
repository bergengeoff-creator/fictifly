import { useEffect, useState } from 'react';

const BADGE_COLORS = {
  // Generation
  'First Spark':          '#D4845A',
  'Prolific Writer':      '#B56840',
  'Microfiction Master':  '#B07AC0',
  'Flash Fiction Fan':    '#5B9EC9',
  // Saving
  'Story Hoarder':        '#2E6DA4',
  // Streaks
  'Dedicated Writer':     '#E86A3A',
  'Week Warrior':         '#C8A060',
  // Writing
  'First Draft':          '#6BAF72',
  'Storyteller':          '#3A7040',
  'Prolific Storyteller': '#3A3226',
  // Exploration
  'Genre Explorer':       '#6BAF72',
  // Character
  'Character Study':      '#7A4A90',
  'Character Keeper':     '#5B9EC9',
  'Cast of Characters':   '#2E6DA4',
  'Genre Chameleon':      '#B07AC0',
};

const DISPLAY_MS = 7000;
const FADE_MS    = 400;

export default function BadgeToast({ badges, onDismiss }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (badges.length === 0) return;
    setFading(false);
    const fadeTimer    = setTimeout(() => setFading(true), DISPLAY_MS);
    const dismissTimer = setTimeout(() => onDismiss(), DISPLAY_MS + FADE_MS);
    return () => { clearTimeout(fadeTimer); clearTimeout(dismissTimer); };
  }, [badges, onDismiss]);

  if (badges.length === 0) return null;

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => onDismiss(), FADE_MS);
  };

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      zIndex: 1000, maxWidth: '320px',
      opacity: fading ? 0 : 1,
      transform: fading ? 'translateY(8px)' : 'translateY(0)',
      transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
    }}>
      {badges.map((badge, i) => {
        const color = BADGE_COLORS[badge.name] || '#D4845A';
        return (
          <div key={i} style={{
            background: '#FFFCF8',
            border: `1px solid ${color}`,
            borderLeft: `4px solid ${color}`,
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            boxShadow: '0 4px 24px rgba(58,50,38,0.18)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            animation: 'badgeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
          }}>
            <div style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}>{badge.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: '0.2rem' }}>
                Badge Earned!
              </div>
              <div style={{ fontWeight: 700, color: '#3A3226', fontSize: '0.98rem', marginBottom: '0.15rem' }}>
                {badge.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9A8878', lineHeight: 1.4 }}>
                {badge.description}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                position: 'absolute', top: '0.5rem', right: '0.6rem',
                background: 'transparent', border: 'none',
                fontSize: '1rem', color: '#9A8878', cursor: 'pointer',
                lineHeight: 1, padding: '0.1rem 0.25rem',
              }}
              title="Dismiss"
            >×</button>
          </div>
        );
      })}
      <style>{`
        @keyframes badgeSlideIn {
          from { opacity: 0; transform: translateX(24px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}