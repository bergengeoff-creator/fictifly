import { useState } from 'react';
import { supabase } from '../supabase';

const B = {
  sand: '#F5EFE6',
  sandMid: '#EDE3D4',
  sandDeep: '#D9C9B0',
  terra: '#D4845A',
  terraDark: '#B56840',
  seaDeep: '#2E6DA4',
  ink: '#3A3226',
  inkMid: '#6B5D4E',
  inkLight: '#9A8878',
  white: '#FFFCF8',
};

/**
 * RubricViewer Component
 * 
 * Displays rubrics in two modes:
 * 1. SIMPLE: Just category names and max points (quick reference)
 * 2. DETAILED: Full point-level descriptors (for grading/learning)
 * 
 * Features:
 * - Toggle between modes
 * - Download as PDF (for printing)
 * - Share with students (generates view link)
 * - Print-friendly styling
 */

export default function RubricViewer({ rubric, onClose, studentView = false }) {
  const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'detailed'
  const [shareLink, setShareLink] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate shareable link for students
   * Creates a public link to view rubric (no grading capabilities)
   */
  const handleGenerateShareLink = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Create public rubric view in database
      const { data: publicRubric, error: insertError } = await supabase
        .from('public_rubric_shares')
        .insert({
          rubric_id: rubric.id,
          teacher_id: session.user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Generate shareable URL
      const shareUrl = `${window.location.origin}/rubric-view/${publicRubric.id}`;
      setShareLink(shareUrl);

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.error('Error generating share link:', err);
      setError('Failed to generate share link');
    }
  };

  /**
   * Download rubric as PDF
   * Generates a print-friendly PDF of the rubric
   */
  const handleDownloadPDF = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Use html2pdf or similar library
      const { html2pdf } = window;

      if (!html2pdf) {
        setError('PDF library not loaded. Please try again.');
        setDownloading(false);
        return;
      }

      const element = document.getElementById('rubric-print-content');
      if (!element) {
        setError('Could not find rubric to download');
        setDownloading(false);
        return;
      }

      const options = {
        margin: 10,
        filename: `${rubric.name}-rubric.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  /**
   * SIMPLE VIEW
   * Shows just the essentials: category names and max points
   */
  const SimpleView = () => (
    <div id="rubric-print-content" style={{ backgroundColor: B.white, padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: `2px solid ${B.sandDeep}`, paddingBottom: '1rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: B.ink }}>
          {rubric.name}
        </h1>
        {rubric.description && (
          <p style={{ margin: 0, fontSize: '1rem', color: B.inkMid, fontStyle: 'italic' }}>
            {rubric.description}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {rubric.rubric_categories && rubric.rubric_categories.map((category, idx) => (
          <div
            key={category.id}
            style={{
              backgroundColor: B.sand,
              border: `1px solid ${B.sandDeep}`,
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: B.ink, flex: 1 }}>
                {category.name}
              </h3>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: B.seaDeep,
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  marginLeft: '0.5rem',
                }}
              >
                {category.max_points || 5} pts
              </span>
            </div>

            {category.description && (
              <p style={{ margin: 0, fontSize: '0.9rem', color: B.inkMid, fontStyle: 'italic' }}>
                {category.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Total Points Summary */}
      <div
        style={{
          backgroundColor: B.sandMid,
          border: `2px solid ${B.sandDeep}`,
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: B.ink }}>
          Total Points Possible:{' '}
          <span style={{ fontSize: '1.5rem' }}>
            {rubric.rubric_categories
              ? rubric.rubric_categories.reduce((sum, cat) => sum + (cat.max_points || 5), 0)
              : 0}
          </span>
        </p>
      </div>
    </div>
  );

  /**
   * DETAILED VIEW
   * Shows full rubric with point-level descriptors
   */
  const DetailedView = () => (
    <div id="rubric-print-content" style={{ backgroundColor: B.white, padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: `2px solid ${B.sandDeep}`, paddingBottom: '1rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: B.ink }}>
          {rubric.name}
        </h1>
        {rubric.description && (
          <p style={{ margin: 0, fontSize: '1rem', color: B.inkMid, fontStyle: 'italic' }}>
            {rubric.description}
          </p>
        )}
        <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem', color: B.inkLight }}>
          Detailed Grading Rubric with Point-Level Descriptors
        </p>
      </div>

      {rubric.rubric_categories && rubric.rubric_categories.map((category, catIdx) => (
        <div
          key={category.id}
          style={{
            marginBottom: '2.5rem',
            pageBreakInside: 'avoid',
          }}
        >
          {/* Category Header */}
          <div
            style={{
              backgroundColor: B.sand,
              border: `2px solid ${B.sandDeep}`,
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.3rem', color: B.ink }}>
                {category.name}
              </h2>
              {category.description && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: B.inkMid, fontStyle: 'italic' }}>
                  {category.description}
                </p>
              )}
            </div>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: B.seaDeep,
                padding: '0.5rem 1rem',
                backgroundColor: B.sand,
                border: `2px solid ${B.seaDeep}`,
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                marginLeft: '1rem',
              }}
            >
              {category.max_points || 5} pts
            </span>
          </div>

          {/* Point Levels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {category.criteria &&
              category.criteria
                .sort((a, b) => b.points - a.points)
                .map((criterion) => (
                  <div
                    key={`${category.id}-${criterion.points}`}
                    style={{
                      backgroundColor: B.white,
                      border: `1px solid ${B.sandDeep}`,
                      borderLeft: `4px solid ${B.seaDeep}`,
                      borderRadius: '6px',
                      padding: '1rem',
                    }}
                  >
                    {/* Point Level Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: B.ink }}>
                        {criterion.label}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: B.seaDeep,
                        }}
                      >
                        {criterion.points} {criterion.points === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>

                    {/* Descriptor */}
                    {criterion.descriptor && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          color: B.inkMid,
                          lineHeight: '1.6',
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

      {/* Summary Footer */}
      <div
        style={{
          backgroundColor: B.sandMid,
          border: `2px solid ${B.sandDeep}`,
          borderRadius: '8px',
          padding: '1.5rem',
          marginTop: '2rem',
          textAlign: 'center',
          pageBreakInside: 'avoid',
        }}
      >
        <p style={{ margin: 0, fontSize: '1rem', color: B.ink }}>
          <span style={{ fontWeight: 600 }}>Total Points Possible:</span>{' '}
          <span
            style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: B.seaDeep,
              display: 'inline-block',
              marginLeft: '1rem',
            }}
          >
            {rubric.rubric_categories
              ? rubric.rubric_categories.reduce((sum, cat) => sum + (cat.max_points || 5), 0)
              : 0}
          </span>
        </p>
      </div>
    </div>
  );

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
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          width: '95%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Controls */}
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
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: B.ink }}>
              {rubric.name}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: B.inkMid }}>
              {rubric.rubric_categories?.length || 0} categories
            </p>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {viewMode === 'simple' ? <SimpleView /> : <DetailedView />}
        </div>

        {/* Action Buttons Footer */}
        <div
          style={{
            backgroundColor: B.sandMid,
            borderTop: `1px solid ${B.sandDeep}`,
            padding: '1.5rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          {/* Left side: Share & Download */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!studentView && (
              <>
                <button
                  onClick={handleGenerateShareLink}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: B.seaDeep,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {shareLink ? '✓ Link Copied' : 'Share with Students'}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: B.terra,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    opacity: downloading ? 0.7 : 1,
                  }}
                >
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </button>
              </>
            )}
          </div>

          {/* Right side: Close */}
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

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FDF0E8',
              border: `1px solid ${B.terra}`,
              padding: '0.75rem 1.5rem',
              color: B.terraDark,
              fontSize: '0.9rem',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}