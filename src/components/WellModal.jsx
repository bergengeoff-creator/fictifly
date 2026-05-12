import TheWell from './TheWell';

const B = {
  sand: '#F5EFE6', sandDeep: '#D9C9B0',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878',
  terra: '#D4845A', sea: '#2E6DA4', seaMid: '#5B9EC9',
  white: '#FFFCF8',
};

export default function WellModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,22,16,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.25rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1A1610',
          border: `1px solid #3A3226`,
          borderRadius: 20,
          maxWidth: 520,
          width: '100%',
          padding: '2.5rem 2rem 2rem',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'transparent', border: 'none',
            color: B.inkLight, fontSize: '1.2rem', cursor: 'pointer',
            lineHeight: 1, padding: '0.25rem 0.5rem',
          }}
        >×</button>

        {/* The Well — animated */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <TheWell size="medium" darkBg={false} animate={true} style={{ borderRadius: 12 }}/>
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '1.6rem', fontWeight: 600,
          color: B.sandDeep, textAlign: 'center',
          marginBottom: '0.5rem',
        }}>
          The Well
        </h2>

        <p style={{
          fontFamily: "'Fraunces', serif",
          fontStyle: 'italic', fontSize: '0.85rem',
          color: B.inkLight, textAlign: 'center',
          letterSpacing: '0.06em', marginBottom: '1.75rem',
          opacity: 0.7,
        }}>
          de la tinta, tot
        </p>

        {/* Story */}
        <div style={{
          fontSize: '0.9rem', lineHeight: 1.85,
          color: '#C8B898', fontFamily: "'DM Sans', sans-serif",
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <p>
            Every story begins somewhere. For writers, it begins at the well — that quiet inner source where ideas surface, characters arrive uninvited, and the first line of something new takes shape.
          </p>
          <p>
            The Well is Fictifly's visual heart. The orbiting mark is the{' '}
            <span style={{ color: B.seaMid }}>Flor de Barcelona</span> — the city's symbol, built into the wordmark and animated here as the driving force of the machine. Fictifly was born in Barcelona, and that thread runs through everything quietly.
          </p>
          <p>
            The letters of <em style={{ fontFamily: "'Fraunces', serif", color: B.sandDeep }}>fictifly</em> are placed around the orbit. The Flor reads them one by one as it travels — the platform's name revealed slowly, through the glass.
          </p>
          <p style={{ color: B.inkLight, fontSize: '0.82rem', fontStyle: 'italic' }}>
            Hidden in the ink pool, at the edge of visibility: <em>de la tinta, tot.</em> From the ink, everything. A Catalan phrase. A quiet truth about writing.
          </p>
        </div>

        {/* Close button */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid #3A3226`,
              borderRadius: 8,
              color: B.inkLight,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem',
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}