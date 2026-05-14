import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * RubricBuilder
 * 
 * Allows teachers to:
 * - Create new rubrics from scratch
 * - Edit existing rubrics
 * - Add/remove/reorder categories
 * - Set max points per category
 * - Duplicate pre-built templates
 * - Use in assignments
 */

const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', seaMid: '#5B9EC9', seaDeep: '#2E6DA4',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878', white: '#FFFCF8',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.6rem',
  border: `1px solid ${B.sandDeep}`,
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontFamily: 'sans-serif',
  color: B.ink,
  background: B.sand,
};

export default function RubricBuilder({ onClose, onSave, initialRubric = null, mode = 'create' }) {
  const [name, setName] = useState(initialRubric?.name || '');
  const [description, setDescription] = useState(initialRubric?.description || '');
  const [categories, setCategories] = useState(initialRubric?.rubric_categories || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (categories.length === 0 && mode === 'create') {
      // Start with one empty category
      setCategories([{ name: '', description: '', max_points: 5, position: 0 }]);
    }
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data } = await supabase
        .from('rubrics')
        .select(`
          *,
          rubric_categories (*)
        `)
        .eq('is_from_library', true)
        .limit(5);

      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleAddCategory = () => {
    const newCategory = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      max_points: 5,
      position: categories.length,
    };
    setCategories([...categories, newCategory]);
  };

  const handleRemoveCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleUpdateCategory = (index, field, value) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const handleMoveCategory = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) {
      return;
    }

    const updated = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    updated.forEach((cat, i) => (cat.position = i));
    setCategories(updated);
  };

  const handleUseTemplate = (template) => {
    setName(template.name);
    setDescription(template.description || '');
    setCategories(template.rubric_categories || []);
    setShowTemplates(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Rubric name is required');
      return;
    }

    if (categories.length === 0) {
      setError('Add at least one category');
      return;
    }

    // Validate all categories have names
    if (categories.some(cat => !cat.name.trim())) {
      setError('All categories must have names');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher-features?action=createRubric', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          categories: categories.map(cat => ({
            name: cat.name.trim(),
            description: cat.description.trim() || null,
            max_points: Number(cat.max_points) || 5,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      onSave?.(data.rubric);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: B.white, borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: B.ink, margin: 0 }}>
            {mode === 'create' ? 'Create Rubric' : 'Edit Rubric'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: B.inkLight }}>×</button>
        </div>

        {/* Basic Info */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Rubric Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Story Structure"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what this rubric measures..."
            style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
          />
        </div>

        {/* Template Selector */}
        {mode === 'create' && templates.length > 0 && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: B.sand, borderRadius: '8px' }}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: B.seaDeep,
                color: B.white,
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '0.5rem',
              }}>
              {showTemplates ? 'Hide Templates' : 'Start from Template'}
            </button>
            {showTemplates && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    style={{
                      padding: '0.6rem',
                      background: B.white,
                      border: `1px solid ${B.sandDeep}`,
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: B.ink,
                    }}>
                    <strong>{template.name}</strong>
                    {template.description && <div style={{ fontSize: '0.75rem', color: B.inkLight }}>{template.description}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: B.ink, margin: 0 }}>Scoring Categories</h3>
            <button
              onClick={handleAddCategory}
              style={{
                padding: '0.5rem 1rem',
                background: B.terra,
                color: B.white,
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}>
              + Add Category
            </button>
          </div>

          {categories.map((cat, index) => (
            <div key={cat.id || index} style={{ padding: '1rem', background: B.sand, borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {/* Move up/down */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    onClick={() => handleMoveCategory(index, 'up')}
                    disabled={index === 0}
                    style={{
                      padding: '0.3rem 0.4rem',
                      background: index === 0 ? B.sandDeep : B.white,
                      border: `1px solid ${B.sandDeep}`,
                      borderRadius: '3px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      opacity: index === 0 ? 0.5 : 1,
                    }}>
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveCategory(index, 'down')}
                    disabled={index === categories.length - 1}
                    style={{
                      padding: '0.3rem 0.4rem',
                      background: index === categories.length - 1 ? B.sandDeep : B.white,
                      border: `1px solid ${B.sandDeep}`,
                      borderRadius: '3px',
                      cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      opacity: index === categories.length - 1 ? 0.5 : 1,
                    }}>
                    ↓
                  </button>
                </div>

                {/* Fields */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={cat.name}
                    onChange={e => handleUpdateCategory(index, 'name', e.target.value)}
                    placeholder="Category name"
                    style={{ ...inputStyle, background: B.white }}
                  />
                  <input
                    type="number"
                    value={cat.max_points}
                    onChange={e => handleUpdateCategory(index, 'max_points', e.target.value)}
                    min="1"
                    max="100"
                    style={{ ...inputStyle, background: B.white }}
                  />
                  <button
                    onClick={() => handleRemoveCategory(index)}
                    style={{
                      padding: '0.6rem',
                      background: B.terraDark,
                      color: B.white,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}>
                    Remove
                  </button>
                </div>
              </div>

              {/* Description */}
              <textarea
                value={cat.description || ''}
                onChange={e => handleUpdateCategory(index, 'description', e.target.value)}
                placeholder="Describe this category (optional)"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '50px',
                  padding: '0.5rem',
                  background: B.white,
                  border: `1px solid ${B.sandDeep}`,
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'sans-serif',
                  color: B.ink,
                  resize: 'vertical',
                }}
              />
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.75rem', background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '8px', color: B.terraDark, fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'transparent',
              border: `1px solid ${B.sandDeep}`,
              borderRadius: '8px',
              color: B.inkMid,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: loading ? B.sandDeep : B.seaDeep,
              border: 'none',
              borderRadius: '8px',
              color: B.white,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Creating...' : 'Create Rubric'}
          </button>
        </div>
      </div>
    </div>
  );
}