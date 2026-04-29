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

export default function AssignModal({ prompt, onClose, onAssigned }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classMembers, setClassMembers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [target, setTarget] = useState('class');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      setClasses(data || []);
      if (data && data.length > 0) setSelectedClassId(data[0].id);
      setLoading(false);
    };
    fetchClasses();
  }, [user.id]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedClassId) { setClassMembers([]); return; }
      const { data } = await supabase
        .from('class_members')
        .select('*, users!class_members_student_id_fkey(*)')
        .eq('class_id', selectedClassId);
      setClassMembers((data || []).filter(m => m.users));
      setSelectedStudentId('');
    };
    fetchMembers();
  }, [selectedClassId]);

  const handleAssign = async () => {
    if (!title.trim()) { setError('Please enter an assignment title.'); return; }
    if (!selectedClassId) { setError('Please select a class.'); return; }
    if (!dueDate) { setError('Please set a due date.'); return; }
    if (target === 'student' && !selectedStudentId) { setError('Please select a student.'); return; }
    setSaving(true);
    setError(null);

    const payload = {
      teacher_id: user.id,
      class_id: target === 'class' ? selectedClassId : null,
      student_id: target === 'student' ? selectedStudentId : null,
      title: title.trim(),
      prompt_type: prompt.prompt_type,
      word_count: prompt.wordCount || prompt.word_count,
      genre: prompt.genre || null,
      action: prompt.action || null,
      word: prompt.word || null,
      location: prompt.location || null,
      object: prompt.object || null,
      due_date: dueDate,
    };

    const { error: insertError } = await supabase
      .from('assignments')
      .insert(payload);

    if (insertError) { setError('Failed to assign: ' + insertError.message); setSaving(false); return; }
    setSaving(false);
    onAssigned();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div onClick={handleBackdropClick} style={{ position: 'fixed', inset: 0, background: 'rgba(58,50,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.25rem' }}>
      <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(58,50,38,0.18)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: B.ink, marginBottom: '0.2rem' }}>Assign prompt</h2>
            <div style={{ fontSize: '0.75rem', color: B.inkLight }}>
              {prompt.genre} · {prompt.wordCount || prompt.word_count} words
              {prompt.action ? ` · ${prompt.action}` : ''}
              {prompt.location ? ` · ${prompt.location}` : ''}
              {prompt.word ? ` · ${prompt.word}` : ''}
              {prompt.object ? ` · ${prompt.object}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: B.inkLight, cursor: 'pointer', lineHeight: 1, flexShrink: 0, marginLeft: '1rem' }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: B.inkLight, fontStyle: 'italic', fontSize: '0.9rem' }}>Loading your classes...</div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: B.inkLight, fontSize: '0.9rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>You don't have any classes yet.</div>
            <div style={{ fontSize: '0.82rem' }}>Create a class in your <a href="/classroom" style={{ color: B.seaDeep, fontWeight: 600 }}>Classroom Dashboard</a> first.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Assignment title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Week 4 Horror Challenge"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Class</label>
              <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Assign to</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['class', 'student'].map(t => (
                  <button key={t} onClick={() => setTarget(t)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1.5px solid ${target === t ? B.terra : B.sandDeep}`, background: target === t ? B.terra : 'transparent', color: target === t ? B.white : B.inkMid, fontFamily: 'sans-serif', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
                    {t === 'class' ? 'Whole class' : 'Individual student'}
                  </button>
                ))}
              </div>
            </div>

            {target === 'student' && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Student</label>
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Choose a student...</option>
                  {classMembers.map(m => (
                    <option key={m.student_id} value={m.student_id}>{m.users.display_name || m.users.username}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: B.inkMid, display: 'block', marginBottom: '0.4rem' }}>Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </div>

            {error && (
              <div style={{ background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '8px', color: B.terraDark, padding: '0.75rem', fontSize: '0.82rem' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${B.sandDeep}`, borderRadius: '10px', color: B.inkMid, padding: '0.7rem', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAssign} disabled={saving}
                style={{ flex: 2, background: saving ? B.sandDeep : B.seaDeep, color: B.white, border: 'none', borderRadius: '10px', padding: '0.7rem', fontWeight: 600, fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Assigning...' : 'Assign to class'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}