import { useState } from 'react';
import { supabase } from '../supabase';

/**
 * Enhanced RubricBuilder Component
 * 
 * Creates rubrics with point-level descriptors
 * Example: "Excellent (5 pts): Clear, compelling narrative..."
 *          "Good (4 pts): Well-developed story..."
 *          "Fair (3 pts): Story is present but..."
 */

export default function RubricBuilder({ onRubricCreated, onClose, prefilledData }) {
  const [rubricName, setRubricName] = useState(prefilledData?.name || '');
  const [rubricDescription, setRubricDescription] = useState(prefilledData?.description || '');
  const [categories, setCategories] = useState(
    prefilledData?.categories || [
      {
        id: 'cat-1',
        name: '',
        description: '',
        maxPoints: 5,
        criteria: [
          { points: 5, label: 'Excellent', descriptor: '' },
          { points: 4, label: 'Good', descriptor: '' },
          { points: 3, label: 'Fair', descriptor: '' },
          { points: 2, label: 'Poor', descriptor: '' },
          { points: 1, label: 'Incomplete', descriptor: '' },
        ],
      },
    ]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add new category
  const handleAddCategory = () => {
    setCategories([
      ...categories,
      {
        id: `cat-${Date.now()}`,
        name: '',
        description: '',
        maxPoints: 5,
        criteria: [
          { points: 5, label: 'Excellent', descriptor: '' },
          { points: 4, label: 'Good', descriptor: '' },
          { points: 3, label: 'Fair', descriptor: '' },
          { points: 2, label: 'Poor', descriptor: '' },
          { points: 1, label: 'Incomplete', descriptor: '' },
        ],
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
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3A3226', margin: 0 }}>
            Create Grading Rubric
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0' }}>
            Define categories and point-level descriptors for consistent grading
          </p>
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