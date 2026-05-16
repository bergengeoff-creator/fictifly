// ============================================================================
// /api/teacher-features.js
// Teacher Quality-of-Life Features API
// Handles: comment templates, rubrics, batch grading, submission tracking
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
    const { data: rubrics, error } = await supabase
      .from('rubrics')
      .select('*')
      .or(`teacher_id.eq.${user.id},is_from_library.eq.true`)
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

    res.status(200).json({ rubric });
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

    res.status(201).json({ rubric: fullRubric });
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

    res.status(200).json({ rubric: updated });
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

    const { error } = await supabase
      .from('rubrics')
      .delete()
      .eq('id', rubricId);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    res.status(500).json({ error: error.message });
  }
}

async function duplicateRubric(req, res) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rubricId } = req.query;

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
      .eq('id', rubricId)
      .single();

    if (fetchError) throw fetchError;
    if (!original) return res.status(404).json({ error: 'Rubric not found' });

    const { data: newRubric, error: rubricError } = await supabase
      .from('rubrics')
      .insert({
        teacher_id: user.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        is_from_library: false,
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

    res.status(201).json({ rubric: fullRubric });
  } catch (error) {
    console.error('Error duplicating rubric:', error);
    res.status(500).json({ error: error.message });
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

    res.status(201).json({ category });
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

    res.status(200).json({ category: updated });
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

    res.status(200).json({ status });
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

    res.status(200).json({ statuses: statuses || [] });
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

    res.status(200).json({ status: updated });
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

    res.status(201).json({ session });
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

    res.status(200).json({ session });
  } catch (error) {
    console.error('Error completing batch session:', error);
    res.status(500).json({ error: error.message });
  }
}