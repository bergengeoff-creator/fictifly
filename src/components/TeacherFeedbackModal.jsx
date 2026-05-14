import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * TeacherFeedbackModal
 * 
 * Google Docs-style feedback interface:
 * - Left: Story text (selectable for highlighting)
 * - Right: Grading panel + comments sidebar
 * 
 * Features:
 * - Highlight text → comment appears
 * - Edit/delete comments
 * - Inline comment display with highlighted text preview
 * - Grade selection based on assignment grading format
 * - General feedback free-text
 * - Visibility toggle
 */

export default function TeacherFeedbackModal({ 
  assignment, 
  submission, 
  onClose, 
  onSubmit 
}) {
  // Story text and highlighting
  const [storyText] = useState(submission.story_text);
  const [selectedText, setSelectedText] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Grade and feedback
  const [gradeValue, setGradeValue] = useState('');
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [isVisibleToStudent, setIsVisibleToStudent] = useState(false);

  // Comments
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const storyRef = useRef(null);

  // Fetch existing feedback/comments on load
  useEffect(() => {
    fetchExistingFeedback();
  }, [submission.id]);

  const fetchExistingFeedback = async () => {
    try {
      setLoadingComments(true);

      // Check if feedback already exists
      const { data: existingFeedback } = await supabase
        .from('assignment_feedback')
        .select(`
          id,
          grade_value,
          general_feedback,
          is_visible_to_student,
          feedback_comments (
            id,
            highlighted_text,
            highlighted_start_index,
            highlighted_end_index,
            comment_text,
            created_at,
            updated_at
          )
        `)
        .eq('assignment_id', assignment.id)
        .eq('student_id', submission.student_id)
        .single();

      if (existingFeedback) {
        setGradeValue(existingFeedback.grade_value || '');
        setGeneralFeedback(existingFeedback.general_feedback || '');
        setIsVisibleToStudent(existingFeedback.is_visible_to_student);
        setComments(existingFeedback.feedback_comments || []);
      }
    } catch (err) {
      // No existing feedback (new)
      console.log('No existing feedback');
    } finally {
      setLoadingComments(false);
    }
  };

  // Handle text selection for highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(storyRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);

      const start = preCaretRange.toString().length - range.toString().length;
      const end = start + range.toString().length;

      setSelectedText(range.toString());
      setSelectionStart(start);
      setSelectionEnd(end);
      setShowCommentBox(true);
    }
  };

  // Add comment to highlighted text
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedText) return;

    try {
      setLoading(true);

      // Get or create feedback record
      let feedbackId;
      const { data: existingFeedback } = await supabase
        .from('assignment_feedback')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('student_id', submission.student_id)
        .single();

      if (existingFeedback) {
        feedbackId = existingFeedback.id;
      } else {
        // Create new feedback record
        const { data: newFeedback } = await supabase
          .from('assignment_feedback')
          .insert({
            assignment_id: assignment.id,
            student_id: submission.student_id,
            teacher_id: (await supabase.auth.getUser()).data.user.id,
            grading_format: assignment.grading_format,
            is_visible_to_student: false,
            allow_replies: assignment.allow_student_replies,
            max_replies: assignment.reply_settings?.max_replies,
            reply_expiration_days: assignment.reply_settings?.expiration_days,
            retention_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          })
          .select('id')
          .single();
        feedbackId = newFeedback.id;
      }

      // Create comment
      const { data: newComment } = await supabase
        .from('feedback_comments')
        .insert({
          feedback_id: feedbackId,
          teacher_id: (await supabase.auth.getUser()).data.user.id,
          highlighted_text: selectedText,
          highlighted_start_index: selectionStart,
          highlighted_end_index: selectionEnd,
          comment_text: commentText,
        })
        .select()
        .single();

      setComments([...comments, newComment]);
      setCommentText('');
      setShowCommentBox(false);
      setSelectedText(null);
    } catch (err) {
      setError(err.message);
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await supabase
        .from('feedback_comments')
        .delete()
        .eq('id', commentId);

      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Submit all feedback
  const handleSubmitFeedback = async () => {
    try {
      setLoading(true);

      const { user } = await supabase.auth.getUser();

      // Get or create feedback
      const { data: existingFeedback } = await supabase
        .from('assignment_feedback')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('student_id', submission.student_id)
        .single();

      if (existingFeedback) {
        // Update existing
        await supabase
          .from('assignment_feedback')
          .update({
            grade_value: gradeValue || null,
            general_feedback: generalFeedback || null,
            is_visible_to_student: isVisibleToStudent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFeedback.id);
      } else {
        // Create new
        await supabase
          .from('assignment_feedback')
          .insert({
            assignment_id: assignment.id,
            student_id: submission.student_id,
            teacher_id: user.user.id,
            grading_format: assignment.grading_format,
            grade_value: gradeValue || null,
            general_feedback: generalFeedback || null,
            is_visible_to_student: isVisibleToStudent,
            allow_replies: assignment.allow_student_replies,
            max_replies: assignment.reply_settings?.max_replies,
            reply_expiration_days: assignment.reply_settings?.expiration_days,
            retention_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          });
      }

      onSubmit?.();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Error submitting feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render grade input based on grading format
  const renderGradeInput = () => {
    switch (assignment.grading_format) {
      case 'five_point':
        return (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase', color: '#9A8878' }}>
              Rating
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setGradeValue(String(rating))}
                  style={{
                    padding: '0.5rem',
                    background: gradeValue === String(rating) ? '#D4845A' : '#F5EFE6',
                    color: gradeValue === String(rating) ? '#FFFCF8' : '#3A3226',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                  }}
                >
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </button>
              ))}
            </div>
          </div>
        );

      case 'letter_grade':
        return (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase', color: '#9A8878' }}>
              Grade
            </label>
            <select
              value={gradeValue}
              onChange={(e) => setGradeValue(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #D9C9B0',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            >
              <option value="">Select grade</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="F">F</option>
            </select>
          </div>
        );

      case 'points':
        return (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase', color: '#9A8878' }}>
              Points
            </label>
            <input
              type="number"
              value={gradeValue}
              onChange={(e) => setGradeValue(e.target.value)}
              min="0"
              max={assignment.grade_max_points}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #D9C9B0',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
              placeholder={`0–${assignment.grade_max_points}`}
            />
          </div>
        );

      case 'custom':
        return (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase', color: '#9A8878' }}>
              Rating
            </label>
            <select
              value={gradeValue}
              onChange={(e) => setGradeValue(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #D9C9B0',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            >
              <option value="">Select rating</option>
              {assignment.grade_custom_scale?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#FFFCF8',
        borderRadius: '14px',
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(58,50,38,0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #D9C9B0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#3A3226' }}>
              Grade Submission: {assignment.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9A8878', margin: '0.25rem 0 0 0' }}>
              Student: {submission.users?.display_name || submission.users?.username}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#9A8878',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '1.5rem',
          flex: 1,
          overflow: 'hidden',
          padding: '1.5rem',
        }}>
          {/* Left: Story Text */}
          <div style={{
            overflow: 'auto',
            paddingRight: '1rem',
          }}>
            <div
              ref={storyRef}
              onMouseUp={handleTextSelection}
              style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: '#3A3226',
                background: '#F5EFE6',
                padding: '1.5rem',
                borderRadius: '10px',
                userSelect: 'text',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {storyText}
            </div>

            {/* Comment box (appears after selection) */}
            {showCommentBox && selectedText && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#EAF4FB',
                borderRadius: '10px',
                border: '1px solid #5B9EC9',
              }}>
                <p style={{ fontSize: '0.8rem', color: '#2E6DA4', marginBottom: '0.5rem' }}>
                  Selected: "{selectedText}"
                </p>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your comment..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.6rem',
                    border: '1px solid #5B9EC9',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'sans-serif',
                    marginBottom: '0.6rem',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={handleAddComment}
                    disabled={loading || !commentText.trim()}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#2E6DA4',
                      color: '#FFFCF8',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Add Comment
                  </button>
                  <button
                    onClick={() => {
                      setShowCommentBox(false);
                      setSelectedText(null);
                      setCommentText('');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      color: '#6B5D4E',
                      border: '1px solid #D9C9B0',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Feedback Panel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflow: 'auto',
            paddingRight: '0.5rem',
          }}>
            {/* Grade section */}
            {assignment.grading_format !== 'none' && (
              <div style={{
                padding: '1rem',
                background: '#F5EFE6',
                borderRadius: '10px',
                borderLeft: '4px solid #D4845A',
              }}>
                {renderGradeInput()}
              </div>
            )}

            {/* Comments section */}
            {comments.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.6rem' }}>
                  Comments ({comments.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflow: 'auto' }}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{
                      padding: '0.75rem',
                      background: '#EAF4FB',
                      borderRadius: '8px',
                      border: '1px solid #5B9EC9',
                      fontSize: '0.85rem',
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#2E6DA4', fontStyle: 'italic', marginBottom: '0.3rem' }}>
                        "{comment.highlighted_text.substring(0, 40)}..."
                      </p>
                      <p style={{ color: '#3A3226', marginBottom: '0.4rem', lineHeight: 1.5 }}>
                        {comment.comment_text}
                      </p>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          fontSize: '0.75rem',
                          color: '#B56840',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General feedback */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.4rem', display: 'block' }}>
                General Feedback
              </label>
              <textarea
                value={generalFeedback}
                onChange={(e) => setGeneralFeedback(e.target.value)}
                placeholder="Add overall feedback..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.6rem',
                  border: '1px solid #D9C9B0',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontFamily: 'sans-serif',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Visibility toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={isVisibleToStudent}
                onChange={(e) => setIsVisibleToStudent(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Student can see this feedback</span>
            </label>

            {/* Error message */}
            {error && (
              <div style={{
                padding: '0.6rem',
                background: '#FDF0E8',
                border: '1px solid #D4845A',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#B56840',
              }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmitFeedback}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                background: '#D4845A',
                color: '#FFFCF8',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}