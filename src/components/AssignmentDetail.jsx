import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import RubricShare from './RubricShare';

/**
 * AssignmentDetail
 * 
 * Displays assignment information including:
 * - Assignment metadata (title, description, due date)
 * - Rubric info (if assigned) with edit button
 * - Rubric sharing & download for teachers
 * - Rubric view button for students
 * - Submissions list
 * - Open TeacherFeedbackModal for grading
 * 
 * Handles:
 * - Rubric cloning (when editing shared rubric)
 * - Soft delete (if rubric is deleted, still shows reference)
 * - Rubric sharing with students
 * - Rubric viewing (modal popup)
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

export default function AssignmentDetail({
  assignment,
  isTeacher = false,
  onEditRubric,
  onSubmissionsRefresh,
}) {
  const [rubricInfo, setRubricInfo] = useState(null);
  const [loadingRubric, setLoadingRubric] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [rubricShareId, setRubricShareId] = useState(null);
  const [showRubricModal, setShowRubricModal] = useState(false);

  // Load rubric info if assignment has rubric_id
  useEffect(() => {
    if (!assignment?.rubric_id) {
      setRubricInfo(null);
      setRubricShareId(null);
      return;
    }

    const fetchRubric = async () => {
      setLoadingRubric(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch rubric details
        const response = await fetch(
          `/api/teacher-features?action=getRubricWithCategories&rubricId=${assignment.rubric_id}`,
          { 
            headers: { 'Authorization': `Bearer ${session.access_token}` } 
          }
        );

        if (!response.ok) throw new Error('Failed to fetch rubric');
        const rubric = await response.json();
        setRubricInfo(rubric);

        // Check if rubric is shared (for students)
        if (!isTeacher) {
          const { data: share } = await supabase
            .from('public_rubric_shares')
            .select('id')
            .eq('rubric_id', assignment.rubric_id)
            .eq('is_active', true)
            .single();

          if (share) {
            setRubricShareId(share.id);
          }
        }
      } catch (err) {
        console.error('Failed to load rubric:', err);
        setRubricInfo(null);
      } finally {
        setLoadingRubric(false);
      }
    };

    fetchRubric();
  }, [assignment?.rubric_id, isTeacher]);

  const handleEditRubric = async () => {
    if (!assignment?.rubric_id) return;

    // Check how many assignments use this rubric
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: assignmentsUsingRubric } = await supabase
        .from('assignments')
        .select('id, title')
        .eq('rubric_id', assignment.rubric_id);

      const count = assignmentsUsingRubric?.length || 0;
      setUsageCount(count);

      if (count > 1) {
        // Show prompt to clone
        setShowEditConfirm(true);
      } else {
        // Safe to edit in place
        if (onEditRubric) {
          onEditRubric(assignment.rubric_id, false); // false = no clone needed
        }
      }
    } catch (err) {
      console.error('Failed to check rubric usage:', err);
    }
  };

  const handleConfirmEdit = async (shouldClone) => {
    setShowEditConfirm(false);

    if (shouldClone) {
      // Clone the rubric
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/teacher-features?action=duplicateRubric', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceRubricId: assignment.rubric_id,
            newName: `${rubricInfo?.name} (Copy)`,
          }),
        });

        if (!response.ok) throw new Error('Failed to clone rubric');
        const newRubric = await response.json();

        // Update assignment to use cloned rubric
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ rubric_id: newRubric.id })
          .eq('id', assignment.id);

        if (updateError) throw updateError;

        // Update local state and open editor
        if (onEditRubric) {
          onEditRubric(newRubric.id, false);
        }
      } catch (err) {
        console.error('Failed to clone rubric:', err);
      }
    } else {
      // Edit in place
      if (onEditRubric) {
        onEditRubric(assignment.rubric_id, false);
      }
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Rubric Modal - for students viewing */}
      {showRubricModal && rubricShareId && (
        <RubricShare 
          shareId={rubricShareId}
          onClose={() => setShowRubricModal(false)}
        />
      )}

      {/* Assignment Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: B.darkBrown,
          marginBottom: '0.5rem',
        }}>
          {assignment?.title || 'Untitled Assignment'}
        </h2>
        
        {assignment?.description && (
          <p style={{
            fontSize: '0.95rem',
            color: B.textMuted,
            lineHeight: '1.6',
            marginBottom: '1rem',
          }}>
            {assignment.description}
          </p>
        )}

        <div style={{
          display: 'flex',
          gap: '2rem',
          fontSize: '0.9rem',
          color: B.taupe,
        }}>
          {assignment?.due_date && (
            <div>
              <span style={{ fontWeight: 600 }}>Due:</span> {new Date(assignment.due_date).toLocaleDateString()}
            </div>
          )}
          {assignment?.genre && (
            <div>
              <span style={{ fontWeight: 600 }}>Genre:</span> {assignment.genre}
            </div>
          )}
          {assignment?.prompt_type && (
            <div>
              <span style={{ fontWeight: 600 }}>Prompt Type:</span> {assignment.prompt_type}
            </div>
          )}
        </div>
      </div>

      {/* RUBRIC INFO CARD - ENHANCED WITH SHARING + VIEW */}
      {assignment?.rubric_id ? (
        <div style={{
          padding: '1rem',
          backgroundColor: B.sand,
          borderRadius: '6px',
          border: `1px solid ${B.borderLight}`,
          marginBottom: '2rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{
                fontWeight: 600,
                fontSize: '0.95rem',
                color: B.darkBrown,
                marginBottom: '0.25rem',
              }}>
                Grading Rubric
              </p>
              {loadingRubric ? (
                <p style={{ fontSize: '0.85rem', color: B.textMuted }}>Loading rubric...</p>
              ) : rubricInfo ? (
                <div>
                  <p style={{
                    fontSize: '0.9rem',
                    color: B.darkBrown,
                    fontWeight: 500,
                    marginBottom: '0.25rem',
                  }}>
                    {rubricInfo.name}
                  </p>
                  {rubricInfo.description && (
                    <p style={{
                      fontSize: '0.8rem',
                      color: B.textMuted,
                      margin: '0.25rem 0',
                    }}>
                      {rubricInfo.description}
                    </p>
                  )}
                  {rubricInfo.rubric_categories && rubricInfo.rubric_categories.length > 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: B.taupe,
                    }}>
                      {rubricInfo.rubric_categories.length} categories
                      {rubricInfo.rubric_categories.some(c => c.max_points) && (
                        <span>
                          {' '}
                          • {rubricInfo.rubric_categories.reduce((sum, c) => sum + (c.max_points || 0), 0)} points total
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: B.textMuted }}>
                  Rubric not found (may have been deleted)
                </p>
              )}
            </div>

            {/* Buttons - Teacher: Edit | Student: View (if shared) */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isTeacher && assignment.status === 'draft' && (
                <button
                  onClick={handleEditRubric}
                  disabled={loadingRubric}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#fff',
                    border: `1px solid ${B.borderLight}`,
                    borderRadius: '4px',
                    cursor: loadingRubric ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: B.brown,
                    whiteSpace: 'nowrap',
                    opacity: loadingRubric ? 0.6 : 1,
                  }}
                >
                  Edit
                </button>
              )}

              {!isTeacher && rubricShareId && (
                <button
                  onClick={() => setShowRubricModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#fff',
                    border: `1px solid ${B.borderLight}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: B.brown,
                    whiteSpace: 'nowrap',
                  }}
                >
                  View Rubric
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          border: `1px dashed ${B.borderLight}`,
          marginBottom: '2rem',
          color: B.textMuted,
          fontSize: '0.9rem',
        }}>
          No rubric assigned (freestyle grading)
        </div>
      )}

      {/* Clone confirmation modal */}
      {showEditConfirm && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: B.darkBrown,
              marginBottom: '1rem',
            }}>
              Rubric is Shared
            </h3>

            <p style={{
              fontSize: '0.95rem',
              color: B.textMuted,
              lineHeight: '1.6',
              marginBottom: '1.5rem',
            }}>
              This rubric is used by <strong>{usageCount} assignments</strong>.
              {' '}
              Would you like to clone it and edit the copy for this assignment only?
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditConfirm(false);
                  handleConfirmEdit(false); // Edit in place
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Edit for All
              </button>
              <button
                onClick={() => {
                  setShowEditConfirm(false);
                  handleConfirmEdit(true); // Clone
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: B.brown,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Clone & Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions section would go here */}
      <div style={{ marginTop: '2rem' }}>
        {/* Add submission list component here */}
      </div>
    </div>
  );
}