import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * TeacherFeedbackModal
 * 
 * Modal for teachers to provide feedback on student submissions.
 * 
 * Features:
 * - Load assignment's rubric (if exists) with categories for scoring
 * - Enter feedback text + brief summary
 * - Set resubmission deadline
 * - Quick comment templates
 * - Auto-save feedback
 * - Previous/Next navigation between submissions
 * - Mark as graded
 * - Rubric category scoring
 * 
 * Auth: Uses Bearer token for API calls
 */

const B = {
  sand: '#F5F1ED',
  taupe: '#9A8878',
  brown: '#8B6F47',
  darkBrown: '#5C4A36',
  cream: '#FFFBF7',
  borderLight: '#E8DDD3',
  textMuted: '#666',
};

export default function TeacherFeedbackModal({
  submission,
  assignment,
  onClose,
  onSave,
  onNavigate,
  showPrevious,
  showNext,
}) {
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [grade, setGrade] = useState('');
  const [rubricScores, setRubricScores] = useState({});
  const [resubmissionDeadline, setResubmissionDeadline] = useState('');
  const [requestResubmission, setRequestResubmission] = useState(false);
  const [visibleToStudent, setVisibleToStudent] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentRubric, setCurrentRubric] = useState(null);
  const [rubricCategories, setRubricCategories] = useState([]);
  const [commentTemplates, setCommentTemplates] = useState([]);

  // Load existing feedback if available
  useEffect(() => {
    if (!submission) return;

    const loadFeedback = async () => {
      setLoading(true);
      try {
        const { data: feedback } = await supabase
          .from('assignment_feedback')
          .select('*')
          .eq('submission_id', submission.id)
          .single();

        if (feedback) {
          setFeedbackText(feedback.feedback_text || '');
          setFeedbackSummary(feedback.feedback_summary || '');
          setGrade(feedback.grade || '');
          setVisibleToStudent(feedback.visible_to_student !== false);
          setRequestResubmission(feedback.request_resubmission || false);
          
          if (feedback.resubmission_deadline) {
            setResubmissionDeadline(feedback.resubmission_deadline.split('T')[0]);
          }

          // Load rubric scores if rubric exists
          if (assignment?.rubric_id && feedback.rubric_scores) {
            setRubricScores(feedback.rubric_scores);
          }
        }
      } catch (err) {
        console.error('Failed to load feedback:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [submission?.id, assignment?.rubric_id]);

  // Load rubric categories if assignment has rubric
  useEffect(() => {
    if (!assignment?.rubric_id) {
      setCurrentRubric(null);
      setRubricCategories([]);
      return;
    }

    const fetchRubric = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `/api/teacher-features?action=getRubricWithCategories&rubricId=${assignment.rubric_id}`,
          { 
            headers: { 'Authorization': `Bearer ${session?.access_token}` } 
          }
        );

        if (!response.ok) throw new Error('Failed to fetch rubric');
        const rubric = await response.json();
        setCurrentRubric(rubric);
        setRubricCategories(rubric.categories || []);
      } catch (err) {
        console.error('Failed to load rubric:', err);
      }
    };

    fetchRubric();
  }, [assignment?.rubric_id]);

  // Load comment templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/teacher-features?action=getTemplates', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch templates');
        const templates = await response.json();
        setCommentTemplates(Array.isArray(templates) ? templates : []);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setCommentTemplates([]);
      }
    };

    fetchTemplates();
  }, []);

  const handleRubricCategoryScore = (categoryId, score) => {
    setRubricScores({
      ...rubricScores,
      [categoryId]: score,
    });
  };

  const handleInsertTemplate = (templateText) => {
    const newText = feedbackText + (feedbackText ? '\n\n' : '') + templateText;
    setFeedbackText(newText);
  };

  const handleSaveFeedback = async () => {
    if (!submission || !assignment) {
      setError('Missing submission or assignment data');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Calculate total rubric score if categories exist
      let totalRubricScore = null;
      let rubricMaxScore = null;

      if (Object.keys(rubricScores).length > 0 && rubricCategories.length > 0) {
        totalRubricScore = Object.values(rubricScores).reduce((sum, s) => sum + (s || 0), 0);
        rubricMaxScore = rubricCategories.reduce((sum, c) => sum + (c.max_points || 0), 0);
      }

      // Prepare feedback data
      const feedbackData = {
        submission_id: submission.id,
        assignment_id: assignment.id,
        teacher_id: session.user.id,
        feedback_text: feedbackText || null,
        feedback_summary: feedbackSummary || null,
        grade: grade || null,
        visible_to_student: visibleToStudent,
        request_resubmission: requestResubmission,
        resubmission_deadline: requestResubmission && resubmissionDeadline ? `${resubmissionDeadline}T23:59:59Z` : null,
        rubric_scores: Object.keys(rubricScores).length > 0 ? rubricScores : null,
        total_rubric_score: totalRubricScore,
        rubric_max_score: rubricMaxScore,
      };

      // Check if feedback already exists
      const { data: existingFeedback } = await supabase
        .from('assignment_feedback')
        .select('id')
        .eq('submission_id', submission.id)
        .single();

      let result;
      if (existingFeedback) {
        // Update existing
        const { data, error: updateError } = await supabase
          .from('assignment_feedback')
          .update(feedbackData)
          .eq('id', existingFeedback.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Create new
        const { data, error: insertError } = await supabase
          .from('assignment_feedback')
          .insert([feedbackData])
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      // Callback
      if (onSave) {
        onSave(result);
      }

      // Close modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error saving feedback:', err);
      setError(err.message || 'Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 999,
    }}>
      <div style={{
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${B.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: B.darkBrown,
              margin: '0 0 0.25rem 0',
            }}>
              Feedback: {submission?.student_name || 'Student'}
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: B.textMuted,
              margin: 0,
            }}>
              {assignment?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef5f5',
              border: '1px solid #f5d7d7',
              borderRadius: '4px',
              color: '#c41e3a',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Story Preview */}
          <div style={{
            padding: '1rem',
            backgroundColor: B.sand,
            borderRadius: '6px',
            marginBottom: '1.5rem',
            maxHeight: '200px',
            overflowY: 'auto',
            borderLeft: `4px solid ${B.brown}`,
          }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: B.darkBrown, margin: '0 0 0.5rem 0' }}>
              Student Story
            </p>
            <p style={{
              fontSize: '0.9rem',
              color: B.darkBrown,
              lineHeight: '1.6',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {submission?.story_text || '(No text provided)'}
            </p>
          </div>

          {/* RUBRIC SCORING */}
          {currentRubric && rubricCategories.length > 0 && (
            <div style={{
              padding: '1rem',
              backgroundColor: B.sand,
              borderRadius: '6px',
              marginBottom: '1.5rem',
              border: `1px solid ${B.borderLight}`,
            }}>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: B.darkBrown,
                marginTop: 0,
                marginBottom: '1rem',
              }}>
                📋 Rubric Scoring: {currentRubric.name}
              </h4>

              {rubricCategories.map((category) => (
                <div key={category.id} style={{
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: `1px solid ${B.borderLight}`,
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: B.darkBrown,
                    marginBottom: '0.5rem',
                  }}>
                    {category.name}
                    {category.max_points && ` (0–${category.max_points})`}
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={category.max_points || undefined}
                    value={rubricScores[category.id] || ''}
                    onChange={(e) => handleRubricCategoryScore(category.id, parseInt(e.target.value) || 0)}
                    placeholder={`0 to ${category.max_points || 'N/A'}`}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: `1px solid ${B.borderLight}`,
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem',
                    }}
                  />

                  {category.description && (
                    <p style={{
                      fontSize: '0.8rem',
                      color: B.textMuted,
                      margin: 0,
                      fontStyle: 'italic',
                    }}>
                      {category.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Feedback Text */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: B.darkBrown,
              marginBottom: '0.5rem',
            }}>
              Feedback
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type feedback here..."
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${B.borderLight}`,
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Feedback Summary (Brief) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: B.darkBrown,
              marginBottom: '0.5rem',
            }}>
              Quick Summary (for feedback timeline)
            </label>
            <input
              type="text"
              value={feedbackSummary}
              onChange={(e) => setFeedbackSummary(e.target.value)}
              placeholder="e.g., Strong dialogue, work on pacing"
              maxLength={150}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${B.borderLight}`,
                borderRadius: '4px',
                fontSize: '0.9rem',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: B.textMuted, margin: '0.25rem 0 0 0' }}>
              {feedbackSummary.length}/150 characters
            </p>
          </div>

          {/* Quick Comment Templates */}
          {commentTemplates.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: B.darkBrown,
                marginBottom: '0.5rem',
              }}>
                Quick Templates
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                {commentTemplates.slice(0, 5).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleInsertTemplate(template.content)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f0f0f0',
                      border: `1px solid ${B.borderLight}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = B.brown;
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                      e.target.style.color = '#000';
                    }}
                  >
                    + {template.name.substring(0, 20)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grade */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: B.darkBrown,
              marginBottom: '0.5rem',
            }}>
              Overall Grade (Optional)
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g., A, 9/10, Excellent"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${B.borderLight}`,
                borderRadius: '4px',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* RESUBMISSION DEADLINE */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: `1px solid ${B.borderLight}`,
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: B.darkBrown,
              marginBottom: '0.75rem',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={requestResubmission}
                onChange={(e) => setRequestResubmission(e.target.checked)}
                style={{ marginRight: '0.5rem', cursor: 'pointer' }}
              />
              Request Resubmission
            </label>

            {requestResubmission && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: B.darkBrown,
                  marginBottom: '0.5rem',
                }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={resubmissionDeadline}
                  onChange={(e) => setResubmissionDeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: `1px solid ${B.borderLight}`,
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            )}
          </div>

          {/* Visibility */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: B.darkBrown,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={visibleToStudent}
                onChange={(e) => setVisibleToStudent(e.target.checked)}
                style={{ marginRight: '0.5rem', cursor: 'pointer' }}
              />
              Visible to Student
            </label>
          </div>
        </div>

        {/* Footer/Actions */}
        <div style={{
          padding: '1.5rem',
          borderTop: `1px solid ${B.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: B.sand,
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {showPrevious && (
              <button
                onClick={() => onNavigate?.(-1)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ← Previous
              </button>
            )}
            {showNext && (
              <button
                onClick={() => onNavigate?.(1)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Next →
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFeedback}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: B.brown,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}