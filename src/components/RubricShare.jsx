import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

const B = {
  sand: '#F5EFE6',
  sandMid: '#EDE3D4',
  sandDeep: '#D9C9B0',
  terra: '#D4845A',
  seaDeep: '#2E6DA4',
  ink: '#3A3226',
  inkMid: '#6B5D4E',
  inkLight: '#9A8878',
  white: '#FFFCF8',
};

/**
 * Public Rubric Share Page / Modal
 * 
 * Can be used two ways:
 * 1. Standalone page: /rubric-view/:shareId (full page, full height)
 * 2. Modal popup: Pass shareId + onClose props (modal overlay)
 * 
 * No grading access, just viewing
 */

export default function RubricSharePage({ shareId: propShareId, onClose, isModal = false }) {
  const { shareId: routeShareId } = useParams();
  const actualShareId = propShareId || routeShareId;

  const [rubric, setRubric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('simple');

  useEffect(() => {
    const loadRubric = async () => {
      try {
        // Get the public share record
        const { data: share, error: shareError } = await supabase
          .from('public_rubric_shares')
          .select('rubric_id')
          .eq('id', actualShareId)
          .eq('is_active', true)
          .single();

        if (shareError || !share) {
          throw new Error('Rubric link not found or has been removed');
        }

        // Get the rubric with categories and criteria
        const { data: rubricData, error: rubricError } = await supabase
          .from('rubrics')
          .select(`
            id,
            name,
            description,
            created_at,
            rubric_categories (
              id,
              name,
              description,
              max_points,
              rubric_criteria_levels (
                points,
                label,
                descriptor
              )
            )
          `)
          .eq('id', share.rubric_id)
          .eq('is_deleted', false)
          .single();

        if (rubricError || !rubricData) {
          throw new Error('Rubric not found');
        }

        setRubric(rubricData);
      } catch (err) {
        console.error('Error loading rubric:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRubric();
  }, [actualShareId]);

  const SimpleView = () => (
    <div style={{ backgroundColor: B.white, padding: '2rem', borderRadius: isModal ? '8px' : 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: B.ink, marginBottom: '0.5rem' }}>
          How You'll Be Graded
        </h2>
        {rubric.description && (
          <p style={{ margin: 0, fontSize: '1rem', color: B.inkMid, fontStyle: 'italic' }}>
            {rubric.description}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {rubric.rubric_categories && rubric.rubric_categories.map((category) => (
          <div
            key={category.id}
            style={{
              backgroundColor: B.sand,
              border: `2px solid ${B.sandDeep}`,
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', color: B.ink }}>
              {category.name}
            </h3>
            {category.description && (
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: B.inkMid, fontStyle: 'italic' }}>
                {category.description}
              </p>
            )}
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: B.seaDeep,
                padding: '0.75rem',
                backgroundColor: B.white,
                borderRadius: '6px',
                textAlign: 'center',
              }}
            >
              {category.max_points || 5} points
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: B.seaDeep,
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>
          Total Points Possible
        </p>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
          {rubric.rubric_categories
            ? rubric.rubric_categories.reduce((sum, cat) => sum + (cat.max_points || 5), 0)
            : 0}
        </p>
      </div>
    </div>
  );

  const DetailedView = () => (
    <div style={{ backgroundColor: B.white, padding: '2rem', borderRadius: isModal ? '8px' : 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: B.ink, marginBottom: '0.5rem' }}>
          How You'll Be Graded
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: B.inkMid }}>
          Below is the detailed rubric your teacher will use to grade your work. Read through each
          category and level to understand what's expected.
        </p>
        {rubric.description && (
          <p style={{ margin: '1rem 0 0 0', fontSize: '0.95rem', color: B.inkMid, fontStyle: 'italic' }}>
            {rubric.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {rubric.rubric_categories && rubric.rubric_categories.map((category) => (
          <div key={category.id}>
            {/* Category Header */}
            <div
              style={{
                backgroundColor: B.sand,
                border: `2px solid ${B.sandDeep}`,
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: B.ink, marginBottom: '0.4rem' }}>
                  {category.name}
                </h3>
                {category.description && (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: B.inkMid, fontStyle: 'italic' }}>
                    {category.description}
                  </p>
                )}
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: B.seaDeep,
                  padding: '0.75rem 1.25rem',
                  backgroundColor: B.white,
                  border: `2px solid ${B.seaDeep}`,
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  marginLeft: '1rem',
                }}
              >
                {category.max_points || 5} pts
              </div>
            </div>

            {/* Point Levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {category.rubric_criteria_levels &&
                category.rubric_criteria_levels
                  .sort((a, b) => b.points - a.points)
                  .map((criterion) => (
                    <div
                      key={`${category.id}-${criterion.points}`}
                      style={{
                        backgroundColor: '#fafafa',
                        border: `1px solid ${B.sandDeep}`,
                        borderLeft: `5px solid ${B.seaDeep}`,
                        borderRadius: '6px',
                        padding: '1.25rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: B.ink }}>
                          {criterion.label}
                        </h4>
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: B.seaDeep,
                            marginLeft: '1rem',
                          }}
                        >
                          {criterion.points} {criterion.points === 1 ? 'pt' : 'pts'}
                        </span>
                      </div>

                      {criterion.descriptor && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.95rem',
                            color: B.inkMid,
                            lineHeight: '1.7',
                          }}
                        >
                          {criterion.descriptor}
                        </p>
                      )}
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: B.seaDeep,
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          textAlign: 'center',
          marginTop: '2rem',
        }}
      >
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>
          Total Points Possible
        </p>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
          {rubric.rubric_categories
            ? rubric.rubric_categories.reduce((sum, cat) => sum + (cat.max_points || 5), 0)
            : 0}
        </p>
      </div>
    </div>
  );

  // MODAL MODE
  if (isModal || propShareId) {
    if (loading) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: B.white,
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: B.inkMid }}>Loading rubric...</p>
          </div>
        </div>
      );
    }

    if (error || !rubric) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && onClose) {
              onClose();
            }
          }}
        >
          <div
            style={{
              backgroundColor: B.white,
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ color: B.terraDark, marginTop: 0 }}>Rubric Not Found</h2>
            <p style={{ color: B.terraDark, margin: '1rem 0' }}>
              {error || 'The rubric link may have expired or been removed.'}
            </p>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: B.seaDeep,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div
          style={{
            backgroundColor: B.white,
            borderRadius: '12px',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: B.sand,
              borderBottom: `1px solid ${B.sandDeep}`,
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: B.ink }}>
                {rubric.name}
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: B.inkMid }}>
                {rubric.rubric_categories?.length || 0} categories
              </p>
            </div>

            {/* View Mode Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode('simple')}
                style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: viewMode === 'simple' ? B.seaDeep : B.sandMid,
                  color: viewMode === 'simple' ? '#fff' : B.ink,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Simple
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: viewMode === 'detailed' ? B.seaDeep : B.sandMid,
                  color: viewMode === 'detailed' ? '#fff' : B.ink,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Detailed
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
            {viewMode === 'simple' ? <SimpleView /> : <DetailedView />}
          </div>

          {/* Close Button */}
          {onClose && (
            <div
              style={{
                borderTop: `1px solid ${B.sandDeep}`,
                padding: '1rem',
                textAlign: 'right',
                backgroundColor: B.sandMid,
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#fff',
                  border: `2px solid ${B.sandDeep}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: B.ink,
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STANDALONE PAGE MODE
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: B.sand,
        }}
      >
        <p style={{ fontSize: '1.1rem', color: B.inkMid }}>Loading rubric...</p>
      </div>
    );
  }

  if (error || !rubric) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
        <div
          style={{
            backgroundColor: '#FDF0E8',
            border: `2px solid ${B.terra}`,
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, color: B.terraDark, fontSize: '1.5rem' }}>
            Rubric Not Found
          </h1>
          <p style={{ margin: '1rem 0 0 0', color: B.terraDark, fontSize: '1rem' }}>
            {error || 'The rubric link may have expired or been removed.'}
          </p>
          <p style={{ margin: '1rem 0 0 0', color: B.inkMid, fontSize: '0.9rem' }}>
            Please contact your instructor for the correct rubric link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: B.sand, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: B.ink, marginBottom: '0.5rem' }}>
            {rubric.name}
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: B.inkMid }}>
            Shared by your instructor • {new Date(rubric.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => setViewMode('simple')}
            style={{
              padding: '0.75rem 1.5rem',
              marginRight: '1rem',
              backgroundColor: viewMode === 'simple' ? B.seaDeep : B.sandMid,
              color: viewMode === 'simple' ? '#fff' : B.ink,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Simple View
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: viewMode === 'detailed' ? B.seaDeep : B.sandMid,
              color: viewMode === 'detailed' ? '#fff' : B.ink,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Detailed View
          </button>
        </div>

        {/* Content */}
        {viewMode === 'simple' ? <SimpleView /> : <DetailedView />}

        {/* Info Footer */}
        <div
          style={{
            backgroundColor: B.sandMid,
            border: `2px solid ${B.sandDeep}`,
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.95rem', color: B.ink }}>
            <strong>Pro Tip:</strong> Save or print this rubric to use as a checklist while working on
            your assignment.
          </p>
        </div>
      </div>
    </div>
  );
}