import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * CommentTemplateManager
 * 
 * Allows teachers to:
 * - View library templates
 * - Create custom templates
 * - Mark templates as favorite
 * - Delete custom templates
 * - Use templates in feedback modal
 */

const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', seaMid: '#5B9EC9', seaDeep: '#2E6DA4',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878', white: '#FFFCF8',
};

export default function CommentTemplateManager({ onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState(null);

  const categories = ['Positive', 'Constructive', 'Grammar', 'Dialogue', 'Imagery', 'Structure'];

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setToken(session.access_token);
      fetchTemplates(session.access_token);
    }
  };

  const fetchTemplates = async (authToken) => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-features?action=getTemplates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!token) {
      setError('Not authenticated');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher-features?action=createTemplate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTemplate.title.trim(),
          content: newTemplate.content.trim(),
          category: newTemplate.category || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setSaving(false);
        return;
      }

      setTemplates([data.template, ...templates]);
      setNewTemplate({ title: '', content: '', category: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async (templateId, currentFavorite) => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    try {
      const response = await fetch(`/api/teacher-features?action=toggleFavorite&templateId=${templateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      });

      const data = await response.json();

      setTemplates(templates.map(t => t.id === templateId ? data.template : t));
    } catch (err) {
      setError('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    const confirmed = window.confirm('Delete this template?');
    if (!confirmed) return;

    if (!token) {
      setError('Not authenticated');
      return;
    }

    try {
      const response = await fetch(`/api/teacher-features?action=deleteTemplate&templateId=${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId));
      } else {
        setError('Failed to delete template');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: B.white, padding: '2rem', borderRadius: '10px', color: B.inkLight }}>Loading templates...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: B.white, borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: B.ink, margin: 0 }}>
            Quick Comment Templates
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: B.inkLight }}>×</button>
        </div>

        {/* Create New Template */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: B.sand, borderRadius: '8px' }}>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: B.terra,
              color: B.white,
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '0.75rem',
            }}>
            {showCreateForm ? '- Cancel' : '+ New Template'}
          </button>

          {showCreateForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                value={newTemplate.title}
                onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                placeholder="Template title (e.g., 'Good dialogue')"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: `1px solid ${B.sandDeep}`,
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  color: B.ink,
                  background: B.white,
                }}
              />

              <textarea
                value={newTemplate.content}
                onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Template content (what you'll paste)"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: `1px solid ${B.sandDeep}`,
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  minHeight: '70px',
                  boxSizing: 'border-box',
                  color: B.ink,
                  background: B.white,
                  fontFamily: 'sans-serif',
                  resize: 'vertical',
                }}
              />

              <select
                value={newTemplate.category}
                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: `1px solid ${B.sandDeep}`,
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  color: B.ink,
                  background: B.white,
                }}>
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={handleCreateTemplate}
                disabled={saving}
                style={{
                  padding: '0.6rem',
                  background: saving ? B.sandDeep : B.seaDeep,
                  color: B.white,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>
                {saving ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.75rem', background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '8px', color: B.terraDark, fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Templates List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: B.inkLight }}>
              <p style={{ marginBottom: '0.5rem' }}>No templates yet.</p>
              <p style={{ fontSize: '0.85rem' }}>Create your first quick comment template above!</p>
            </div>
          ) : (
            templates.map(template => (
              <div
                key={template.id}
                style={{
                  padding: '1rem',
                  background: template.is_favorite ? '#FFF8E7' : B.sand,
                  border: `1px solid ${template.is_favorite ? '#F0C674' : B.sandDeep}`,
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: B.ink, margin: '0 0 0.25rem 0' }}>
                      {template.is_favorite && '★ '}{template.title}
                    </h4>
                    {template.category && (
                      <span style={{ fontSize: '0.75rem', color: B.inkLight, background: B.white, padding: '0.2rem 0.6rem', borderRadius: '3px' }}>
                        {template.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(template.id, template.is_favorite)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '0.5rem',
                    }}>
                    {template.is_favorite ? '★' : '☆'}
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: B.ink, margin: '0.5rem 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {template.content}
                </p>

                {!template.is_from_library && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    style={{
                      fontSize: '0.75rem',
                      color: B.terraDark,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '0.5rem',
                      textDecoration: 'underline',
                    }}>
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: B.seaDeep,
              color: B.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}