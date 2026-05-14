// ============================================================================
// /api/feedback-endpoints.js
// Fictifly Teacher Feedback System - All endpoints in one file
// Routes determined by ?action= query param
// ============================================================================

import { supabase } from '../supabase';

/**
 * Main router - handles all feedback endpoints
 * Usage: /api/feedback-endpoints?action=create (POST)
 *        /api/feedback-endpoints?action=get&feedbackId=ABC (GET)
 *        /api/feedback-endpoints?action=createComment&feedbackId=ABC (POST)
 *        etc.
 */
export default async function handler(req, res) {
  const { method } = req;
  const { action, feedbackId, commentId, assignmentId } = req.query;

  try {
    // Route based on action query parameter
    switch (action) {
      case 'create':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await createFeedback(req, res);

      case 'get':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        req.query.feedbackId = feedbackId;
        return await getFeedback(req, res);

      case 'update':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        req.query.feedbackId = feedbackId;
        return await updateFeedback(req, res);

      case 'delete':
        if (method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
        req.query.feedbackId = feedbackId;
        return await deleteFeedback(req, res);

      case 'getSubmissions':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        req.query.assignmentId = assignmentId;
        return await getAssignmentSubmissions(req, res);

      case 'createComment':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        req.query.feedbackId = feedbackId;
        return await createComment(req, res);

      case 'updateComment':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        req.query.commentId = commentId;
        return await updateComment(req, res);

      case 'deleteComment':
        if (method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
        req.query.commentId = commentId;
        return await deleteComment(req, res);

      case 'createReply':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        req.query.commentId = commentId;
        return await createReply(req, res);

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Valid actions: create, get, update, delete, getSubmissions, createComment, updateComment, deleteComment, createReply' 
        });
    }
  } catch (error) {
    console.error('Feedback endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// ============================================================================
// FEEDBACK HANDLERS
// ============================================================================

/**
 * POST /api/feedback-endpoints?action=create
 * Create feedback (grade + general feedback) for a submission
 */
async function createFeedback(req, res) {
  const {
    assignmentId,
    studentId,
    gradeValue,
    gradeFormat,
    generalFeedback,
    isVisibleToStudent,
    allowReplies,
    maxReplies,
    replyExpirationDays,
  } = req.body;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify teacher owns assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .select('id, class_id')
      .eq('id', assignmentId)
      .single();

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Verify teacher owns class
    const { data: classData } = await supabase
      .from('classes')
      .select('id')
      .eq('id', assignment.class_id)
      .eq('teacher_id', user.id)
      .single();

    if (!classData) return res.status(403).json({ error: 'Not authorized to grade this assignment' });

    // Get user tier for retention date
    const { data: profile } = await supabase
      .from('users')
      .select('account_type, is_premium')
      .eq('id', user.id)
      .single();

    // Calculate retention date
    let retentionDate;
    if (profile.is_premium) {
      retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + 1);
    } else {
      const year = new Date().getFullYear();
      retentionDate = new Date(year, 5, 30); // June 30
      if (new Date() > retentionDate) {
        retentionDate.setFullYear(year + 1);
      }
    }

    // Create or update feedback
    const { data: existingFeedback } = await supabase
      .from('assignment_feedback')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();

    let feedback;
    if (existingFeedback) {
      // Update existing
      const { data: updated, error } = await supabase
        .from('assignment_feedback')
        .update({
          grading_format: gradeFormat,
          grade_value: gradeValue,
          general_feedback: generalFeedback,
          is_visible_to_student: isVisibleToStudent,
          allow_replies: allowReplies,
          max_replies: maxReplies,
          reply_expiration_days: replyExpirationDays,
          retention_date: retentionDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingFeedback.id)
        .select()
        .single();

      if (error) throw error;
      feedback = updated;
    } else {
      // Create new
      const { data: newFeedback, error } = await supabase
        .from('assignment_feedback')
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          teacher_id: user.id,
          grading_format: gradeFormat,
          grade_value: gradeValue,
          general_feedback: generalFeedback,
          is_visible_to_student: isVisibleToStudent,
          allow_replies: allowReplies,
          max_replies: maxReplies,
          reply_expiration_days: replyExpirationDays,
          retention_date: retentionDate.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      feedback = newFeedback;
    }

    res.status(201).json({ feedback });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/feedback-endpoints?action=get&feedbackId=ABC
 * Get full feedback with comments and replies
 */
async function getFeedback(req, res) {
  const { feedbackId } = req.query;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: feedback } = await supabase
      .from('assignment_feedback')
      .select(`
        id,
        assignment_id,
        student_id,
        teacher_id,
        grading_format,
        grade_value,
        general_feedback,
        is_visible_to_student,
        allow_replies,
        max_replies,
        reply_expiration_days,
        feedback_comments (
          id,
          highlighted_text,
          highlighted_start_index,
          highlighted_end_index,
          comment_text,
          created_at,
          updated_at,
          feedback_replies (
            id,
            reply_text,
            replier_id,
            created_at
          )
        )
      `)
      .eq('id', feedbackId)
      .single();

    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    // Check authorization
    const isTeacher = feedback.teacher_id === user.id;
    const isStudent = feedback.student_id === user.id && feedback.is_visible_to_student;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ error: 'Not authorized to view this feedback' });
    }

    res.status(200).json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/feedback-endpoints?action=update&feedbackId=ABC
 * Update feedback (grade, general feedback, visibility)
 */
async function updateFeedback(req, res) {
  const { feedbackId } = req.query;
  const { gradeValue, generalFeedback, isVisibleToStudent } = req.body;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify feedback belongs to teacher
    const { data: feedback } = await supabase
      .from('assignment_feedback')
      .select('id, teacher_id')
      .eq('id', feedbackId)
      .single();

    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    if (feedback.teacher_id !== user.id) return res.status(403).json({ error: 'Not authorized' });

    const { data: updated, error } = await supabase
      .from('assignment_feedback')
      .update({
        grade_value: gradeValue,
        general_feedback: generalFeedback,
        is_visible_to_student: isVisibleToStudent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ feedback: updated });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/feedback-endpoints?action=delete&feedbackId=ABC
 * Delete feedback (soft delete)
 */
async function deleteFeedback(req, res) {
  const { feedbackId } = req.query;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify feedback belongs to teacher
    const { data: feedback } = await supabase
      .from('assignment_feedback')
      .select('id, teacher_id')
      .eq('id', feedbackId)
      .single();

    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    if (feedback.teacher_id !== user.id) return res.status(403).json({ error: 'Not authorized' });

    // Soft delete
    const { error } = await supabase
      .from('assignment_feedback')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', feedbackId);

    if (error) throw error;

    // Log deletion
    await supabase
      .from('feedback_deletion_audit_log')
      .insert({
        feedback_id: feedbackId,
        teacher_id: user.id,
        deleted_by_id: user.id,
        reason: 'manual_deletion',
      });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/feedback-endpoints?action=getSubmissions&assignmentId=ABC
 * Get all submissions for an assignment with their feedback
 */
async function getAssignmentSubmissions(req, res) {
  const { assignmentId } = req.query;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify teacher owns assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .select('id, class_id')
      .eq('id', assignmentId)
      .single();

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Verify teacher owns class
    const { data: classData } = await supabase
      .from('classes')
      .select('id')
      .eq('id', assignment.class_id)
      .eq('teacher_id', user.id)
      .single();

    if (!classData) return res.status(403).json({ error: 'Not authorized' });

    // Get all submissions with feedback
    const { data: submissions } = await supabase
      .from('submissions')
      .select(
        `
        id,
        user_id,
        assignment_id,
        story_text,
        submitted_to_teacher,
        created_at,
        users:user_id ( id, display_name, username ),
        assignment_feedback!left ( id, grade_value, grading_format, general_feedback, is_visible_to_student )
      `
      )
      .eq('assignment_id', assignmentId)
      .eq('submitted_to_teacher', true);

    res.status(200).json({ submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// COMMENT HANDLERS
// ============================================================================

/**
 * POST /api/feedback-endpoints?action=createComment&feedbackId=ABC
 * Create inline comment with highlighting
 */
async function createComment(req, res) {
  const { feedbackId } = req.query;
  const { highlightedText, highlightedStartIndex, highlightedEndIndex, commentText } = req.body;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify feedback belongs to teacher
    const { data: feedback } = await supabase
      .from('assignment_feedback')
      .select('id, teacher_id')
      .eq('id', feedbackId)
      .single();

    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    if (feedback.teacher_id !== user.id) return res.status(403).json({ error: 'Not authorized' });

    // Create comment
    const { data: comment, error } = await supabase
      .from('feedback_comments')
      .insert({
        feedback_id: feedbackId,
        teacher_id: user.id,
        highlighted_text: highlightedText,
        highlighted_start_index: highlightedStartIndex,
        highlighted_end_index: highlightedEndIndex,
        comment_text: commentText,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/feedback-endpoints?action=updateComment&commentId=ABC
 * Update a comment
 */
async function updateComment(req, res) {
  const { commentId } = req.query;
  const { commentText } = req.body;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify comment belongs to teacher
    const { data: comment } = await supabase
      .from('feedback_comments')
      .select('id, teacher_id')
      .eq('id', commentId)
      .single();

    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.teacher_id !== user.id) return res.status(403).json({ error: 'Not authorized' });

    // Update comment
    const { data: updated, error } = await supabase
      .from('feedback_comments')
      .update({ comment_text: commentText, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ comment: updated });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/feedback-endpoints?action=deleteComment&commentId=ABC
 * Delete a comment
 */
async function deleteComment(req, res) {
  const { commentId } = req.query;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify comment belongs to teacher
    const { data: comment } = await supabase
      .from('feedback_comments')
      .select('id, teacher_id')
      .eq('id', commentId)
      .single();

    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.teacher_id !== user.id) return res.status(403).json({ error: 'Not authorized' });

    // Delete comment
    const { error } = await supabase
      .from('feedback_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// REPLY HANDLERS
// ============================================================================

/**
 * POST /api/feedback-endpoints?action=createReply&commentId=ABC
 * Create reply to comment
 */
async function createReply(req, res) {
  const { commentId } = req.query;
  const { replyText } = req.body;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Get comment and check if replies are allowed
    const { data: comment } = await supabase
      .from('feedback_comments')
      .select(`
        id,
        feedback_id,
        feedback:feedback_id ( 
          id, 
          allow_replies, 
          max_replies, 
          reply_expiration_days,
          teacher_id,
          student_id,
          created_at
        )
      `)
      .eq('id', commentId)
      .single();

    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const feedback = comment.feedback;
    if (!feedback.allow_replies) {
      return res.status(403).json({ error: 'Replies are disabled on this feedback' });
    }

    // Check if reply is expired (for students)
    if (user.id === feedback.student_id && feedback.reply_expiration_days) {
      const feedbackCreatedAt = new Date(feedback.created_at);
      const expiryDate = new Date(feedbackCreatedAt);
      expiryDate.setDate(expiryDate.getDate() + feedback.reply_expiration_days);

      if (new Date() > expiryDate) {
        return res.status(403).json({ error: 'Reply period has expired' });
      }
    }

    // Count existing replies (for max_replies check)
    const { data: existingReplies } = await supabase
      .from('feedback_replies')
      .select('id')
      .eq('feedback_comment_id', commentId)
      .eq('replier_id', user.id);

    if (feedback.max_replies && existingReplies.length >= feedback.max_replies) {
      return res.status(403).json({ error: 'You have reached the reply limit for this comment' });
    }

    // Create reply
    const { data: reply, error } = await supabase
      .from('feedback_replies')
      .insert({
        feedback_comment_id: commentId,
        replier_id: user.id,
        reply_text: replyText,
        reply_number: existingReplies.length + 1,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ reply });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ error: error.message });
  }
}