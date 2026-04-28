import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', seaMid: '#5B9EC9', seaDeep: '#2E6DA4',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878', white: '#FFFCF8',
};

export default function StoryModal({ prompt, onClose, onSaved }) {
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchExisting = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('prompt_id', prompt.id || prompt.dbId)
        .maybeSingle();
      if (data) {
        setExistingSubmission(data);
        setContent(data.content || '');
        setTitle(data.title || '');
        setSharing(data.sharing || 'private');
      }
    };
    fetchExisting();
  }, [user.id, prompt]);

  const handleSave = async () => {
    if (!content.trim()) { setError('Please write your story before saving.'); return; }
    if (!withinRange) {
      setError(`Your story is ${currentWordCount} words. It must be between ${minWords} and ${maxWords} words to submit.`);
      return;
    }
    setLoading(true);
    setError(null);

    if (existingSubmission) {
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ content: content.trim(), title: title.trim() || null, sharing, word_count: currentWordCount, updated_at: new Date().toISOString() })
        .eq('id', existingSubmission.id);
      if (updateError) { setError('Failed to save: ' + updateError.message); setLoading(false); return; }
    } else {
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({ user_id: user.id, prompt_id: prompt.id || prompt.dbId, content: content.trim(), title: title.trim() || null, sharing, word_count: currentWordCount, prompt_type: prompt.prompt_type, genre: prompt.genre });
      if (insertError) { setError('Failed to save: ' + insertError.message); setLoading(false); return; }
    }

    setLoading(false);
    onSaved();
    onClose();
  };

  const wordCountColor = () => {
    if (currentWordCount === 0) return B.inkLight;
    if (withinRange) return '#3A7040';
    if (currentWordCount < minWords) return B.terraDark;
    return B.terraDark;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,50,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.25rem' }}>
      <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(58,50,38,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: B.ink, marginBottom: '0.25rem' }}>
              {existingSubmission ? 'Edit your story' : 'Add your story'}
            </h2>
            <div style={{ fontSize: '0.78rem', color: B.inkLight }}>
              {prompt.genre} · {targetWordCount} words · {prompt.action || prompt.location || ''} · {prompt.word || prompt.object || ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: B.inkLight, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Title (optional)</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your story a title..." maxLength={100}
            style={{ width: '100%', background: B.sand, border: `1px solid ${B.sandDeep}`, borderRadius: '8px', color: B.ink, fontFamily: 'sans-serif', fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: B.inkMid }}>Your story</label>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: wordCountColor() }}>
              {currentWordCount} / {targetWordCount} words
              {currentWordCount > 0 && !withinRange && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 400 }}>
                  ({currentWordCount < minWords ? `${minWords - currentWordCount} more needed` : `${currentWordCount - maxWords} too many`})
                </span>
              )}
              {withinRange && currentWordCount > 0 && <span style={{ marginLeft: '0.5rem' }}>✓</span>}
            </div>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Paste or write your story here..." rows={12}
            style={{ width: '100%', background: B.sand, border: `1.5px solid ${withinRange && currentWordCount > 0 ? '#6BAF72' : B.sandDeep}`, borderRadius: '8px', color: B.ink, fontFamily: 'Georgia, serif', fontSize: '0.95rem', lineHeight: 1.7, padding: '0.75rem 0.9rem', outline: 'none', resize: 'vertical' }} />
        </div>

        <div style={{ background: B.sand, borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '1rem', fontSize: '0.75rem', color: B.inkLight }}>
          Target: {minWords}–{maxWords} words for a {targetWordCount}-word challenge
        </div>

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

        {error && <div style={{ background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '8px', color: B.terraDark, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${B.sandDeep}`, borderRadius: '10px', color: B.inkMid, padding: '0.75rem', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading || (!withinRange && currentWordCount > 0)}
            style={{ flex: 2, background: loading ? B.sandDeep : B.seaDeep, color: B.white, border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 600, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : existingSubmission ? 'Save changes' : 'Save story'}
          </button>
        </div>
      </div>
    </div>
  );
}
