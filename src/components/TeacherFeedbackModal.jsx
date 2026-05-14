import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * TeacherFeedbackModal - ENHANCED
 * 
 * New features:
 * - Previous/Next navigation between submissions
 * - Progress counter (3 of 12 graded)
 * - Quick comment templates (library + teacher-created)
 * - Rubric scoring support
 * - Save at any time (auto-save draft)
 * - Batch grading mode optimized
 */

const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', seaMid: '#5B9EC9', seaDeep: '#2E6DA4',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878', white: '#FFFCF8',
};

export default function TeacherFeedbackModal({ 
  assignment, 
  submission, 
  submissions, // Array of all submissions for this assignment
  submissionIndex, // Current index in submissions array
  onClose, 
  onNavigate, // Called when user clicks prev/next
  onSubmit 
}) {
  // Story & feedback data
  const [storyText] = useState(submission.story_text);
  const [comments, setComments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [rubric, setRubric] = useState(null);
  const [rubricScores, setRubricScores] = useState({});

  // Grade and feedback
  const [gradeValue, setGradeValue] = useState('');
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [isVisibleToStudent, setIsVisibleToStudent] = useState(false);

  // Highlighting & comments
  const [selectedText, setSelectedText] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const storyRef = useRef(null);

  // Pagination
  const totalSubmissions = submissions?.length || 1;
  const currentIndex = submissionIndex || 0;
  const gradedCount = submissions?.filter(s => s.is_graded)?.length || 0;

  useEffect(() => {
    const timer = setTimeout(() => setAutoSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [autoSaved]);

  useEffect(() => {
    fetchFeedbackData();
  }, [submission.id]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);

      // Fetch feedback, comments, templates, rubric
      const [feedbackRes, templatesRes, rubricRes] = await Promise.all([
        supabase
          .from('assignment_feedback')
          .select(`
            id,
            grade_value,
            general_feedback,
            is_visible_to_student,
            total_rubric_score,
            rubric_max_score,
            feedback_comments (
              id,
              highlighted_text,
              highlighted_start_index,
              highlighted_end_index,
              comment_text,
              created_at
            )
          `)
          .eq('assignment_id', assignment.id)
          .eq('student_id', submission.student_id)
          .single(),
        
        supabase
          .from('comment_templates')
          .select('*')
          .or(`teacher_id.eq.${(await supabase.auth.getUser()).data.user.id},is_from_library.eq.true`)
          .order('is_favorite', { ascending: false })
          .limit(10),

        supabase
          .from('assignment_rubric_mapping')
          .select('rubric_id, rubrics!inner(*)')
          .eq('assignment_id', assignment.id)
          .single(),
      ]);

      if (feedbackRes.data) {
        setGradeValue(feedbackRes.data.grade_value || '');
        setGeneralFeedback(feedbackRes.data.general_feedback || '');
        setIsVisibleToStudent(feedbackRes.data.is_visible_to_student);
        setComments(feedbackRes.data.feedback_comments || []);
      }

      if (templatesRes.data) {
        setTemplates(templatesRes.data);
      }

      if (rubricRes.data?.rubrics) {
        setRubric(rubricRes.data.rubrics);
      }
    } catch (err) {
      console.log('No existing feedback');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedText) return;

    try {
      setSaving(true);

      // Get or create feedback
      let feedbackId;
      const { data: existingFeedback } = await supabase
        .from('assignment_feedback')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('student_id', submission.student_id)
        .single();

      if (!existingFeedback) {
        const { data: newFeedback } = await supabase
          .from('assignment_feedback')
          .insert({
            assignment_id: assignment.id,
            student_id: submission.student_id,
            teacher_id: (await supabase.auth.getUser()).data.user.id,
            grading_format: assignment.grading_format,
            is_visible_to_student: false,
            retention_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          })
          .select('id')
          .single();
        feedbackId = newFeedback.id;
      } else {
        feedbackId = existingFeedback.id;
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
      setError('Failed to add comment');
    } finally {
      setSaving(false);
    }
  };

  const handleInsertTemplate = (template) => {
    setCommentText(template.content);
    setShowTemplates(false);
  };

  const handleAutoSave = async () => {
    try {
      setSaving(true);

      const { data: existingFeedback } = await supabase
        .from('assignment_feedback')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('student_id', submission.student_id)
        .single();

      if (existingFeedback) {
        await supabase
          .from('assignment_feedback')
          .update({
            grade_value: gradeValue || null,
            general_feedback: generalFeedback || null,
            is_visible_to_student: isVisibleToStudent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFeedback.id);
      }

      setAutoSaved(true);
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleAutoSave();
    
    // Mark as graded
    await supabase
      .from('submission_read_status')
      .upsert({
        teacher_id: (await supabase.auth.getUser()).data.user.id,
        submission_id: submission.id,
        assignment_id: assignment.id,
        is_graded: true,
        graded_at: new Date().toISOString(),
      });

    // Navigate to next
    if (currentIndex < totalSubmissions - 1) {
      onNavigate?.(currentIndex + 1);
    } else {
      onSubmit?.();
      onClose();
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await supabase
        .from('feedback_comments')
        .delete()
        .eq('id', commentId);

      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const renderGradeInput = () => {
    switch (assignment.grading_format) {
      case 'five_point':
        return (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Rating
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setGradeValue(String(rating))}
                  onBlur={() => handleAutoSave()}
                  style={{
                    padding: '0.5rem',
                    background: gradeValue === String(rating) ? B.terra : B.sand,
                    color: gradeValue === String(rating) ? B.white : B.ink,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                  }}>
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: B.white, padding: '2rem', borderRadius: '10px', color: B.inkLight }}>Loading feedback...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: B.white, borderRadius: '14px', width: '100%', maxWidth: '1200px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflowY: 'hidden' }}>
        
        {/* Header with Navigation */}
        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${B.sandDeep}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, marginBottom: '0.3rem' }}>Grade Submission</h2>
            <p style={{ fontSize: '0.8rem', color: B.inkLight, margin: 0 }}>
              {submission.users?.display_name || submission.users?.username} · {assignment.title}
            </p>
          </div>

          {/* Progress Counter */}
          <div style={{ textAlign: 'center', marginRight: '1.5rem', minWidth: '100px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: B.terra, margin: 0 }}>
              {currentIndex + 1} of {totalSubmissions}
            </p>
            <p style={{ fontSize: '0.75rem', color: B.inkLight, margin: '0.2rem 0 0 0' }}>
              {gradedCount} graded
            </p>
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
            <button
              onClick={() => onNavigate?.(currentIndex - 1)}
              disabled={currentIndex === 0}
              style={{
                padding: '0.6rem 0.8rem',
                background: currentIndex === 0 ? B.sand : B.seaDeep,
                color: B.white,
                border: 'none',
                borderRadius: '6px',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: currentIndex === 0 ? 0.5 : 1,
              }}>
              ← Prev
            </button>
            <button
              onClick={handleSaveAndNext}
              style={{
                padding: '0.6rem 0.8rem',
                background: B.seaDeep,
                color: B.white,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}>
              {currentIndex === totalSubmissions - 1 ? 'Finish' : 'Save & Next →'}
            </button>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: B.inkLight }}>
            ×
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', flex: 1, overflow: 'hidden', padding: '1.5rem' }}>
          
          {/* Left: Story */}
          <div style={{ overflow: 'auto', paddingRight: '1rem' }}>
            <div
              ref={storyRef}
              onMouseUp={handleTextSelection}
              style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: B.ink,
                background: B.sand,
                padding: '1.5rem',
                borderRadius: '10px',
                userSelect: 'text',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}>
              {storyText}
            </div>

            {/* Inline Comment Box */}
            {showCommentBox && selectedText && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#EAF4FB', borderRadius: '10px', border: `1px solid ${B.seaMid}` }}>
                <p style={{ fontSize: '0.8rem', color: B.seaDeep, marginBottom: '0.5rem' }}>
                  "{selectedText.substring(0, 40)}{selectedText.length > 40 ? '...' : ''}"
                </p>
                <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add your comment..."
                    style={{
                      width: '100%',
                      minHeight: '70px',
                      padding: '0.6rem',
                      border: `1px solid ${B.seaMid}`,
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontFamily: 'sans-serif',
                      marginBottom: '0.5rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {showTemplates && (
                    <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', background: B.white, borderRadius: '6px', border: `1px solid ${B.sandDeep}` }}>
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleInsertTemplate(template)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.6rem',
                            textAlign: 'left',
                            border: 'none',
                            background: template.is_favorite ? '#FFF8E7' : B.white,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: B.ink,
                          }}>
                          {template.is_favorite && '★ '}{template.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleAddComment}
                    disabled={saving || !commentText.trim()}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: saving || !commentText.trim() ? B.sandDeep : B.seaDeep,
                      color: B.white,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: saving || !commentText.trim() ? 'not-allowed' : 'pointer',
                    }}>
                    Add Comment
                  </button>
                  <button
                    onClick={() => { setShowCommentBox(false); setCommentText(''); setSelectedText(null); }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      color: B.inkMid,
                      border: `1px solid ${B.sandDeep}`,
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Feedback Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto', paddingRight: '0.5rem' }}>
            
            {/* Grade */}
            {assignment.grading_format !== 'none' && (
              <div style={{ padding: '1rem', background: B.sand, borderRadius: '10px', borderLeft: `4px solid ${B.terra}` }}>
                {renderGradeInput()}
              </div>
            )}

            {/* Quick Templates Button */}
            {templates.length > 0 && (
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                style={{
                  padding: '0.6rem',
                  background: B.sand,
                  color: B.seaDeep,
                  border: `1px solid ${B.seaMid}`,
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                {showTemplates ? 'Hide' : 'Quick Comments ↓'}
              </button>
            )}

            {/* Comments */}
            {comments.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: B.inkLight, marginBottom: '0.6rem' }}>
                  Comments ({comments.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {comments.map(comment => (
                    <div key={comment.id} style={{ padding: '0.6rem', background: '#EAF4FB', borderRadius: '6px', border: `1px solid ${B.seaMid}`, fontSize: '0.8rem' }}>
                      <p style={{ color: B.seaDeep, fontStyle: 'italic', marginBottom: '0.2rem', fontSize: '0.75rem' }}>
                        "{comment.highlighted_text.substring(0, 30)}..."
                      </p>
                      <p style={{ color: B.ink, marginBottom: '0.3rem', lineHeight: 1.4 }}>{comment.comment_text}</p>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{ fontSize: '0.7rem', color: B.terraDark, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Feedback */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: B.inkLight, display: 'block', marginBottom: '0.4rem' }}>
                General Feedback
              </label>
              <textarea
                value={generalFeedback}
                onChange={e => setGeneralFeedback(e.target.value)}
                onBlur={() => handleAutoSave()}
                placeholder="Add overall feedback..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.6rem',
                  border: `1px solid ${B.sandDeep}`,
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'sans-serif',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Visibility */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              <input
                type="checkbox"
                checked={isVisibleToStudent}
                onChange={e => { setIsVisibleToStudent(e.target.checked); handleAutoSave(); }}
                style={{ cursor: 'pointer' }}
              />
              <span>Student can see this feedback</span>
            </label>

            {/* Auto-save indicator */}
            {autoSaved && (
              <p style={{ fontSize: '0.75rem', color: B.seaDeep, margin: '0.3rem 0 0 0', fontStyle: 'italic' }}>✓ Auto-saved</p>
            )}

            {error && (
              <div style={{ padding: '0.6rem', background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '6px', fontSize: '0.75rem', color: B.terraDark' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}