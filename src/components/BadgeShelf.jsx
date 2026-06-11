// BadgeShelf.jsx
// Shared component used in Dashboard, Profile, and PublicProfile
// Renders earned badges as SVG images with sand/deep-blue backgrounds

const SAND_BG = '#F5EFE6';
const DEEP_BLUE_BG = '#13233A';

export default function BadgeShelf({ earnedBadges, title = 'Badges' }) {
  if (!earnedBadges || earnedBadges.length === 0) return null;

  return (
    <div style={{
      background: '#FFFCF8',
      border: '1px solid #D9C9B0',
      borderRadius: '14px',
      padding: '1.5rem',
      boxShadow: '0 2px 12px rgba(58,50,38,0.05)',
    }}>
      <div style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#9A8878',
        marginBottom: '1.25rem',
      }}>
        {title} · {earnedBadges.length}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        {earnedBadges.map((ub) => {
          const badge = ub.badges || ub;
          if (!badge) return null;

          const isDeepBlue = badge.background === 'deep-blue';
          const bgColor = isDeepBlue ? DEEP_BLUE_BG : SAND_BG;
          const svgSrc = badge.svg_filename ? `/badges/${badge.svg_filename}` : null;

          return (
            <div
              key={ub.id || badge.id}
              title={badge.description || badge.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'default',
              }}
            >
              {/* Badge image container */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '12px',
                background: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${isDeepBlue ? 'rgba(91,158,202,0.2)' : '#D9C9B0'}`,
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: isDeepBlue
                  ? '0 2px 8px rgba(14,22,41,0.3)'
                  : '0 1px 4px rgba(58,50,38,0.08)',
              }}>
                {svgSrc ? (
                  <img
                    src={svgSrc}
                    alt={badge.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'contain',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback icon */}
                <div style={{
                  display: svgSrc ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  width: '100%',
                  height: '100%',
                }}>
                  {badge.icon || '✦'}
                </div>
              </div>

              {/* Badge name */}
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 500,
                color: '#6B5D4E',
                textAlign: 'center',
                lineHeight: 1.3,
                maxWidth: '80px',
                wordBreak: 'break-word',
              }}>
                {badge.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* View all badges link */}
      <div style={{ textAlign: 'right' }}>
        <a href="/badges" style={{ fontSize: '0.78rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>
          View all badges →
        </a>
      </div>
    </div>
  );
}