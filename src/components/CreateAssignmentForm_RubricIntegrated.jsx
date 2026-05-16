import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import RubricBuilder from './RubricBuilder';

/**
 * CreateAssignmentForm
 * 
 * Creates new writing assignments with optional rubric selection/creation.
 * Features:
 * - Rubric selector dropdown (select existing or create new)
 * - "Generate" button to create rubric inline (opens RubricBuilder modal)
 * - Saves rubric_id with assignment for grading
 * - Loads available rubrics on form open
 * 
 * Auth: Uses Bearer token for API calls
 */

const B = {
  sand: '#F5F1ED',
  taupe: '#9A8878',
  brown: '#8B6F47',
  darkBrown: '#5C4A36',
  cream: '#FFFBF7',
  borderLight: '#E8DDD3',
  textMuted: '#666',
};

export default function CreateAssignmentForm({
  selectedCourse,
  onAssignmentCreated,
  onClose,
}) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [promptType, setPromptType] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Rubric state
  const [selectedRubricId, setSelectedRubricId] = useState(null);
  const [availableRubrics, setAvailableRubrics] = useState([]);
  const [loadingRubrics, setLoadingRubrics] = useState(false);
  const [showRubricBuilder, setShowRubricBuilder] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load rubrics when form opens
  useEffect(() => {
    const fetchRubrics = async () => {
      setLoadingRubrics(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/teacher-features?action=getRubrics', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch rubrics');
        }

        const rubrics = await response.json();
        setAvailableRubrics(Array.isArray(rubrics) ? rubrics : []);
      } catch (err) {
        console.error('Failed to load rubrics:', err);
        setError('Could not load rubrics');
        setAvailableRubrics([]);
      } finally {
        setLoadingRubrics(false);
      }
    };

    fetchRubrics();
  }, []);

  const handleGenerateNewRubric = () => {
    setShowRubricBuilder(true);
  };

  const handleRubricCreated = (newRubric) => {
    // Add newly created rubric to list
    setAvailableRubrics([...availableRubrics, newRubric]);
    setSelectedRubricId(newRubric.id);
    setShowRubricBuilder(false);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Assignment title is required');
      return;
    }

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const newAssignment = {
        course_id: selectedCourse,
        title: title.trim(),
        description: description.trim() || null,
        genre: genre || null,
        prompt_type: promptType || null,
        due_date: dueDate || null,
        rubric_id: selectedRubricId || null, // KEY ADDITION
        status: 'draft',
      };

      const { data: assignment, error: createError } = await supabase
        .from('assignments')
        .insert([newAssignment])
        .select()
        .single();

      if (createError) throw createError;

      // Reset form
      setTitle('');
      setDescription('');
      setGenre('');
      setPromptType('');
      setDueDate('');
      setSelectedRubricId(null);

      // Callback to parent
      if (onAssignmentCreated) {
        onAssignmentCreated(assignment);
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const selectedRubricName = availableRubrics.find(
    r => r.id === selectedRubricId
  )?.name;

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: B.cream,
      borderRadius: '8px',
      border: `1px solid ${B.borderLight}`,
    }}>
      <h2 style={{
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        fontWeight: 700,
        color: B.darkBrown,
      }}>
        Create New Assignment
      </h2>

      <form onSubmit={handleCreateAssignment}>
        {/* Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: B.darkBrown,
          }}>
            Assignment Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Character Study: Create an Original Protagonist"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${B.borderLight}`,
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: B.darkBrown,
          }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context, expectations, or guidelines..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${B.borderLight}`,
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              fontColor: B.textMuted,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Genre & Prompt Type (2-column) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: B.darkBrown,
            }}>
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${B.borderLight}`,
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
              }}
            >
              <option value="">Select a genre...</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Mystery">Mystery</option>
              <option value="Horror">Horror</option>
              <option value="Historical">Historical</option>
              <option value="Literary">Literary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: B.darkBrown,
            }}>
              Prompt Type
            </label>
            <select
              value={promptType}
              onChange={(e) => setPromptType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${B.borderLight}`,
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
              }}
            >
              <option value="">Select prompt type...</option>
              <option value="Open-Ended">Open-Ended</option>
              <option value="Structured">Structured</option>
              <option value="Image-Based">Image-Based</option>
              <option value="Dialogue">Dialogue</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: B.darkBrown,
          }}>
            Due Date
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${B.borderLight}`,
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
            }}
          />
        </div>

        {/* RUBRIC SELECTOR - KEY ADDITION */}
        <div style={{
          padding: '1rem',
          backgroundColor: B.sand,
          borderRadius: '6px',
          border: `1px solid ${B.borderLight}`,
          marginBottom: '1.5rem',
        }}>
          <label style={{
            display: 'block',
            marginBottom: '0.75rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: B.darkBrown,
          }}>
            📋 Grading Rubric
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <select
              value={selectedRubricId || ''}
              onChange={(e) => setSelectedRubricId(e.target.value || null)}
              disabled={loadingRubrics}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `1px solid ${B.borderLight}`,
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                backgroundColor: '#fff',
              }}
            >
              <option value="">None - Freestyle grading</option>
              {loadingRubrics ? (
                <option disabled>Loading rubrics...</option>
              ) : (
                availableRubrics.map((rubric) => (
                  <option key={rubric.id} value={rubric.id}>
                    {rubric.name}
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={handleGenerateNewRubric}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#fff',
                border: `2px solid ${B.brown}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: B.brown,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = B.brown;
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#fff';
                e.target.style.color = B.brown;
              }}
            >
              + Generate
            </button>
          </div>

          {selectedRubricName && (
            <p style={{
              fontSize: '0.85rem',
              color: B.brown,
              fontWeight: 500,
              margin: '0',
            }}>
              ✅ {selectedRubricName} selected
            </p>
          )}

          {!selectedRubricId && !loadingRubrics && availableRubrics.length === 0 && (
            <p style={{
              fontSize: '0.85rem',
              color: B.textMuted,
              fontStyle: 'italic',
              margin: '0',
            }}>
              No rubrics yet. Create one to get started!
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef5f5',
            border: '1px solid #f5d7d7',
            borderRadius: '4px',
            color: '#c41e3a',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: B.brown,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>

      {/* RubricBuilder Modal */}
      {showRubricBuilder && (
        <RubricBuilder
          onClose={() => setShowRubricBuilder(false)}
          onRubricCreated={handleRubricCreated}
        />
      )}
    </div>
  );
}