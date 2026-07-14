import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import FictiflyLogo from '../components/FictiflyLogo';

const B = {
  sand: '#F5EFE6',
  sandMid: '#EDE3D4',
  sandDeep: '#D9C9B0',
  terra: '#D4845A',
  terraDark: '#B56840',
  seaDeep: '#2E6DA4',
  seaMid: '#5B9EC9',
  ink: '#3A3226',
  inkMid: '#6B5D4E',
  inkLight: '#9A8878',
  white: '#FFFCF8',
};

export default function RubricViewPage() {
  const { shareId } = useParams();
  const [rubric, setRubric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState('simple');

  useEffect(() => {
    const fetchRubric = async () => {
      setLoading(true);

      try {
        // Fetch the share record
        const { data: shareData, error: shareError } = await supabase
          .from('public_rubric_shares')
          .select('rubric_id, created_at')
          .eq('id', shareId)
          .maybeSingle();

        if (shareError || !shareData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Fetch the rubric with categories and criteria
        const { data: rubricData, error: rubricError } = await supabase
          .from('rubrics')
          .select(`
            *,
            rubric_categories (
              *,
              rubric_criteria_levels (*)
            )
          `)
          .eq('id', shareData.rubric_id)
          .maybeSingle();

        if (rubricError || !rubricData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Shape the data to match RubricViewer expectations
        const shaped = {
          ...rubricData,
          rubric_categories: (rubricData.rubric_categories || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(cat => ({
              ...cat,
              criteria: (cat.rubric_criteria_levels || [])
                .sort((a, b) => b.points - a.points),
            })),
        };

        setRubric(shaped);
      } catch (err) {
        console.error('Error fetching rubric:', err);
        setNotFound(true);
      }

      setLoading(false);
    };

    fetchRubric();
  }, [shareId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: B.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: B.inkLight, fontStyle: 'italic' }}>
      Loading rubric...
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: B.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
        <h1 style={{ color: B.ink, marginBottom: '0.5rem' }}>Rubric not found</h1>
        <p style={{ color: B.inkLight, marginBottom: '1.5rem' }}>This rubric link may have expired or been removed.</p>
        <Link to="/login" style={{ color: B.seaDeep, textDecoration: 'none', fontWeight: 600 }}>Go to Fictifly →</Link>
      </div>
    </div>
  );

  const totalPoints = rubric.rubric_categories
    ? rubric.rubric_categories.reduce((sum, cat) => sum + (cat.max_points || 5), 0)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: B.sand, fontFamily: 'sans-serif', color: B.ink, padding: '0 1.25rem 5rem' }}>

      {/* Header */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${B.sandDeep}`, marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <FictiflyLogo />
        </Link>
        <div style={{ fontSize: '0.78rem', color: B.inkLight, fontStyle: 'italic' }}>
          Shared rubric — view only
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Rubric header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.terra, marginBottom: '0.5rem' }}>
            Grading Rubric
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 400, color: B.ink, marginBottom: '0.4rem', lineHeight: 1.2 }}>
            {rubric.name}
          </h1>
          {rubric.description && (
            <p style={{ fontSize: '0.92rem', color: B.inkMid, fontStyle: 'italic', lineHeight: 1.6 }}>
              {rubric.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: B.inkLight }}>
              {rubric.rubric_categories?.length || 0} categories · {totalPoints} points total
            </span>
            {/* View mode toggle */}
            <div style={{ display: 'flex', background: B.sandMid, borderRadius: '8px', padding: '3px', gap: '2px' }}>
              {['simple', 'detailed'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === mode ? B.white : 'transparent',
                    color: viewMode === mode ? B.ink : B.inkLight,
                    fontSize: '0.78rem',
                    fontWeight: viewMode === mode ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'sans-serif',
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simple view */}
        {viewMode === 'simple' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {rubric.rubric_categories?.map(cat => (
              <div key={cat.id} style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: B.ink, flex: 1, marginRight: '0.5rem' }}>
                    {cat.name}
                  </div>
                  <span style={{ background: B.seaDeep, color: B.white, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    {cat.max_points || 5} pts
                  </span>
                </div>
                {cat.description && (
                  <div style={{ fontSize: '0.78rem', color: B.inkLight, lineHeight: 1.5, fontStyle: 'italic' }}>
                    {cat.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Detailed view */}
        {viewMode === 'detailed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {rubric.rubric_categories?.map(cat => (
              <div key={cat.id} style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '12px', overflow: 'hidden' }}>
                {/* Category header */}
                <div style={{ background: B.sand, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${B.sandDeep}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: B.ink }}>{cat.name}</div>
                    {cat.description && (
                      <div style={{ fontSize: '0.78rem', color: B.inkLight, fontStyle: 'italic', marginTop: '0.2rem' }}>{cat.description}</div>
                    )}
                  </div>
                  <span style={{ background: B.seaDeep, color: B.white, fontSize: '0.78rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '20px', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                    {cat.max_points || 5} pts
                  </span>
                </div>

                {/* Criteria levels */}
                {cat.criteria && cat.criteria.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {cat.criteria.map((criterion, idx) => (
                      <div key={idx} style={{ padding: '0.85rem 1.25rem', borderBottom: idx < cat.criteria.length - 1 ? `1px solid ${B.sandDeep}` : 'none', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ minWidth: '52px', textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: B.seaDeep }}>{criterion.points}</span>
                          <span style={{ fontSize: '0.72rem', color: B.inkLight, marginLeft: '2px' }}>pt{criterion.points !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          {criterion.label && (
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: B.ink, marginBottom: '0.2rem' }}>{criterion.label}</div>
                          )}
                          {criterion.descriptor && (
                            <div style={{ fontSize: '0.82rem', color: B.inkMid, lineHeight: 1.55 }}>{criterion.descriptor}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: B.inkLight, fontStyle: 'italic' }}>
                    No detailed criteria defined for this category.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Total points summary */}
        <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '12px', padding: '1.25rem', textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: B.inkLight, marginBottom: '0.4rem' }}>
            Total Points Possible
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: B.seaDeep }}>
            {totalPoints}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', padding: '1.5rem 0', borderTop: `1px solid ${B.sandDeep}` }}>
          <div style={{ fontSize: '0.82rem', color: B.inkLight, marginBottom: '0.75rem' }}>
            This rubric was shared via Fictifly — a creative writing platform for students and educators.
          </div>
          <Link to="/age-gate" style={{ color: B.seaDeep, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
            Join Fictifly free →
          </Link>
        </div>

      </div>
    </div>
  );
}