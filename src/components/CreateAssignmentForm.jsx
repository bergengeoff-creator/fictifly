import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import RubricBuilder from './RubricBuilder';

/**
 * CreateAssignmentForm
 * 
 * Complete assignment creation with:
 * - Multi-class assignment (true junction table support)
 * - Rubric selector + inline creation
 * - Prompt library integration (saved prompts default)
 * - 4 clear sections: Basics, Prompt, Grading, Details
 * - Full validation & error handling
 * 
 * Auth: Uses Bearer token from session
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
  availableClasses = [],
  onAssignmentCreated,
  onClose,
}) {
  // Form State - Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  // Form State - Prompt
  const [promptSource, setPromptSource] = useState('saved');
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [genre, setGenre] = useState('');
  const [promptIngredients, setPromptIngredients] = useState('');
  const [promptType, setPromptType] = useState('');

  // Form State - Grading
  const [useRubric, setUseRubric] = useState(false);
  const [availableRubrics, setAvailableRubrics] = useState([]);
  const [selectedRubricId, setSelectedRubricId] = useState(null);
  const [showRubricBuilder, setShowRubricBuilder] = useState(false);

  // Form State - Details
  const [wordCount, setWordCount] = useState('');
  const [dueDate, setDueDate] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingRubrics, setLoadingRubrics] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);


  // Load saved prompts on mount
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoadingPrompts(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch('/api/teacher-features?action=getPrompts', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch prompts');
        const prompts = await response.json();
        setSavedPrompts(Array.isArray(prompts) ? prompts : []);
      } catch (err) {
        console.error('Failed to load prompts:', err);
        setSavedPrompts([]);
      } finally {
        setLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, []);

  // Load rubrics on mount
  useEffect(() => {
    const fetchRubrics = async () => {
      setLoadingRubrics(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch('/api/teacher-features?action=getRubrics', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch rubrics');
        const rubrics = await response.json();
        setAvailableRubrics(Array.isArray(rubrics) ? rubrics : []);
      } catch (err) {
        console.error('Failed to load rubrics:', err);
        setAvailableRubrics([]);
      } finally {
        setLoadingRubrics(false);
      }
    };

    fetchRubrics();
  }, []);

  const handleClassToggle = (classId) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSelectAllClasses = () => {
    setSelectedClassIds(availableClasses.map(c => c.id));
  };

  const handleClearAllClasses = () => {
    setSelectedClassIds([]);
  };

  const handleRubricCreated = (newRubric) => {
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

    if (selectedClassIds.length === 0) {
      setError('Please select at least one class');
      return;
    }

    // Validate prompt selection based on source
    if (promptSource === 'saved' && !selectedPromptId) {
      setError('Please select a saved prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Prepare prompt data based on source
      let promptData = {};

      if (promptSource === 'saved' && selectedPromptId) {
        const selectedPrompt = savedPrompts.find(p => p.id === selectedPromptId);
        promptData = {
          prompt_id: selectedPromptId,
          prompt_title: selectedPrompt.title,
          prompt_content: selectedPrompt.content,
          prompt_source: 'saved',
        };
      } else if (promptSource === 'ingredients') {
        promptData = {
          genre: genre || null,
          prompt_ingredients: promptIngredients || null,
          prompt_source: 'ingredients',
        };
      } else if (promptSource === 'generator') {
        promptData = {
          prompt_type: promptType || null,
          prompt_source: 'generator',
        };
      }

      // Create assignment for each selected class
      const assignmentsToCreate = selectedClassIds.map(classId => ({
        class_id: classId,
        teacher_id: session.user.id,
        title: title.trim(),
        description: description.trim() || null,
        ...promptData,
        word_count: wordCount ? parseInt(wordCount) : null,
        due_date: dueDate || null,
        rubric_id: useRubric ? selectedRubricId : null,
        status: 'draft',
        created_at: new Date().toISOString(),
      }));

      // Insert all assignments
      const { data: assignments, error: insertError } = await supabase
        .from('assignments')
        .insert(assignmentsToCreate)
        .select();

      if (insertError) throw insertError;

      // If multi-class, create junction table entries
      if (assignments && assignments.length > 0) {
        const junctionEntries = assignments.map(assignment => ({
          assignment_id: assignment.id,
          class_id: assignment.class_id,
          created_at: new Date().toISOString(),
        }));

        const { error: junctionError } = await supabase
          .from('assignment_class_mapping')
          .insert(junctionEntries);

        if (junctionError) {
          console.warn('Junction table insert non-critical error:', junctionError);
          // Don't fail here - assignments still created
        }
      }

      // Success - reset form
      setTitle('');
      setDescription('');
      setSelectedClassIds([]);
      setPromptSource('saved');
      setSelectedPromptId(null);
      setGenre('');
      setPromptIngredients('');
      setPromptType('');
      setUseRubric(false);
      setSelectedRubricId(null);
      setWordCount('');
      setDueDate('');

      if (onAssignmentCreated) {
        onAssignmentCreated(assignments);
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

  const selectedPrompt = savedPrompts.find(p => p.id === selectedPromptId);
  const selectedRubric = availableRubrics.find(r => r.id === selectedRubricId);
  const selectedClassNames = availableClasses
    .filter(c => selectedClassIds.includes(c.id))
    .map(c => c.name)
    .join(', ');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        maxHeight: '90vh',
        overflowY: 'auto',
        width: '100%',
        maxWidth: '900px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          borderBottom: `1px solid ${B.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: B.darkBrown,
            margin: 0,
          }}>
            Create New Assignment
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: B.textMuted,
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleCreateAssignment} style={{ padding: '2rem' }}>
          {/* Error Message */}
          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef5f5',
              border: '1px solid #f5d7d7',
              borderRadius: '4px',
              color: '#c41e3a',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* SECTION 1: BASICS & CLASS SELECTION */}
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: `1px solid ${B.borderLight}`,
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: B.darkBrown,
              marginTop: 0,
              marginBottom: '1.5rem',
            }}>
              Basics & Class Selection
            </h3>

            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.5rem',
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: B.darkBrown,
              }}>
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, expectations, or guidelines..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${B.borderLight}`,
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Class Selection */}
            <div>
              <label style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: B.darkBrown,
              }}>
                Assign to Classes * (select one or more)
              </label>

              <div style={{
                backgroundColor: B.sand,
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '0.75rem',
                border: `1px solid ${B.borderLight}`,
              }}>
                {availableClasses.length === 0 ? (
                  <p style={{ color: B.textMuted, margin: 0 }}>
                    No classes available
                  </p>
                ) : (
                  <>
                    {availableClasses.map(cls => (
                      <label
                        key={cls.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={() => handleClassToggle(cls.id)}
                          style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                        />
                        <span>
                          {cls.name}
                          <span style={{ color: B.textMuted, fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                            ({cls.student_count || 0} students)
                          </span>
                        </span>
                      </label>
                    ))}
                    <div style={{
                      marginTop: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                      paddingTop: '1rem',
                      borderTop: `1px solid ${B.borderLight}`,
                    }}>
                      <button
                        type="button"
                        onClick={handleSelectAllClasses}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllClasses}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        Clear All
                      </button>
                    </div>
                  </>
                )}
              </div>

              {selectedClassIds.length > 0 && (
                <p style={{
                  fontSize: '0.85rem',
                  color: B.brown,
                  fontWeight: 500,
                  margin: '0.5rem 0 0 0',
                }}>
                  ✅ Assigned to: {selectedClassNames}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: WRITING PROMPT */}
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: `1px solid ${B.borderLight}`,
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: B.darkBrown,
              marginTop: 0,
              marginBottom: '1.5rem',
            }}>
              Writing Prompt
            </h3>

            {/* Prompt Source Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: B.darkBrown,
                marginBottom: '0.75rem',
              }}>
                How do you want to add the prompt?
              </p>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="promptSource"
                  value="saved"
                  checked={promptSource === 'saved'}
                  onChange={(e) => setPromptSource(e.target.value)}
                  style={{ marginRight: '0.75rem', marginTop: '0.25rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem' }}>
                  Use saved prompt from library
                  <span style={{ display: 'block', fontSize: '0.85rem', color: B.textMuted, marginTop: '0.25rem' }}>
                    Select from previously created prompts
                  </span>
                </span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="promptSource"
                  value="ingredients"
                  checked={promptSource === 'ingredients'}
                  onChange={(e) => setPromptSource(e.target.value)}
                  style={{ marginRight: '0.75rem', marginTop: '0.25rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem' }}>
                  Build with ingredients (genre + elements)
                  <span style={{ display: 'block', fontSize: '0.85rem', color: B.textMuted, marginTop: '0.25rem' }}>
                    Specify genre and optional prompt elements
                  </span>
                </span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="promptSource"
                  value="generator"
                  checked={promptSource === 'generator'}
                  onChange={(e) => setPromptSource(e.target.value)}
                  style={{ marginRight: '0.75rem', marginTop: '0.25rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem' }}>
                  Generate with AI
                  <span style={{ display: 'block', fontSize: '0.85rem', color: B.textMuted, marginTop: '0.25rem' }}>
                    AI will create a prompt based on type
                  </span>
                </span>
              </label>
            </div>

            {/* Conditional Prompt Sections */}

            {/* SAVED PROMPTS */}
            {promptSource === 'saved' && (
              <div style={{
                backgroundColor: B.sand,
                padding: '1.25rem',
                borderRadius: '6px',
                border: `1px solid ${B.borderLight}`,
              }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: B.darkBrown,
                }}>
                  Select Saved Prompt
                </label>

                <select
                  value={selectedPromptId || ''}
                  onChange={(e) => setSelectedPromptId(e.target.value || null)}
                  disabled={loadingPrompts || savedPrompts.length === 0}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${B.borderLight}`,
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    marginBottom: '0.75rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">
                    {loadingPrompts ? 'Loading prompts...' : 'Choose a saved prompt...'}
                  </option>
                  {savedPrompts.map(prompt => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.title}
                    </option>
                  ))}
                </select>

                {selectedPrompt && (
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '1rem',
                    borderLeft: `4px solid ${B.brown}`,
                    borderRadius: '4px',
                    marginTop: '0.75rem',
                  }}>
                    <p style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: B.darkBrown,
                      marginBottom: '0.5rem',
                    }}>
                      Preview:
                    </p>
                    <p style={{
                      fontSize: '0.9rem',
                      color: B.darkBrown,
                      lineHeight: '1.6',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {selectedPrompt.content}
                    </p>
                  </div>
                )}

                {savedPrompts.length === 0 && !loadingPrompts && (
                  <p style={{
                    fontSize: '0.85rem',
                    color: B.textMuted,
                    fontStyle: 'italic',
                    margin: '0.5rem 0 0 0',
                  }}>
                    No saved prompts yet. Create one using another prompt source, then save it!
                  </p>
                )}
              </div>
            )}

            {/* INGREDIENTS */}
            {promptSource === 'ingredients' && (
              <div style={{
                backgroundColor: B.sand,
                padding: '1.25rem',
                borderRadius: '6px',
                border: `1px solid ${B.borderLight}`,
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
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
                      boxSizing: 'border-box',
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
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: B.darkBrown,
                  }}>
                    Prompt Ingredients (optional)
                  </label>
                  <textarea
                    value={promptIngredients}
                    onChange={(e) => setPromptIngredients(e.target.value)}
                    placeholder="e.g., A mysterious stranger arrives at midnight... There's a secret that changes everything..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${B.borderLight}`,
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* GENERATOR */}
            {promptSource === 'generator' && (
              <div style={{
                backgroundColor: B.sand,
                padding: '1.25rem',
                borderRadius: '6px',
                border: `1px solid ${B.borderLight}`,
              }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: B.darkBrown,
                }}>
                  Generator Type
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
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select generator type...</option>
                  <option value="OpenEnded">Open-Ended</option>
                  <option value="Structured">Structured</option>
                  <option value="ImageBased">Image-Based</option>
                  <option value="Dialogue">Dialogue</option>
                </select>
              </div>
            )}
          </div>

          {/* SECTION 3: GRADING SETUP */}
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: `1px solid ${B.borderLight}`,
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: B.darkBrown,
              marginTop: 0,
              marginBottom: '1.5rem',
            }}>
              Grading Setup
            </h3>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={useRubric}
                onChange={(e) => setUseRubric(e.target.checked)}
                style={{ marginRight: '0.75rem', cursor: 'pointer' }}
              />
              <span style={{
                fontWeight: 600,
                color: B.darkBrown,
                cursor: 'pointer',
              }}>
                Use rubric for grading this assignment?
              </span>
            </label>

            {!useRubric && (
              <p style={{
                fontSize: '0.9rem',
                color: B.textMuted,
                fontStyle: 'italic',
                margin: 0,
              }}>
                Teachers will grade freestyle (no rubric structure)
              </p>
            )}

            {useRubric && (
              <div style={{
                backgroundColor: B.sand,
                padding: '1.25rem',
                borderRadius: '6px',
                border: `1px solid ${B.borderLight}`,
              }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: B.darkBrown,
                }}>
                  Select or Create Rubric
                </label>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
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
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">
                      {loadingRubrics ? 'Loading rubrics...' : 'Select existing rubric...'}
                    </option>
                    {availableRubrics.map(rubric => (
                      <option key={rubric.id} value={rubric.id}>
                        {rubric.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowRubricBuilder(true)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      backgroundColor: '#fff',
                      border: `2px solid ${B.brown}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: B.brown,
                      whiteSpace: 'nowrap',
                      fontSize: '0.9rem',
                    }}
                  >
                    + Create New
                  </button>
                </div>

                {selectedRubric && (
                  <p style={{
                    fontSize: '0.85rem',
                    color: B.brown,
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    ✅ {selectedRubric.name} selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: DETAILS */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: B.darkBrown,
              marginTop: 0,
              marginBottom: '1.5rem',
            }}>
              Details
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: B.darkBrown,
                }}>
                  Word Count (optional)
                </label>
                <input
                  type="text"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  placeholder="e.g., 500-1000"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${B.borderLight}`,
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
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
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
          }}>
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
              disabled={loading || selectedClassIds.length === 0 || !title.trim()}
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
              {loading ? 'Creating...' : selectedClassIds.length > 1 ? `Create for ${selectedClassIds.length} Classes` : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>

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