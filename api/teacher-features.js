// ============================================================================
// /api/teacher-features.js
// Teacher Quality-of-Life Features API
// Handles: comment templates, rubrics, batch grading, submission tracking
// Phase 1.5: Added rubric cloning, soft delete, resubmission deadline, feedback summary
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to extract user from Authorization header
async function getUserFromToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const { action } = req.query;

  try {
    switch (action) {
      // ========== COMMENT TEMPLATES ==========
      case 'getTemplates':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getCommentTemplates(req, res);

      case 'createTemplate':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await createCommentTemplate(req, res);

      case 'updateTemplate':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await updateCommentTemplate(req, res);

      case 'deleteTemplate':
        if (method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
        return await deleteCommentTemplate(req, res);

      case 'toggleFavorite':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await toggleTemplateFavorite(req, res);

      // ========== RUBRICS ==========
      case 'getRubrics':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getRubrics(req, res);

        case 'createRubric':
        return await createRubric(req, res);
      case 'getRubricByShare':
        return await getRubricByShare(req, res);

      case 'updateRubric':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await updateRubric(req, res);

      case 'deleteRubric':
        if (method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
        return await deleteRubric(req, res);

      case 'duplicateRubric':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await duplicateRubric(req, res);

      case 'getRubricWithCategories':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getRubricWithCategories(req, res);

      case 'checkRubricUsage':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await checkRubricUsage(req, res);

      // ========== RUBRIC CATEGORIES ==========
      case 'addRubricCategory':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await addRubricCategory(req, res);

      case 'updateRubricCategory':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await updateRubricCategory(req, res);

      case 'deleteRubricCategory':
        if (method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
        return await deleteRubricCategory(req, res);

      // ========== SUBMISSION TRACKING ==========
      case 'getSubmissionStatus':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getSubmissionStatus(req, res);

      case 'updateSubmissionStatus':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await updateSubmissionStatus(req, res);

      case 'recordSubmissionView':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await recordSubmissionView(req, res);

      // ========== BATCH GRADING ==========
      case 'createBatchSession':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await createBatchSession(req, res);

      case 'completeBatchSession':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await completeBatchSession(req, res);

      // ========== ASSIGNMENTS (Phase 1.5) ==========
      case 'createAssignment':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await createAssignment(req, res);

      case 'updateAssignmentRubric':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await updateAssignmentRubric(req, res);

      // ========== FEEDBACK (Phase 1.5) ==========
    case 'saveFeedback':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await saveFeedback(req, res);

      // ── INLINE COMMENTS ──
      case 'getInlineComments':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getInlineComments(req, res);
      case 'addInlineComment':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await addInlineComment(req, res);
      case 'updateInlineComment':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await updateInlineComment(req, res);
      case 'deleteInlineComment':
        if (method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
        return await deleteInlineComment(req, res);
      case 'replyToComment':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await replyToComment(req, res);

      // ── RESUBMISSION ──
      case 'resubmit':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await resubmit(req, res);

      // ── NOTIFICATIONS ──
      case 'getNotifications':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getNotifications(req, res);
      case 'markNotificationRead':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await markNotificationRead(req, res);
      case 'markAllNotificationsRead':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await markAllNotificationsRead(req, res);

      // ── COMMUNITY RUBRICS ──
      case 'getCommunityRubrics':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getCommunityRubrics(req, res);
      case 'publishRubricToCommunity':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await publishRubricToCommunity(req, res);
      case 'rateRubric':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await rateRubric(req, res);

      // ── STUDENT FEEDBACK ──
      case 'getSubmissionFeedback':
        if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await getSubmissionFeedback(req, res);

        // ============================================================================
// INLINE COMMENTS
// ============================================================================

async function getInlineComments(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { feedbackId, submissionVersion } = req.query;
  if (!feedbackId) return res.status(400).json({ error: 'feedbackId is required' });

  try {
    let query = supabaseAdmin
      .from('feedback_comments')
      .select(`
        *,
        feedback_replies (*)
      `)
      .eq('feedback_id', feedbackId)
      .eq('is_archived', false)
      .order('highlighted_start_index', { ascending: true });

    if (submissionVersion) {
      query = query.eq('submission_version', parseInt(submissionVersion));
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ comments: data || [] });
  } catch (err) {
    console.error('getInlineComments error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function addInlineComment(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    feedbackId,
    submissionVersion,
    highlightedText,
    startIndex,
    endIndex,
    commentText,
  } = req.body;

  if (!feedbackId || !highlightedText || startIndex == null || endIndex == null || !commentText) {
    return res.status(400).json({ error: 'feedbackId, highlightedText, startIndex, endIndex, and commentText are required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('feedback_comments')
      .insert([{
        feedback_id: feedbackId,
        teacher_id: user.id,
        highlighted_text: highlightedText,
        highlighted_start_index: startIndex,
        highlighted_end_index: endIndex,
        comment_text: commentText,
        submission_version: submissionVersion || 1,
        comment_type: 'inline',
        is_archived: false,
        is_resolved: false,
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ comment: data });
  } catch (err) {
    console.error('addInlineComment error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateInlineComment(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { commentId, commentText, isResolved } = req.body;
  if (!commentId) return res.status(400).json({ error: 'commentId is required' });

  try {
    // Verify teacher owns this comment
    const { data: existing } = await supabaseAdmin
      .from('feedback_comments')
      .select('teacher_id')
      .eq('id', commentId)
      .maybeSingle();

    if (!existing || existing.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this comment' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (commentText !== undefined) updates.comment_text = commentText;
    if (isResolved !== undefined) {
      updates.is_resolved = isResolved;
      updates.resolved_at = isResolved ? new Date().toISOString() : null;
    }

    const { data, error } = await supabaseAdmin
      .from('feedback_comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ comment: data });
  } catch (err) {
    console.error('updateInlineComment error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function deleteInlineComment(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { commentId } = req.body;
  if (!commentId) return res.status(400).json({ error: 'commentId is required' });

  try {
    // Verify teacher owns this comment
    const { data: existing } = await supabaseAdmin
      .from('feedback_comments')
      .select('teacher_id')
      .eq('id', commentId)
      .maybeSingle();

    if (!existing || existing.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Soft delete — archive rather than hard delete
    const { error } = await supabaseAdmin
      .from('feedback_comments')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', commentId);

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('deleteInlineComment error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function replyToComment(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { commentId, replyText } = req.body;
  if (!commentId || !replyText) {
    return res.status(400).json({ error: 'commentId and replyText are required' });
  }

  try {
    // Check existing reply count for this user on this comment
    const { data: existingReplies } = await supabaseAdmin
      .from('feedback_replies')
      .select('id, reply_number')
      .eq('feedback_comment_id', commentId)
      .eq('replier_id', user.id)
      .order('reply_number', { ascending: false });

    const replyCount = existingReplies ? existingReplies.length : 0;

    // Check max replies allowed (students get 1)
    const { data: comment } = await supabaseAdmin
      .from('feedback_comments')
      .select('feedback_id')
      .eq('id', commentId)
      .maybeSingle();

    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Get allow_replies setting from feedback
    const { data: feedback } = await supabaseAdmin
      .from('assignment_feedback')
      .select('allow_replies, max_replies')
      .eq('id', comment.feedback_id)
      .maybeSingle();

    const maxReplies = feedback?.max_replies || 1;
    if (replyCount >= maxReplies) {
      return res.status(403).json({ error: `Maximum of ${maxReplies} reply allowed per comment` });
    }

    const { data, error } = await supabaseAdmin
      .from('feedback_replies')
      .insert([{
        feedback_comment_id: commentId,
        replier_id: user.id,
        reply_text: replyText,
        reply_number: replyCount + 1,
        is_from_student: true,
      }])
      .select()
      .single();

    if (error) throw error;

    // Notify teacher of student reply
    if (feedback) {
      const { data: feedbackFull } = await supabaseAdmin
        .from('assignment_feedback')
        .select('teacher_id')
        .eq('id', comment.feedback_id)
        .maybeSingle();

      if (feedbackFull?.teacher_id) {
        await supabaseAdmin
          .from('notifications')
          .insert([{
            user_id: feedbackFull.teacher_id,
            type: 'reply_received',
            title: 'A student replied to your comment',
            body: replyText.substring(0, 100),
            related_id: commentId,
            related_type: 'comment',
            action_url: '/classroom',
          }]);
      }
    }

    return res.status(201).json({ reply: data });
  } catch (err) {
    console.error('replyToComment error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// RESUBMISSION
// ============================================================================

async function resubmit(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { submissionId, content, wordCount } = req.body;
  if (!submissionId || !content) {
    return res.status(400).json({ error: 'submissionId and content are required' });
  }

  try {
    // Get original submission
    const { data: original, error: origError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (origError || !original) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check resubmission is allowed
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('allow_resubmission, max_resubmissions')
      .eq('id', original.assignment_id)
      .maybeSingle();

    if (!assignment?.allow_resubmission) {
      return res.status(403).json({ error: 'Resubmission not allowed for this assignment' });
    }

    // Count existing versions
    const { count: versionCount } = await supabaseAdmin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('parent_submission_id', original.id);

    const currentVersion = (versionCount || 0) + 1;

    if (assignment.max_resubmissions && currentVersion > assignment.max_resubmissions) {
      return res.status(403).json({ error: `Maximum resubmissions (${assignment.max_resubmissions}) reached` });
    }

    // Mark original as no longer current
    await supabaseAdmin
      .from('submissions')
      .update({ is_current: false })
      .eq('id', submissionId);

    // Archive comments from original version
    await supabaseAdmin
      .from('feedback_comments')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('feedback_id', submissionId)
      .eq('submission_version', original.version || 1);

    // Create new submission version
    const { data: newSubmission, error: newError } = await supabaseAdmin
      .from('submissions')
      .insert([{
        user_id: user.id,
        assignment_id: original.assignment_id,
        prompt_id: original.prompt_id,
        content,
        word_count: wordCount || original.word_count,
        prompt_type: original.prompt_type,
        genre: original.genre,
        sharing: original.sharing,
        submitted_to_teacher: true,
        daily_prompt_id: original.daily_prompt_id,
        version: (original.version || 1) + 1,
        is_current: true,
        parent_submission_id: submissionId,
        submission_version: (original.version || 1) + 1,
      }])
      .select()
      .single();

    if (newError) throw newError;

    // Notify teacher of resubmission
    const { data: assignment_full } = await supabaseAdmin
      .from('assignments')
      .select('teacher_id, title')
      .eq('id', original.assignment_id)
      .maybeSingle();

    if (assignment_full?.teacher_id) {
      await supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: assignment_full.teacher_id,
          type: 'resubmission_received',
          title: 'A student resubmitted their story',
          body: `New version submitted for "${assignment_full.title}"`,
          related_id: newSubmission.id,
          related_type: 'submission',
          action_url: '/classroom',
        }]);
    }

    return res.status(201).json({ submission: newSubmission });
  } catch (err) {
    console.error('resubmit error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

async function getNotifications(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { unreadOnly, limit } = req.query;

  try {
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) || 20);

    if (unreadOnly === 'true') {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    const unreadCount = (data || []).filter(n => !n.read).length;
    return res.status(200).json({ notifications: data || [], unreadCount });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function markNotificationRead(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { notificationId } = req.body;
  if (!notificationId) return res.status(400).json({ error: 'notificationId is required' });

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('markNotificationRead error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function markAllNotificationsRead(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('markAllNotificationsRead error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// STUDENT FEEDBACK VIEW
// ============================================================================

async function getSubmissionFeedback(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { submissionId, assignmentId } = req.query;
  if (!submissionId && !assignmentId) {
    return res.status(400).json({ error: 'submissionId or assignmentId is required' });
  }

  try {
    let feedbackQuery = supabaseAdmin
      .from('assignment_feedback')
      .select('*')
      .eq('is_deleted', false);

    if (submissionId) {
      feedbackQuery = feedbackQuery.eq('submission_id', submissionId);
    } else {
      feedbackQuery = feedbackQuery
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id);
    }

    const { data: feedbackList, error: fbError } = await feedbackQuery;
    if (fbError) throw fbError;

    // Fetch comments + replies for each feedback
    const enriched = await Promise.all((feedbackList || []).map(async fb => {
      const { data: comments } = await supabaseAdmin
        .from('feedback_comments')
        .select(`*, feedback_replies(*)`)
        .eq('feedback_id', fb.id)
        .eq('is_archived', false)
        .order('highlighted_start_index', { ascending: true });

      // Fetch rubric scores
      const { data: scores } = await supabaseAdmin
        .from('rubric_scores')
        .select(`*, rubric_categories(name, max_points, description)`)
        .eq('feedback_id', fb.id)
        .eq('submission_version', fb.submission_version || 1);

      return { ...fb, comments: comments || [], rubric_scores: scores || [] };
    }));

    // Mark as viewed by student
    if (enriched.length > 0) {
      await supabaseAdmin
        .from('submission_read_status')
        .upsert({
          teacher_id: enriched[0].teacher_id,
          submission_id: submissionId || enriched[0].submission_id,
          assignment_id: assignmentId || enriched[0].assignment_id,
          student_viewed_feedback_at: new Date().toISOString(),
        }, { onConflict: 'teacher_id,submission_id' });
    }

    return res.status(200).json({ feedback: enriched });
  } catch (err) {
    console.error('getSubmissionFeedback error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// COMMUNITY RUBRICS
// ============================================================================

async function getCommunityRubrics(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { subject, gradeLevel, search, sortBy, limit, offset } = req.query;

  try {
    let query = supabaseAdmin
      .from('rubrics')
      .select(`
        id, name, description, subject, grade_level, tags,
        usage_count, rating_avg, rating_count, share_count,
        teacher_id, created_at, community_published_at
      `)
      .eq('is_community', true)
      .eq('community_status', 'published')
      .eq('is_deleted', false)
      .limit(parseInt(limit) || 20)
      .range(parseInt(offset) || 0, (parseInt(offset) || 0) + (parseInt(limit) || 20) - 1);

    if (subject) query = query.eq('subject', subject);
    if (gradeLevel) query = query.eq('grade_level', gradeLevel);
    if (search) query = query.ilike('name', `%${search}%`);

    if (sortBy === 'rating') query = query.order('rating_avg', { ascending: false });
    else if (sortBy === 'usage') query = query.order('usage_count', { ascending: false });
    else query = query.order('community_published_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ rubrics: data || [] });
  } catch (err) {
    console.error('getCommunityRubrics error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function publishRubricToCommunity(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId, subject, gradeLevel, tags } = req.body;
  if (!rubricId) return res.status(400).json({ error: 'rubricId is required' });

  try {
    // Verify teacher owns this rubric
    const { data: rubric } = await supabaseAdmin
      .from('rubrics')
      .select('teacher_id, name')
      .eq('id', rubricId)
      .maybeSingle();

    if (!rubric || rubric.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized to publish this rubric' });
    }

    const { data, error } = await supabaseAdmin
      .from('rubrics')
      .update({
        is_community: true,
        community_status: 'published',
        community_published_at: new Date().toISOString(),
        subject: subject || null,
        grade_level: gradeLevel || null,
        tags: tags || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', rubricId)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ rubric: data });
  } catch (err) {
    console.error('publishRubricToCommunity error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function rateRubric(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId, rating, review } = req.body;
  if (!rubricId || !rating) {
    return res.status(400).json({ error: 'rubricId and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Upsert rating
    const { error: ratingError } = await supabaseAdmin
      .from('rubric_ratings')
      .upsert({
        rubric_id: rubricId,
        teacher_id: user.id,
        rating,
        review: review || null,
      }, { onConflict: 'rubric_id,teacher_id' });

    if (ratingError) throw ratingError;

    // Recalculate average
    const { data: ratings } = await supabaseAdmin
      .from('rubric_ratings')
      .select('rating')
      .eq('rubric_id', rubricId);

    const avg = ratings
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 100) / 100
      : rating;

    await supabaseAdmin
      .from('rubrics')
      .update({
        rating_avg: avg,
        rating_count: ratings ? ratings.length : 1,
      })
      .eq('id', rubricId);

    return res.status(200).json({ success: true, newAverage: avg });
  } catch (err) {
    console.error('rateRubric error:', err);
    return res.status(500).json({ error: err.message });
  }
}

      // ========== PEER REVIEW SETTINGS (Phase 2) ==========
      case 'createPeerReviewSettings':
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await createPeerReviewSettings(req, res);

      case 'updatePeerReviewSettings':
        if (method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
        return await updatePeerReviewSettings(req, res);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Teacher features error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// COMMENT TEMPLATES
// ============================================================================

async function getCommentTemplates(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Fetch teacher's own templates
    const { data: ownTemplates, error: ownError } = await supabaseAdmin
      .from('comment_templates')
      .select('*')
      .eq('teacher_id', user.id)
      .order('is_favorite', { ascending: false })
      .order('usage_count', { ascending: false });

    if (ownError) throw ownError;

    // Fetch library templates separately
    const { data: libraryTemplates, error: libError } = await supabaseAdmin
      .from('comment_templates')
      .select('*')
      .eq('is_from_library', true)
      .order('usage_count', { ascending: false });

    if (libError) throw libError;

    // Merge and deduplicate client-side
    const allTemplates = [
      ...(ownTemplates || []),
      ...(libraryTemplates || []).filter(lt =>
        !(ownTemplates || []).find(ot => ot.id === lt.id)
      ),
    ];

    return res.status(200).json({ templates: allTemplates });
  } catch (err) {
    console.error('Error fetching templates:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function createCommentTemplate(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { title, content, category } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  try {
    const { data: template, error } = await supabase
      .from('comment_templates')
      .insert({
        teacher_id: user.id,
        title,
        content,
        category: category || null,
        is_from_library: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateCommentTemplate(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { templateId } = req.query;
  const { title, content, category } = req.body;

  try {
    const { data: template } = await supabase
      .from('comment_templates')
      .select('teacher_id')
      .eq('id', templateId)
      .single();

    if (!template || template.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: updated, error } = await supabase
      .from('comment_templates')
      .update({
        title: title || undefined,
        content: content || undefined,
        category: category !== undefined ? category : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ template: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteCommentTemplate(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { templateId } = req.query;

  try {
    const { data: template } = await supabase
      .from('comment_templates')
      .select('teacher_id')
      .eq('id', templateId)
      .single();

    if (!template || template.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await supabase
      .from('comment_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
}

async function toggleTemplateFavorite(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { templateId } = req.query;
  const { isFavorite } = req.body;

  try {
    const { data: template } = await supabase
      .from('comment_templates')
      .select('teacher_id')
      .eq('id', templateId)
      .single();

    if (!template || template.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: updated, error } = await supabase
      .from('comment_templates')
      .update({ is_favorite: isFavorite })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ template: updated });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// RUBRICS
// ============================================================================

async function getRubrics(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Fetch teacher's own rubrics
    const { data: ownRubrics, error: ownError } = await supabaseAdmin
      .from('rubrics')
      .select(`
        *,
        rubric_categories (
          id, name, description, max_points, weight, position, sort_order
        )
      `)
      .eq('teacher_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (ownError) throw ownError;

    // Fetch default templates
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('rubrics')
      .select(`
        *,
        rubric_categories (
          id, name, description, max_points, weight, position, sort_order
        )
      `)
      .eq('is_template', true)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (templatesError) throw templatesError;

    return res.status(200).json({
      rubrics: ownRubrics || [],
      templates: templates || [],
    });
  } catch (err) {
    console.error('Error fetching rubrics:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function getRubricWithCategories(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId } = req.query;

  try {
const { data: rubric, error } = await supabaseAdmin
      .from('rubrics')
      .select(`
        *,
        rubric_categories (
          id, name, description, max_points, weight, position, sort_order,
          rubric_criteria_levels (id, points, label, descriptor, position)
        )
      `)
      .eq('id', rubricId)
      .maybeSingle();

    if (error) throw error;
    if (!rubric) return res.status(404).json({ error: 'Rubric not found' });

    if (rubric.teacher_id !== user.id && !rubric.is_from_library) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json(rubric);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    res.status(500).json({ error: error.message });
  }
}

async function createRubric(req, res) {
  const user = await getUserFromToken(req);

  console.log('=== CREATE RUBRIC ===');
  console.log('User:', user);
  console.log('Body:', req.body);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, description, categories } = req.body;

  if (!name || !categories || categories.length === 0) {
    return res.status(400).json({ error: 'Name and categories required' });
  }

  try {
    const { data: rubric, error: rubricError } = await supabaseAdmin
      .from('rubrics')
      .insert({
        teacher_id: user.id,
        name,
        description: description || null,
        is_from_library: false,
        is_deleted: false,
      })
      .select()
      .single();

    if (rubricError) {
      console.log('Rubric insert error:', rubricError);
      throw rubricError;
    }

    const categoriesData = categories.map((cat, index) => ({
      rubric_id: rubric.id,
      name: cat.name,
      description: cat.description || null,
      max_points: cat.max_points || 5,
      weight: cat.weight || 1.0,
      position: index,
    }));

    const { error: catError } = await supabaseAdmin
      .from('rubric_categories')
      .insert(categoriesData);

    if (catError) throw catError;

    const { data: fullRubric, error: fetchError } = await supabaseAdmin
      .from('rubrics')
      .select(`
        *,
        rubric_categories (
          id,
          name,
          description,
          max_points,
          weight,
          position
        )
      `)
      .eq('id', rubric.id)
      .single();

    if (fetchError) throw fetchError;

    res.status(201).json(fullRubric);
  } catch (error) {
    console.error('Error creating rubric:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateRubric(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId } = req.query;
  const { name, description } = req.body;

  try {
    const { data: rubric } = await supabase
      .from('rubrics')
      .select('teacher_id')
      .eq('id', rubricId)
      .single();

    if (!rubric || rubric.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: updated, error } = await supabase
      .from('rubrics')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rubricId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating rubric:', error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteRubric(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId } = req.query;

  try {
    const { data: rubric } = await supabase
      .from('rubrics')
      .select('teacher_id')
      .eq('id', rubricId)
      .single();

    if (!rubric || rubric.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Phase 1.5: Check if rubric is in use, soft delete if yes
    const { data: assignmentsUsingRubric } = await supabase
      .from('assignments')
      .select('id, title')
      .eq('rubric_id', rubricId);

    const usageCount = assignmentsUsingRubric?.length || 0;

    if (usageCount > 0) {
      // Soft delete if in use
      const { data, error } = await supabase
        .from('rubrics')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', rubricId)
        .eq('teacher_id', user.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: `Rubric soft-deleted. Still referenced by ${usageCount} assignment(s).`,
        usageCount,
      });
    } else {
      // Hard delete if not used
      const { error } = await supabase
        .from('rubrics')
        .delete()
        .eq('id', rubricId)
        .eq('teacher_id', user.id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Rubric permanently deleted.',
      });
    }
  } catch (error) {
    console.error('Error deleting rubric:', error);
    res.status(500).json({ error: error.message });
  }
}

async function duplicateRubric(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { sourceRubricId, newName } = req.body;

  if (!sourceRubricId) {
    return res.status(400).json({ error: 'sourceRubricId is required' });
  }

  try {
    const { data: original, error: fetchError } = await supabase
      .from('rubrics')
      .select(`
        *,
        rubric_categories (
          id,
          name,
          description,
          max_points,
          weight,
          position
        )
      `)
      .eq('id', sourceRubricId)
      .single();

    if (fetchError) throw fetchError;
    if (!original) return res.status(404).json({ error: 'Rubric not found' });

    const { data: newRubric, error: rubricError } = await supabase
      .from('rubrics')
      .insert({
        teacher_id: user.id,
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        is_from_library: false,
        is_deleted: false,
      })
      .select()
      .single();

    if (rubricError) throw rubricError;

    const categoriesData = original.rubric_categories.map(cat => ({
      rubric_id: newRubric.id,
      name: cat.name,
      description: cat.description,
      max_points: cat.max_points,
      weight: cat.weight,
      position: cat.position,
    }));

    const { error: catError } = await supabase
      .from('rubric_categories')
      .insert(categoriesData);

    if (catError) throw catError;

    const { data: fullRubric, error: fetchError2 } = await supabase
      .from('rubrics')
      .select(`
        *,
        rubric_categories (
          id,
          name,
          description,
          max_points,
          weight,
          position
        )
      `)
      .eq('id', newRubric.id)
      .single();

    if (fetchError2) throw fetchError2;

    res.status(201).json(fullRubric);
  } catch (error) {
    console.error('Error duplicating rubric:', error);
    res.status(500).json({ error: error.message });
  }
}

async function checkRubricUsage(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId } = req.query;

  if (!rubricId) {
    return res.status(400).json({ error: 'rubricId is required' });
  }

  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title')
      .eq('rubric_id', rubricId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      rubricId,
      usageCount: assignments?.length || 0,
      assignments: assignments || [],
    });
  } catch (err) {
    console.error('Error in checkRubricUsage:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// RUBRIC CATEGORIES
// ============================================================================

async function addRubricCategory(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId } = req.query;
  const { name, description, max_points, weight } = req.body;

  if (!name) return res.status(400).json({ error: 'Category name required' });

  try {
    const { data: rubric } = await supabase
      .from('rubrics')
      .select('teacher_id')
      .eq('id', rubricId)
      .single();

    if (!rubric || rubric.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: existingCats } = await supabase
      .from('rubric_categories')
      .select('position')
      .eq('rubric_id', rubricId)
      .order('position', { ascending: false })
      .limit(1);

    const position = existingCats && existingCats.length > 0 ? existingCats[0].position + 1 : 0;

    const { data: category, error } = await supabase
      .from('rubric_categories')
      .insert({
        rubric_id: rubricId,
        name,
        description: description || null,
        max_points: max_points || 5,
        weight: weight || 1.0,
        position,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(category);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateRubricCategory(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { categoryId } = req.query;
  const { name, description, max_points, weight, position } = req.body;

  try {
    const { data: category } = await supabase
      .from('rubric_categories')
      .select('rubric_id')
      .eq('id', categoryId)
      .single();

    if (!category) return res.status(404).json({ error: 'Category not found' });

    const { data: rubric } = await supabase
      .from('rubrics')
      .select('teacher_id')
      .eq('id', category.rubric_id)
      .single();

    if (rubric.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: updated, error } = await supabase
      .from('rubric_categories')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        max_points: max_points || undefined,
        weight: weight || undefined,
        position: position !== undefined ? position : undefined,
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteRubricCategory(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { categoryId } = req.query;

  try {
    const { data: category } = await supabase
      .from('rubric_categories')
      .select('rubric_id')
      .eq('id', categoryId)
      .single();

    if (!category) return res.status(404).json({ error: 'Category not found' });

    const { data: rubric } = await supabase
      .from('rubrics')
      .select('teacher_id')
      .eq('id', category.rubric_id)
      .single();

    if (rubric.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await supabase
      .from('rubric_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// SUBMISSION TRACKING & BATCH GRADING
// ============================================================================

async function recordSubmissionView(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { submissionId, assignmentId } = req.body;

  try {
    const { data: status, error } = await supabase
      .from('submission_read_status')
      .upsert({
        teacher_id: user.id,
        submission_id: submissionId,
        assignment_id: assignmentId,
        last_viewed_at: new Date().toISOString(),
      }, { onConflict: 'teacher_id,submission_id' })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(status);
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getSubmissionStatus(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { assignmentId } = req.query;

  try {
    const { data: statuses, error } = await supabase
      .from('submission_read_status')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('assignment_id', assignmentId);

    if (error) throw error;

    res.status(200).json(statuses || []);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateSubmissionStatus(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { submissionId } = req.query;
  const { isGraded } = req.body;

  try {
    const { data: updated, error } = await supabase
      .from('submission_read_status')
      .update({
        is_graded: isGraded,
        graded_at: isGraded ? new Date().toISOString() : null,
      })
      .eq('submission_id', submissionId)
      .eq('teacher_id', user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: error.message });
  }
}

async function createBatchSession(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { assignmentId } = req.body;

  try {
    const { data: session, error } = await supabase
      .from('batch_grading_sessions')
      .insert({
        teacher_id: user.id,
        assignment_id: assignmentId,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating batch session:', error);
    res.status(500).json({ error: error.message });
  }
}

async function completeBatchSession(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { sessionId } = req.query;
  const { status } = req.body;

  try {
    const { data: session, error } = await supabase
      .from('batch_grading_sessions')
      .update({
        status,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('teacher_id', user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(session);
  } catch (error) {
    console.error('Error completing batch session:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// ASSIGNMENTS (Phase 1.5)
// ============================================================================

async function createAssignment(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    courseId,
    title,
    description,
    genre,
    promptType,
    dueDate,
    rubricId,
  } = req.body;

  if (!courseId || !title) {
    return res.status(400).json({ error: 'courseId and title are required' });
  }

  try {
    const newAssignment = {
      course_id: courseId,
      teacher_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      genre: genre || null,
      prompt_type: promptType || null,
      due_date: dueDate || null,
      rubric_id: rubricId || null,
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert([newAssignment])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(assignment);
  } catch (err) {
    console.error('Error in createAssignment:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateAssignmentRubric(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { assignmentId, newRubricId } = req.body;

  if (!assignmentId) {
    return res.status(400).json({ error: 'assignmentId is required' });
  }

  try {
    const { data: assignment } = await supabase
      .from('assignments')
      .select('teacher_id')
      .eq('id', assignmentId)
      .single();

    if (!assignment || assignment.teacher_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized to update this assignment' });
    }

    const { data: updated, error } = await supabase
      .from('assignments')
      .update({ rubric_id: newRubricId || null })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in updateAssignmentRubric:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// FEEDBACK (Phase 1.5)
// ============================================================================

async function saveFeedback(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    submissionId,
    assignmentId,
    studentId,
    submissionVersion,
    feedbackText,
    feedbackSummary,
    gradeValue,
    letterGrade,
    percentage,
    visibleToStudent,
    requestResubmission,
    resubmissionDeadline,
    rubricScores,
    totalRubricScore,
    rubricMaxScore,
    categoryNotes,
    isPartial,
  } = req.body;

  if (!submissionId || !assignmentId) {
    return res.status(400).json({ error: 'submissionId and assignmentId are required' });
  }

  try {
    // Verify submission exists and get student_id if not provided
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('id, user_id, version')
      .eq('id', submissionId)
      .maybeSingle();

    if (subError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const resolvedStudentId = studentId || submission.user_id;
    const resolvedVersion = submissionVersion || submission.version || 1;

    // Calculate percentage if not provided but scores are
    let resolvedPercentage = percentage || null;
    if (!resolvedPercentage && totalRubricScore != null && rubricMaxScore) {
      resolvedPercentage = Math.round((totalRubricScore / rubricMaxScore) * 100 * 100) / 100;
    }

    const feedbackData = {
      submission_id: submissionId,
      submission_version: resolvedVersion,
      assignment_id: assignmentId,
      student_id: resolvedStudentId,
      teacher_id: user.id,
      general_feedback: feedbackText || null,
      feedback_summary: feedbackSummary || null,
      grade_value: gradeValue || null,
      letter_grade: letterGrade || null,
      percentage: resolvedPercentage,
      is_visible_to_student: visibleToStudent !== false,
      request_resubmission: requestResubmission || false,
      resubmission_deadline: resubmissionDeadline || null,
      rubric_scores: rubricScores && Object.keys(rubricScores).length > 0 ? rubricScores : null,
      total_rubric_score: totalRubricScore ?? null,
      rubric_max_score: rubricMaxScore || null,
      category_notes: categoryNotes || null,
      is_partial: isPartial || false,
      submitted_at: isPartial ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Check for existing feedback on this submission + version
    const { data: existingFeedback } = await supabaseAdmin
      .from('assignment_feedback')
      .select('id, resubmission_count')
      .eq('submission_id', submissionId)
      .eq('submission_version', resolvedVersion)
      .maybeSingle();

    let result;
    if (existingFeedback) {
      const { data, error } = await supabaseAdmin
        .from('assignment_feedback')
        .update(feedbackData)
        .eq('id', existingFeedback.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('assignment_feedback')
        .insert([feedbackData])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Send notification to student if feedback is visible
    if (!isPartial && visibleToStudent !== false) {
      const notifTitle = totalRubricScore != null
        ? 'Your teacher graded your story — view your feedback'
        : 'Your teacher left feedback on your story';

      await supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: resolvedStudentId,
          type: totalRubricScore != null ? 'grade_received' : 'feedback_received',
          title: notifTitle,
          body: feedbackSummary || feedbackText || null,
          related_id: result.id,
          related_type: 'feedback',
          action_url: `/dashboard`,
        }]);
    }

    // Update submission read status
    await supabaseAdmin
      .from('submission_read_status')
      .upsert({
        teacher_id: user.id,
        submission_id: submissionId,
        assignment_id: assignmentId,
        is_graded: !isPartial,
        graded_at: isPartial ? null : new Date().toISOString(),
        feedback_version: resolvedVersion,
      }, { onConflict: 'teacher_id,submission_id' });

    return res.status(200).json({ success: true, feedback: result });

  } catch (err) {
    console.error('Error in saveFeedback:', err);
    return res.status(500).json({ error: err.message });
  }
}
  const {
    submissionId,
    assignmentId,
    feedbackText,
    feedbackSummary,
    grade,
    visibleToStudent,
    requestResubmission,
    resubmissionDeadline,
    rubricScores,
    totalRubricScore,
    rubricMaxScore,
  } = req.body;

  if (!submissionId || !assignmentId) {
    return res.status(400).json({ error: 'submissionId and assignmentId are required' });
  }

  try {
    const feedbackData = {
      submission_id: submissionId,
      assignment_id: assignmentId,
      teacher_id: user.id,
      feedback_text: feedbackText || null,
      feedback_summary: feedbackSummary || null,
      grade: grade || null,
      visible_to_student: visibleToStudent !== false,
      request_resubmission: requestResubmission || false,
      resubmission_deadline: resubmissionDeadline || null,
      rubric_scores: rubricScores && Object.keys(rubricScores).length > 0 ? rubricScores : null,
      total_rubric_score: totalRubricScore || null,
      rubric_max_score: rubricMaxScore || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existingFeedback } = await supabase
      .from('assignment_feedback')
      .select('id')
      .eq('submission_id', submissionId)
      .single();

    let result;
    if (existingFeedback) {
      const { data, error } = await supabase
        .from('assignment_feedback')
        .update(feedbackData)
        .eq('id', existingFeedback.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('assignment_feedback')
        .insert([feedbackData])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in saveFeedback:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// PEER REVIEW SETTINGS (Phase 2 - Placeholder)
// ============================================================================

async function createPeerReviewSettings(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { assignmentId, enabled, reviewerCount } = req.body;

  if (!assignmentId) {
    return res.status(400).json({ error: 'assignmentId is required' });
  }

  try {
    const { data: settings, error } = await supabase
      .from('peer_review_settings')
      .insert({
        assignment_id: assignmentId,
        enabled: enabled || false,
        reviewer_count: reviewerCount || 2,
        enable_upvotes: true,
        enable_comments: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(settings);
  } catch (err) {
    console.error('Error in createPeerReviewSettings:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function updatePeerReviewSettings(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { settingsId } = req.query;
  const { enabled, reviewerCount, enableUpvotes, enableComments } = req.body;

  try {
    const { data: updated, error } = await supabase
      .from('peer_review_settings')
      .update({
        enabled,
        reviewer_count: reviewerCount,
        enable_upvotes: enableUpvotes,
        enable_comments: enableComments,
      })
      .eq('id', settingsId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in updatePeerReviewSettings:', err);
    return res.status(500).json({ error: err.message });
  }
  async function getRubricByShare(req, res) {
  try {
    const { shareId } = req.body;
 
    if (!shareId) {
      return res.status(400).json({ error: 'shareId is required' });
    }
 
    // Fetch the share record (no auth required — public link)
    const { data: shareData, error: shareError } = await supabaseAdmin
      .from('public_rubric_shares')
      .select('rubric_id, created_at')
      .eq('id', shareId)
      .maybeSingle();
 
    if (shareError || !shareData) {
      return res.status(404).json({ error: 'Rubric share not found' });
    }
 
    // Fetch rubric with categories and criteria
    const { data: rubric, error: rubricError } = await supabaseAdmin
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
 
    if (rubricError || !rubric) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
 
    return res.status(200).json({ rubric });
  } catch (err) {
    console.error('getRubricByShare error:', err);
    return res.status(500).json({ error: err.message });
  }
}
}