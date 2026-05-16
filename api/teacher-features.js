// ============================================================================
// /api/teacher-features.js
// Teacher Quality-of-Life Features API
// Handles: comment templates, rubrics, batch grading, submission tracking
// Phase 1.5: Added rubric cloning, soft delete, resubmission deadline, feedback summary
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL,
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
        if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await createRubric(req, res);

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
    const { data: templates, error } = await supabase
      .from('comment_templates')
      .select('*')
      .or(`teacher_id.eq.${user.id},is_from_library.eq.true`)
      .order('is_favorite', { ascending: false })
      .order('usage_count', { ascending: false });

    if (error) throw error;

    res.status(200).json({ templates: templates || [] });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
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
    // Phase 1.5: Exclude soft-deleted rubrics
    const { data: rubrics, error } = await supabase
      .from('rubrics')
      .select('*')
      .or(`and(teacher_id.eq.${user.id},is_deleted.eq.false),and(is_from_library.eq.true,is_deleted.eq.false)`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ rubrics: rubrics || [] });
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getRubricWithCategories(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId } = req.query;

  try {
    const { data: rubric, error } = await supabase
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
      .eq('id', rubricId)
      .single();

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
}