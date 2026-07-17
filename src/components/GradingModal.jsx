import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import InlineCommentLayer from './InlineCommentLayer';

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
 * GradingModal
 *
 * Full grading workflow for a single submission:
 *  - Rubric scoring (point-level selection per category, with descriptors)
 *  - General feedback text
 *  - Inline comments on the submission text (via InlineCommentLayer)
 *  - Visibility / resubmission controls
 *  - Save as draft (isPartial) or submit final grade (notifies student)
 *
 * Props:
 *  - submissionId, assignmentId, studentId (required)
 *  - submissionContent: the story text to grade
 *  - submissionVersion: defaults to 1
 *  - rubricId: optional — if provided, loads that rubric for scoring
 *  - onClose()
 *  - onSaved(feedback): called after a successful save
 */
export default function GradingModal({
  submissionId,
  assignmentId,
  studentId,
  submissionContent,
  submissionVersion = 1,
  rubricId,
  onClose,
  onSaved,
  onNavigate,
  hasPrevious = false,
  hasNext = false,
}) {
  const [token, setToken] = useState(null);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);

  const [feedbackId, setFeedbackId] = useState(null);
  const [rubric, setRubric] = useState(null); // { name, rubric_categories: [...] }
  const [scores, setScores] = useState({}); // { categoryId: points }
  const [categoryNotes, setCategoryNotes] = useState({}); // { categoryId: note }
  const [assignmentConfig, setAssignmentConfig] = useState({
    gradingFormat: 'none',
    maxPoints: null,
    customScale: null,
  });

  const [generalFeedback, setGeneralFeedback] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [letterGrade, setLetterGrade] = useState('');
  const [visibleToStudent, setVisibleToStudent] = useState(false);
  const [requestResubmission, setRequestResubmission] = useState(false);
  const [resubmissionDeadline, setResubmissionDeadline] = useState('');

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('rubric'); // 'rubric' | 'feedback'

  const authHeaders = useCallback(
    (extra = {}) => ({ Authorization: `Bearer ${token}`, ...extra }),
    [token]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Not authenticated');
        if (cancelled) return;
        setToken(session.access_token);
        const authToken = session.access_token;

        // Load the assignment's actual configured grading settings — these
        // are decided once at assignment creation (see AssignModal.jsx) and
        // should drive the grading UI here, not be re-guessed per submission.
        const { data: assignmentRow } = await supabase
          .from('assignments')
          .select('grading_format, grade_max_points, grade_custom_scale, rubric_id')
          .eq('id', assignmentId)
          .maybeSingle();

        if (!cancelled && assignmentRow) {
          setAssignmentConfig({
            gradingFormat: assignmentRow.grading_format || 'none',
            maxPoints: assignmentRow.grade_max_points ?? null,
            customScale: assignmentRow.grade_custom_scale ?? null,
          });
        }

        const resolvedRubricId = rubricId || assignmentRow?.rubric_id;

        // Load rubric definition, if this assignment has one
        if (resolvedRubricId) {
          const rubricRes = await fetch(
            `/api/teacher-features?action=getRubricWithCategories&rubricId=${resolvedRubricId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          const rubricData = await rubricRes.json();
          if (rubricRes.ok) {
            rubricData.rubric_categories = (rubricData.rubric_categories || [])
              .slice()
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            if (!cancelled) setRubric(rubricData);
          }
        }

        // Check for existing feedback (draft or final) on this assignment+student —
        // this is the actual unique key in the DB, and stays correct across
        // resubmissions where submissionId changes but assignment+student doesn't.
        const feedbackRes = await fetch(
          `/api/teacher-features?action=getSubmissionFeedback&assignmentId=${assignmentId}&studentId=${studentId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const feedbackData = await feedbackRes.json();
        const existing = (feedbackData.feedback || [])[0];

        if (existing) {
          if (cancelled) return;
          setFeedbackId(existing.id);
          setGeneralFeedback(existing.general_feedback || '');
          setGradeValue(existing.grade_value ?? '');
          setLetterGrade(existing.letter_grade || '');
          setVisibleToStudent(!!existing.is_visible_to_student);
          setRequestResubmission(!!existing.request_resubmission);
          setResubmissionDeadline(existing.resubmission_deadline || '');
          setCategoryNotes(existing.category_notes || {});
          if (existing.rubric_scores) setScores(existing.rubric_scores);
        } else {
          // No feedback yet — create a partial draft so inline comments have somewhere to attach
          const createRes = await fetch('/api/teacher-features?action=saveFeedback', {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              submissionId,
              assignmentId,
              studentId,
              submissionVersion,
              isPartial: true,
            }),
          });
          const createData = await createRes.json();
          if (!createRes.ok) throw new Error(createData.error || 'Failed to initialize feedback');
          if (!cancelled) setFeedbackId(createData.feedback.id);
        }
      } catch (err) {
        console.error('GradingModal init error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, submissionVersion, rubricId]);

  const handleSelectScore = (categoryId, points) => {
    setScores(prev => ({ ...prev, [categoryId]: points }));
  };

  const handleCategoryNote = (categoryId, note) => {
    setCategoryNotes(prev => ({ ...prev, [categoryId]: note }));
  };

  const rubricMaxScore = rubric
    ? rubric.rubric_categories.reduce((sum, cat) => sum + (cat.max_points || 5), 0)
    : null;

  const totalRubricScore = rubric
    ? rubric.rubric_categories.reduce((sum, cat) => sum + (scores[cat.id] || 0), 0)
    : null;

  const handleSave = async (isPartial) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/teacher-features?action=saveFeedback', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          submissionId,
          assignmentId,
          studentId,
          submissionVersion,
          feedbackText: generalFeedback,
          gradeValue: assignmentConfig.gradingFormat !== 'letter_grade' ? (gradeValue || null) : null,
          letterGrade: assignmentConfig.gradingFormat === 'letter_grade' ? (letterGrade || null) : null,
          visibleToStudent,
          requestResubmission,
          resubmissionDeadline: requestResubmission ? resubmissionDeadline || null : null,
          rubricScores: rubric ? scores : null,
          totalRubricScore: rubric ? totalRubricScore : null,
          rubricMaxScore: rubric ? rubricMaxScore : null,
          categoryNotes: rubric ? categoryNotes : null,
          isPartial,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save feedback');

      if (onSaved) onSaved(data.feedback);
      if (!isPartial && onClose) onClose();
    } catch (err) {
      console.error('saveFeedback error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (initLoading) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: '3rem', textAlign: 'center', color: B.inkMid }}>
          Loading submission...
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div
        style={{
          backgroundColor: B.white,
          borderRadius: '12px',
          width: '95%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: B.sand,
            borderBottom: `1px solid ${B.sandDeep}`,
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: B.ink }}>Grade Submission</h2>
            {rubric && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: B.inkMid }}>
                Rubric: {rubric.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: B.inkMid, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FDF0E8',
              border: `1px solid ${B.terra}`,
              padding: '0.75rem 1.5rem',
              color: B.terraDark,
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Body: split into story/comments panel and grading panel */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: submission text + inline comments */}
          <div
            style={{
              flex: '1 1 55%',
              overflowY: 'auto',
              padding: '1.5rem',
              borderRight: `1px solid ${B.sandDeep}`,
            }}
          >
            <h3 style={{ fontSize: '0.9rem', color: B.inkMid, marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Submission — select text to comment
            </h3>
            {feedbackId && (
              <InlineCommentLayer
                feedbackId={feedbackId}
                submissionVersion={submissionVersion}
                content={submissionContent}
              />
            )}
          </div>

          {/* Right: grading panel */}
          <div style={{ flex: '1 1 45%', overflowY: 'auto', padding: '1.5rem' }}>
            {/* Tabs */}
            {rubric && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <TabButton active={activeTab === 'rubric'} onClick={() => setActiveTab('rubric')}>
                  Rubric
                </TabButton>
                <TabButton active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')}>
                  Feedback
                </TabButton>
              </div>
            )}

            {(!rubric || activeTab === 'rubric') && rubric && (
              <div style={{ marginBottom: '1.5rem' }}>
                {rubric.rubric_categories.map((category) => (
                  <div
                    key={category.id}
                    style={{
                      backgroundColor: B.sand,
                      border: `1px solid ${B.sandDeep}`,
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: B.ink }}>{category.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: B.seaDeep, fontWeight: 700 }}>
                        {scores[category.id] ?? '—'} / {category.max_points || 5}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                      {(category.rubric_criteria_levels || [])
                        .slice()
                        .sort((a, b) => b.points - a.points)
                        .map((level) => {
                          const selected = scores[category.id] === level.points;
                          return (
                            <button
                              key={level.id || level.points}
                              type="button"
                              title={level.descriptor}
                              onClick={() => handleSelectScore(category.id, level.points)}
                              style={{
                                padding: '0.4rem 0.7rem',
                                borderRadius: '6px',
                                border: `1px solid ${selected ? B.seaDeep : B.sandDeep}`,
                                backgroundColor: selected ? B.seaDeep : B.white,
                                color: selected ? '#fff' : B.ink,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {level.label} ({level.points})
                            </button>
                          );
                        })}
                    </div>

                    <textarea
                      value={categoryNotes[category.id] || ''}
                      onChange={(e) => handleCategoryNote(category.id, e.target.value)}
                      placeholder="Optional note for this category..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${B.sandDeep}`,
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                ))}

                <div
                  style={{
                    backgroundColor: B.seaDeep,
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                    {totalRubricScore} / {rubricMaxScore}
                  </div>
                </div>
              </div>
            )}

            {(!rubric || activeTab === 'feedback') && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: B.ink }}>
                  General Feedback
                </label>
                <textarea
                  value={generalFeedback}
                  onChange={(e) => setGeneralFeedback(e.target.value)}
                  placeholder="Overall thoughts on this piece..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${B.sandDeep}`,
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    marginBottom: '1rem',
                    resize: 'vertical',
                  }}
                />

                {assignmentConfig.gradingFormat !== 'none' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: B.ink }}>
                      Grade
                    </label>

                    {assignmentConfig.gradingFormat === 'five_point' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setGradeValue(String(n))}
                            title={['Poor', 'Below Average', 'Average', 'Good', 'Excellent'][n - 1]}
                            style={{
                              flex: 1,
                              padding: '0.6rem',
                              borderRadius: '6px',
                              border: `1px solid ${Number(gradeValue) === n ? B.seaDeep : B.sandDeep}`,
                              backgroundColor: Number(gradeValue) === n ? B.seaDeep : '#fff',
                              color: Number(gradeValue) === n ? '#fff' : B.ink,
                              fontSize: '1.1rem',
                              cursor: 'pointer',
                            }}
                          >
                            {Number(gradeValue) >= n ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                    )}

                    {assignmentConfig.gradingFormat === 'letter_grade' && (
                      <select
                        value={letterGrade}
                        onChange={(e) => setLetterGrade(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          border: `1px solid ${B.sandDeep}`,
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                          appearance: 'none',
                        }}
                      >
                        <option value="">Select a grade...</option>
                        {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    )}

                    {assignmentConfig.gradingFormat === 'points' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min="0"
                          max={assignmentConfig.maxPoints || undefined}
                          value={gradeValue}
                          onChange={(e) => setGradeValue(e.target.value)}
                          placeholder="0"
                          style={{
                            width: '100px',
                            padding: '0.6rem',
                            border: `1px solid ${B.sandDeep}`,
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            boxSizing: 'border-box',
                          }}
                        />
                        <span style={{ fontSize: '0.9rem', color: B.inkMid }}>
                          / {assignmentConfig.maxPoints ?? '—'} points
                        </span>
                      </div>
                    )}

                    {assignmentConfig.gradingFormat === 'custom' && (
                      <select
                        value={gradeValue}
                        onChange={(e) => setGradeValue(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          border: `1px solid ${B.sandDeep}`,
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                          appearance: 'none',
                        }}
                      >
                        <option value="">Select a rating...</option>
                        {(assignmentConfig.customScale || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: B.ink, marginBottom: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={visibleToStudent}
                    onChange={(e) => setVisibleToStudent(e.target.checked)}
                  />
                  Visible to student
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: B.ink, marginBottom: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={requestResubmission}
                    onChange={(e) => setRequestResubmission(e.target.checked)}
                  />
                  Request resubmission
                </label>

                {requestResubmission && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: B.ink }}>
                      Resubmission Deadline
                    </label>
                    <input
                      type="date"
                      value={resubmissionDeadline}
                      onChange={(e) => setResubmissionDeadline(e.target.value)}
                      style={{
                        padding: '0.6rem',
                        border: `1px solid ${B.sandDeep}`,
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${B.sandDeep}`,
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: B.sandMid,
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate(-1)}
                  disabled={!hasPrevious || saving}
                  style={{
                    padding: '0.6rem 1rem',
                    backgroundColor: '#fff',
                    border: `1px solid ${B.sandDeep}`,
                    borderRadius: '6px',
                    cursor: hasPrevious && !saving ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: hasPrevious ? B.ink : B.inkLight,
                    opacity: hasPrevious ? 1 : 0.5,
                  }}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(1)}
                  disabled={!hasNext || saving}
                  style={{
                    padding: '0.6rem 1rem',
                    backgroundColor: '#fff',
                    border: `1px solid ${B.sandDeep}`,
                    borderRadius: '6px',
                    cursor: hasNext && !saving ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: hasNext ? B.ink : B.inkLight,
                    opacity: hasNext ? 1 : 0.5,
                  }}
                >
                  Next →
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '0.7rem 1.4rem',
                backgroundColor: '#fff',
                border: `1px solid ${B.sandDeep}`,
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: B.ink,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{
                padding: '0.7rem 1.4rem',
                backgroundColor: B.sandMid,
                border: `1px solid ${B.sandDeep}`,
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: B.ink,
                opacity: saving ? 0.6 : 1,
              }}
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              style={{
                padding: '0.7rem 1.4rem',
                backgroundColor: B.seaDeep,
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#fff',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Submitting...' : 'Submit Grade'}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }) {
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
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {children}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: active ? B.seaDeep : B.sandMid,
        color: active ? '#fff' : B.ink,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.85rem',
      }}
    >
      {children}
    </button>
  );
}