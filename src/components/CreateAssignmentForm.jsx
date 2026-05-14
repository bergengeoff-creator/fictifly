import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', seaMid: '#5B9EC9', seaDeep: '#2E6DA4',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878', white: '#FFFCF8',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: B.sand,
  border: `1px solid ${B.sandDeep}`, borderRadius: '8px', color: B.ink,
  fontFamily: 'sans-serif', fontSize: '0.9rem', padding: '0.6rem 0.9rem', outline: 'none',
};

export default function CreateAssignmentForm({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userTier, setUserTier] = useState('standard');

  // Prompt ingredients
  const [promptType, setPromptType] = useState('microfiction');
  const [wordCount, setWordCount] = useState(100);
  const [genre, setGenre] = useState('');
  const [action, setAction] = useState('');
  const [word, setWord] = useState('');
  const [location, setLocation] = useState('');
  const [object, setObject] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // Grading settings
  const [gradingFormat, setGradingFormat] = useState('none');
  const [gradeMaxPoints, setGradeMaxPoints] = useState(100);
  const [customScale, setCustomScale] = useState('');
  const [feedbackVisibility, setFeedbackVisibility] = useState(false);
  const [allowStudentReplies, setAllowStudentReplies] = useState(false);
  const [maxReplies, setMaxReplies] = useState(1);
  const [replyExpirationDays, setReplyExpirationDays] = useState(14);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      setClasses(classesData || []);

      // Fetch user tier
      const { data: profileData } = await supabase
        .from('users')
        .select('account_type, is_premium')
        .eq('id', user.id)
        .single();

      if (profileData?.is_premium || profileData?.account_type === 'premium') {
        setUserTier('premium');
      }

      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  const handleGenerateAI = async () => {
    if (!aiInput.trim()) {
      setError('Please describe the prompt you want to generate.');
      return;
    }

    setGeneratingAI(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'generate_prompt_ingredients',
          description: aiInput,
          promptType: promptType,
          wordCount: wordCount,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setGeneratingAI(false);
        return;
      }

      // Populate fields with generated ingredients
      setGenre(data.genre || '');
      setAction(data.action || '');
      setWord(data.word || '');
      setLocation(data.location || '');
      setObject(data.object || '');
      setShowAIGenerator(false);
      setAiInput('');
    } catch (err) {
      setError('Failed to generate prompt ingredients. Please try again.');
      console.error('AI generation error:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter an assignment title.');
      return;
    }
    if (selectedClassIds.length === 0) {
      setError('Please select at least one class.');
      return;
    }
    if (!dueDate) {
      setError('Please set a due date.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Parse custom scale
      let parsedCustomScale = null;
      if (gradingFormat === 'custom' && customScale) {
        parsedCustomScale = customScale.split(',').map(s => s.trim());
      }

      // Create separate assignment for each selected class
      const assignments = selectedClassIds.map(classId => ({
        teacher_id: user.id,
        class_id: classId,
        title: title.trim(),
        prompt_type: promptType,
        word_count: wordCount,
        genre: genre || null,
        action: action || null,
        word: word || null,
        location: location || null,
        object: object || null,
        due_date: dueDate,
        grading_format: gradingFormat,
        grade_max_points: gradingFormat === 'points' ? gradeMaxPoints : null,
        grade_custom_scale: parsedCustomScale,
        allow_student_replies: allowStudentReplies,
        reply_settings: {
          max_replies: maxReplies,
          expiration_days: replyExpirationDays,
        },
      }));

      const { error: insertError } = await supabase
        .from('assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      setSaving(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Failed to create assignment: ' + err.message);
      setSaving(false);
    }
  };

  const toggleClass = (classId) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,50,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.25rem' }}>
        <div style={{ background: B.white, borderRadius: '16px', padding: '2rem', textAlign: 'center', color: B.inkLight }}>Loading...</div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,50,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.25rem' }}>
        <div style={{ background: B.white, borderRadius: '16px', padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ color: B.inkLight, marginBottom: '0.5rem' }}>You don't have any classes yet.</div>
          <div style={{ fontSize: '0.9rem', color: B.inkMid, marginBottom: '1.5rem' }}>Create a class in your <a href="/classroom" style={{ color: B.seaDeep, fontWeight: 600 }}>Classroom Dashboard</a> first.</div>
          <button onClick={onClose} style={{ background: B.seaDeep, color: B.white, border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,50,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.25rem' }}>
      <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(58,50,38,0.18)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: B.ink, margin: 0 }}>Create assignment</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: B.inkLight, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Assignment Title & Due Date */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Assignment title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Week 5 Challenge: Mystery Stories"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Prompt Type & Word Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Prompt type</label>
              <select value={promptType} onChange={e => setPromptType(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="microfiction">Microfiction</option>
                <option value="flash_fiction">Flash Fiction</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Word count</label>
              <select value={wordCount} onChange={e => setWordCount(Number(e.target.value))} style={{ ...inputStyle, appearance: 'none' }}>
                <option value={100}>100 words</option>
                <option value={200}>200 words</option>
                <option value={300}>300 words</option>
                <option value={500}>500 words</option>
                <option value={1000}>1,000 words</option>
              </select>
            </div>
          </div>

          {/* Prompt Ingredients */}
          <div style={{ borderTop: `1px solid ${B.sandDeep}`, paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid }}>Prompt ingredients</label>
              <button
                onClick={() => setShowAIGenerator(!showAIGenerator)}
                style={{ fontSize: '0.75rem', color: B.seaDeep, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                {showAIGenerator ? 'Hide' : '✨ Generate with AI'}
              </button>
            </div>

            {showAIGenerator && (
              <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#EAF4FB', borderRadius: '8px' }}>
                <textarea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Describe the prompt you want: e.g., 'A mysterious heist set in a library with a hidden betrayal'"
                  style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', fontSize: '0.85rem' }}
                />
                <button
                  onClick={handleGenerateAI}
                  disabled={generatingAI || !aiInput.trim()}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: generatingAI || !aiInput.trim() ? B.sandDeep : B.seaDeep,
                    color: B.white,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: generatingAI || !aiInput.trim() ? 'not-allowed' : 'pointer',
                  }}>
                  {generatingAI ? 'Generating...' : 'Generate'}
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.25rem' }}>Genre</label>
                <input type="text" value={genre} onChange={e => setGenre(e.target.value)} style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.5rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.25rem' }}>Action</label>
                <input type="text" value={action} onChange={e => setAction(e.target.value)} style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.5rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.25rem' }}>Word</label>
                <input type="text" value={word} onChange={e => setWord(e.target.value)} style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.5rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.25rem' }}>Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.5rem' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.25rem' }}>Object</label>
                <input type="text" value={object} onChange={e => setObject(e.target.value)} style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.5rem' }} />
              </div>
            </div>
          </div>

          {/* Multi-Class Selection */}
          <div style={{ borderTop: `1px solid ${B.sandDeep}`, paddingTop: '1rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Assign to classes</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto', padding: '0.5rem', background: B.sand, borderRadius: '8px', border: `1px solid ${B.sandDeep}` }}>
              {classes.map(cls => (
                <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedClassIds.includes(cls.id)}
                    onChange={() => toggleClass(cls.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{cls.name}</span>
                </label>
              ))}
            </div>
            {selectedClassIds.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: B.inkLight, marginTop: '0.3rem' }}>{selectedClassIds.length} class{selectedClassIds.length !== 1 ? 'es' : ''} selected</div>
            )}
          </div>

          {/* Grading Settings */}
          <div style={{ borderTop: `1px solid ${B.sandDeep}`, paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: B.terra, marginBottom: '0.75rem' }}>Grading & Feedback</h3>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.3rem' }}>Grading format</label>
              <select value={gradingFormat} onChange={e => setGradingFormat(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="none">Feedback only (no grade)</option>
                <option value="five_point">5-Point Scale (★★★★★)</option>
                <option value="letter_grade">Letter Grade (A, B, C...)</option>
                <option value="points">Points (e.g., 85/100)</option>
                <option value="custom">Custom Scale</option>
              </select>
            </div>

            {gradingFormat === 'points' && (
              <div style={{ marginBottom: '0.75rem', padding: '0.6rem', background: B.sand, borderRadius: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.3rem' }}>Maximum points</label>
                <input type="number" value={gradeMaxPoints} onChange={e => setGradeMaxPoints(Number(e.target.value))} min="1" style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.5rem' }} />
              </div>
            )}

            {gradingFormat === 'custom' && (
              <div style={{ marginBottom: '0.75rem', padding: '0.6rem', background: B.sand, borderRadius: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.3rem' }}>Define scale (comma-separated)</label>
                <input type="text" value={customScale} onChange={e => setCustomScale(e.target.value)} placeholder="e.g. Developing, Proficient, Advanced" style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.5rem' }} />
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={feedbackVisibility} onChange={e => setFeedbackVisibility(e.target.checked)} style={{ cursor: 'pointer' }} />
              <span>Students can view feedback</span>
            </label>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.3rem' }}>Allow student replies?</label>
              <select value={allowStudentReplies ? 'yes' : 'no'} onChange={e => setAllowStudentReplies(e.target.value === 'yes')} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="no">No replies allowed</option>
                <option value="yes">Yes, allow replies</option>
              </select>

              {allowStudentReplies && (
                <div style={{ marginTop: '0.6rem', padding: '0.6rem', background: B.sand, borderRadius: '6px' }}>
                  {userTier === 'premium' ? (
                    <>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.2rem' }}>Max replies per comment</label>
                        <select value={maxReplies} onChange={e => setMaxReplies(e.target.value === 'unlimited' ? null : Number(e.target.value))} style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.4rem', appearance: 'none' }}>
                          <option value="1">Max 1 reply</option>
                          <option value="3">Max 3 replies</option>
                          <option value="unlimited">Unlimited replies</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.2rem' }}>Replies expire after (days)</label>
                        <input type="number" value={replyExpirationDays} onChange={e => setReplyExpirationDays(Number(e.target.value))} min="1" max="90" style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.4rem' }} />
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: B.inkMid, margin: 0 }}>Students can reply once per comment (no expiration)</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '8px', color: B.terraDark, padding: '0.75rem', fontSize: '0.82rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${B.sandDeep}`, borderRadius: '10px', color: B.inkMid, padding: '0.75rem', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving}
              style={{ flex: 2, background: saving ? B.sandDeep : B.seaDeep, color: B.white, border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Creating...' : `Create for ${selectedClassIds.length} class${selectedClassIds.length !== 1 ? 'es' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}