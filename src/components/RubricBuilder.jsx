import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * Enhanced RubricBuilder Component
 * 
 * Creates rubrics with point-level descriptors
 * Example: "Excellent (5 pts): Clear, compelling narrative..."
 *          "Good (4 pts): Well-developed story..."
 *          "Fair (3 pts): Story is present but..."
 *
 * If no prefilledData is passed in, opens on a "choose a starting point" screen
 * that lets the teacher pick one of their saved templates or start from scratch.
 */

const DEFAULT_CRITERIA = [
  { points: 5, label: 'Excellent', descriptor: '' },
  { points: 4, label: 'Good', descriptor: '' },
  { points: 3, label: 'Fair', descriptor: '' },
  { points: 2, label: 'Poor', descriptor: '' },
  { points: 1, label: 'Incomplete', descriptor: '' },
];

export default function RubricBuilder({ onRubricCreated, onClose, prefilledData }) {
  const [step, setStep] = useState(prefilledData ? 'form' : 'choose');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [templateLoadingId, setTemplateLoadingId] = useState(null);

  const [rubricName, setRubricName] = useState(prefilledData?.name || '');
  const [rubricDescription, setRubricDescription] = useState(prefilledData?.description || '');
  const [categories, setCategories] = useState(
    prefilledData?.categories || [
      {
        id: 'cat-1',
        name: '',
        description: '',
        maxPoints: 5,
        criteria: DEFAULT_CRITERIA.map(c => ({ ...c })),
      },
    ]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch templates when the picker screen is shown
  useEffect(() => {
    if (step !== 'choose') return;

    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/teacher-features?action=getRubrics', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load templates');
        setTemplates(data.templates || []);
      } catch (err) {
        console.error('Error fetching rubric templates:', err);
        setTemplatesError(err.message);
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [step]);

  const handleStartFromScratch = () => {
    setRubricName('');
    setRubricDescription('');
    setCategories([
      {
        id: 'cat-1',
        name: '',
        description: '',
        maxPoints: 5,
        criteria: DEFAULT_CRITERIA.map(c => ({ ...c })),
      },
    ]);
    setStep('form');
  };

  const handleSelectTemplate = async (templateId) => {
    setTemplateLoadingId(templateId);
    setTemplatesError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `/api/teacher-features?action=getRubricWithCategories&rubricId=${templateId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load template');

      const loadedCategories = (data.rubric_categories || [])
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((cat, index) => {
          const levels = (cat.rubric_criteria_levels || []).slice().sort((a, b) => b.points - a.points);
          return {
            id: cat.id || `cat-${index}`,
            name: cat.name || '',
            description: cat.description || '',
            maxPoints: cat.max_points || 5,
            criteria: levels.length > 0
              ? levels.map(l => ({ points: l.points, label: l.label, descriptor: l.descriptor || '' }))
              : DEFAULT_CRITERIA.map(c => ({ ...c })),
          };
        });

      setRubricName(data.name ? `${data.name} (Copy)` : '');
      setRubricDescription(data.description || '');
      setCategories(
        loadedCategories.length > 0
          ? loadedCategories
          : [{ id: 'cat-1', name: '', description: '', maxPoints: 5, criteria: DEFAULT_CRITERIA.map(c => ({ ...c })) }]
      );
      setStep('form');
    } catch (err) {
      console.error('Error loading template:', err);
      setTemplatesError(err.message);
    } finally {
      setTemplateLoadingId(null);
    }
  };

  // Add new category
  const handleAddCategory = () => {
    setCategories([
      ...categories,
      {
        id: `cat-${Date.now()}`,
        name: '',
        description: '',
        maxPoints: 5,
        criteria: DEFAULT_CRITERIA.map(c => ({ ...c })),
      },
    ]);
  };

  // Remove category
  const handleRemoveCategory = (id) => {
    if (categories.length === 1) {
      setError('Rubric must have at least one category');
      return;
    }
    setCategories(categories.filter(cat => cat.id !== id));
  };

  // Update category field
  const handleUpdateCategory = (id, field, value) => {
    setCategories(
      categories.map(cat =>
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    );
  };

  // Update criteria descriptor
  const handleUpdateCriteria = (categoryId, points, value) => {
    setCategories(
      categories.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              criteria: cat.criteria.map(crit =>
                crit.points === points ? { ...crit, descriptor: value } : crit
              ),
            }
          : cat
      )
    );
  };

  // Update criteria label
  const handleUpdateCriteriaLabel = (categoryId, points, value) => {
    setCategories(
      categories.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              criteria: cat.criteria.map(crit =>
                crit.points === points ? { ...crit, label: value } : crit
              ),
            }
          : cat
      )
    );
  };

  // Create rubric
  const handleCreateRubric = async () => {
    if (!rubricName.trim()) {
      setError('Rubric name is required');
      return;
    }

    if (categories.some(cat => !cat.name.trim())) {
      setError('All categories must have a name');
      return;
    }

    if (categories.some(cat => cat.criteria.some(crit => !crit.descriptor.trim()))) {
      setError('All criteria must have descriptors');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // POST to create rubric
      const response = await fetch('/api/teacher-features?action=createRubric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: rubricName,
          description: rubricDescription,
          categories: categories.map((cat, index) => ({
            name: cat.name,
            description: cat.description,
            max_points: cat.maxPoints,
            weight: 1.0,
            position: index,
            criteria: cat.criteria, // Pass full criteria with descriptors
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create rubric');
      }

      const rubric = await response.json();

      if (onRubricCreated) {
        onRubricCreated(rubric);
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error creating rubric:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // STEP: CHOOSE STARTING POINT
  // ==========================================================================
  if (step === 'choose') {
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
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3A3226', margin: 0 }}>
              New Grading Rubric
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0' }}>
              Start from a template or build one from scratch
            </p>
          </div>

          {templatesError && (
            <div
              style={{
                backgroundColor: '#FDF0E8',
                border: '1px solid #D4845A',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
                color: '#B56840',
                fontSize: '0.9rem',
              }}
            >
              {templatesError}
            </div>
          )}

          {/* Start from scratch card */}
          <button
            type="button"
            onClick={handleStartFromScratch}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              backgroundColor: '#F5F1ED',
              border: '2px dashed #D9C9B0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontWeight: 700, color: '#3A3226', marginBottom: '0.25rem' }}>
              + Start from Scratch
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              Build a brand new rubric with your own categories and criteria
            </div>
          </button>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#3A3226', marginBottom: '0.75rem' }}>
            Or start from a template
          </h3>

          {templatesLoading && (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading templates...</p>
          )}

          {!templatesLoading && templates.length === 0 && !templatesError && (
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              No templates available yet.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelectTemplate(template.id)}
                disabled={templateLoadingId === template.id}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1.25rem',
                  backgroundColor: '#fff',
                  border: '1px solid #E8DDD3',
                  borderRadius: '8px',
                  cursor: templateLoadingId === template.id ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: templateLoadingId === template.id ? 0.6 : 1,
                }}
              >
                <div style={{ fontWeight: 700, color: '#3A3226', marginBottom: '0.25rem' }}>
                  {template.name}
                  {templateLoadingId === template.id && ' — loading...'}
                </div>
                {template.description && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.4rem' }}>
                    {template.description}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#8B6F47', fontWeight: 600 }}>
                  {template.rubric_categories?.length || 0} categories
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // STEP: FORM
  // ==========================================================================
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
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3A3226', margin: 0 }}>
              Create Grading Rubric
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0' }}>
              Define categories and point-level descriptors for consistent grading
            </p>
          </div>
          {!prefilledData && (
            <button
              type="button"
              onClick={() => setStep('choose')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8B6F47',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
              }}
            >
              ← Back to templates
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FDF0E8',
              border: '1px solid #D4845A',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1rem',
              color: '#B56840',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Rubric name & description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#3A3226' }}>
            Rubric Name *
          </label>
          <input
            type="text"
            placeholder="e.g., Creative Writing Rubric"
            value={rubricName}
            onChange={(e) => setRubricName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E8DDD3',
              borderRadius: '6px',
              fontSize: '0.95rem',
              marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#3A3226' }}>
            Description (optional)
          </label>
          <textarea
            placeholder="Brief description of this rubric's purpose"
            value={rubricDescription}
            onChange={(e) => setRubricDescription(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E8DDD3',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Categories */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3A3226', marginTop: 0, marginBottom: '1rem' }}>
            Grading Categories
          </h3>

          {categories.map((category, catIndex) => (
            <div
              key={category.id}
              style={{
                backgroundColor: '#F5F1ED',
                border: '1px solid #E8DDD3',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>Category {catIndex + 1}</span>
                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#D4845A',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Category name */}
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#3A3226' }}>
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Story Structure, Dialogue, Grammar"
                value={category.name}
                onChange={(e) => handleUpdateCategory(category.id, 'name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid #E8DDD3',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box',
                }}
              />

              {/* Max points */}
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#3A3226' }}>
                Max Points
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={category.maxPoints}
                onChange={(e) => handleUpdateCategory(category.id, 'maxPoints', parseInt(e.target.value) || 5)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid #E8DDD3',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box',
                }}
              />

              {/* Criteria descriptors */}
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#3A3226' }}>
                Point Levels & Descriptors *
              </label>

              {category.criteria.map((crit) => (
                <div key={crit.points} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Label (e.g., Excellent)"
                      value={crit.label}
                      onChange={(e) => handleUpdateCriteriaLabel(category.id, crit.points, e.target.value)}
                      style={{
                        width: '120px',
                        padding: '0.5rem',
                        border: '1px solid #E8DDD3',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, color: '#666', minWidth: '50px', textAlign: 'center' }}>
                      {crit.points} pts
                    </span>
                  </div>

                  <textarea
                    placeholder={`Describe what ${crit.points} points looks like for "${category.name}"`}
                    value={crit.descriptor}
                    onChange={(e) => handleUpdateCriteria(category.id, crit.points, e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #E8DDD3',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Add category button */}
        <button
          type="button"
          onClick={handleAddCategory}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#fff',
            border: '2px solid #8B6F47',
            borderRadius: '6px',
            color: '#8B6F47',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginBottom: '1.5rem',
          }}
        >
          + Add Category
        </button>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateRubric}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#8B6F47',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Rubric'}
          </button>
        </div>
      </div>
    </div>
  );
}