import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', seaMid: '#5B9EC9', seaDeep: '#2E6DA4',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878', white: '#FFFCF8',
};

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#F5EFE6',
  borderRadius: '8px',
  color: '#3A3226',
  fontFamily: 'sans-serif',
  fontSize: '0.95rem',
  padding: '0.6rem 0.9rem',
  outline: 'none',
};

export default function StoryModal({ prompt, onClose, onSaved, assignmentId, dailyPromptId, isStudentSubmission }) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [sharing, setSharing] = useState('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);

  const targetWordCount = prompt.word_count || prompt.wordCount;
  const currentWordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const minWords = Math.floor(targetWordCount * 0.9);
  const maxWords = Math.ceil(targetWordCount * 1.1);
  const withinRange = currentWordCount >= minWords && currentWordCount <= maxWords;

  const isStudent = isStudentSubmission || (profile && (profile.account_type === 'minor' || profile.account_type === 'student'));
  const canSubmit = isStudent ? content.trim().length > 0 : withinRange && currentWordCount > 0;

  useEffect(() => {
    const fetchExisting = async () => {
      let data = null;

      if (dailyPromptId) {
        // Fetch by daily_prompt_id
        const { data: byDaily } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('daily_prompt_id', dailyPromptId)
          .maybeSingle();
        data = byDaily;
      } else if (assignmentId) {
        // Fetch by assignment_id
        const { data: byAssignment } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('assignment_id', assignmentId)
          .maybeSingle();
        data = byAssignment;
      } else {
        // Fetch by prompt_id
        const promptId = prompt.id || prompt.dbId;
        if (!promptId) return;
        const { data: byPrompt } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('prompt_id', promptId)
          .maybeSingle();
        data = byPrompt;
      }

      if (data) {
        setExistingSubmission(data);
        setContent(data.content || '');
        setTitle(data.title || '');
        setSharing(data.sharing || 'private');
      }
    };
    fetchExisting();
  }, [user.id, prompt, assignmentId, dailyPromptId]);

  const handleSave = async () => {
    if (!content.trim()) { setError('Please write your story before saving.'); return; }
    if (!isStudent && !withinRange) {
      setError(`Your story is ${currentWordCount} words. It must be between ${minWords} and ${maxWords} words to submit.`);
      return;
    }
    setLoading(true);
    setError(null);

    if (existingSubmission) {
      const updates = {
        content: content.trim(),
        title: title.trim() || null,
        word_count: currentWordCount,
        updated_at: new Date().toISOString(),
      };
      if (!isStudent) updates.sharing = sharing;
      if (isStudent && assignmentId) updates.submitted_to_teacher = true;
      const { error: updateError } = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', existingSubmission.id);
      if (updateError) { setError('Failed to save: ' + updateError.message); setLoading(false); return; }
    } else {
      const insert = {
        user_id: user.id,
        prompt_id: prompt.id || prompt.dbId || null,
        content: content.trim(),
        title: title.trim() || null,
        word_count: currentWordCount,
        prompt_type: prompt.prompt_type,
        genre: prompt.genre || null,
      };
      if (dailyPromptId) {
        insert.daily_prompt_id = dailyPromptId;
        insert.sharing = isStudent ? 'private' : sharing;
      } else if (isStudent) {
        insert.submitted_to_teacher = true;
        insert.sharing = 'private';
        if (assignmentId) insert.assignment_id = assignmentId;
      } else {
        insert.sharing = sharing;
      }
      const { error: insertError } = await supabase
        .from('submissions')
        .insert(insert);
      if (insertError) { setError('Failed to save: ' + insertError.message); setLoading(false); return; }
    }

    setLoading(false);
    onSaved();
    onClose();
  };

  const wordCountColor = () => {
    if (currentWordCount === 0) return B.inkLight;
    if (isStudent) return currentWordCount > 0 ? '#3A7040' : B.inkLight;
    if (withinRange) return '#3A7040';
    return B.terraDark;
  };

  const promptIngredients = [
    prompt.action && `Action: ${prompt.action}`,
    prompt.location && `Location: ${prompt.location}`,
    prompt.word && `Word: ${prompt.word}`,
    prompt.object && `Object: ${prompt.object}`,
  ].filter(Boolean).join(' · ');

  const modalTitle = dailyPromptId
    ? (existingSubmission ? 'Edit today\'s story' : 'Write today\'s story')
    : existingSubmission ? 'Edit your story'
    : isStudent ? 'Submit your story'
    : 'Add your story';

  const saveLabel = loading ? 'Saving...'
    : existingSubmission ? 'Save changes'
    : dailyPromptId ? 'Save story'
    : isStudent ? 'Submit to teacher'
    : 'Save story';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,50,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.25rem' }}>
      <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(58,50,38,0.18)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: B.ink, marginBottom: '0.25rem' }}>{modalTitle}</h2>
            <div style={{ fontSize: '0.78rem', color: B.inkLight }}>
              {[prompt.genre, targetWordCount && `${targetWordCount} words`, promptIngredients].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: B.inkLight, cursor: 'pointer', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>×</button>
        </div>

        {dailyPromptId && (
          <div style={{ background: '#FDF5E8', border: '1px solid #C8A060', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#9A6830' }}>
            ✨ Today's daily challenge — resets at midnight.
          </div>
        )}

        {isStudent && assignmentId && (
          <div style={{ background: '#EAF4FB', border: '1px solid #5B9EC9', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#2E6DA4' }}>
            📋 This story will be submitted to your teacher.
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your story a title..."
            maxLength={100}
            style={{ ...inputBase, border: `1px solid ${B.sandDeep}` }}
          />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid }}>Your story</label>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: wordCountColor() }}>
              {currentWordCount}{!isStudent && ` / ${targetWordCount}`} words
              {!isStudent && currentWordCount > 0 && !withinRange && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 400 }}>
                  ({currentWordCount < minWords ? `${minWords - currentWordCount} more needed` : `${currentWordCount - maxWords} too many`})
                </span>
              )}
              {(!isStudent ? withinRange : currentWordCount > 0) && currentWordCount > 0 && <span style={{ marginLeft: '0.5rem' }}>✓</span>}
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste or write your story here..."
            rows={12}
            style={{
              ...inputBase,
              border: `1.5px solid ${canSubmit ? '#6BAF72' : B.sandDeep}`,
              fontFamily: 'Georgia, serif',
              lineHeight: 1.7,
              resize: 'vertical',
            }}
          />
        </div>

        {!isStudent && (
          <div style={{ background: B.sand, borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '1rem', fontSize: '0.75rem', color: B.inkLight }}>
            Target: {minWords}–{maxWords} words for a {targetWordCount}-word challenge
          </div>
        )}

        {!isStudent && !dailyPromptId && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.5rem' }}>Sharing</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[{ value: 'private', label: 'Private', desc: 'Only visible to you' }, { value: 'public', label: 'Public', desc: 'Show on your public profile' }].map(option => (
                <div key={option.value} onClick={() => setSharing(option.value)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: `1.5px solid ${sharing === option.value ? B.terra : B.sandDeep}`, background: sharing === option.value ? '#FDF0E8' : 'transparent', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600, color: B.ink, fontSize: '0.88rem', marginBottom: '0.15rem' }}>{option.label}</div>
                  <div style={{ fontSize: '0.75rem', color: B.inkLight }}>{option.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div style={{ background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '8px', color: B.terraDark, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${B.sandDeep}`, borderRadius: '10px', color: B.inkMid, padding: '0.75rem', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading || !canSubmit}
            style={{ flex: 2, background: loading ? B.sandDeep : B.seaDeep, color: B.white, border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.9rem', cursor: loading || !canSubmit ? 'not-allowed' : 'pointer', opacity: !canSubmit && !loading ? 0.5 : 1 }}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}