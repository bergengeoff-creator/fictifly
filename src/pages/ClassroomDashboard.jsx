import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const GRADE_LEVELS = ['Elementary (K-5)', 'Middle School (6-8)', 'High School (9-12)', 'Other'];
const GENRES = [
  'Action/Adventure','Comedy','Crime Caper','Drama','Fairy Tale','Fantasy',
  'Ghost Story','Historical Fiction','Horror','Mystery','Political Satire',
  'Romance','Romantic Comedy','Sci-Fi','Spy','Suspense','Thriller','Open Genre',
];

const adjectives = ['Swift','Brave','Clever','Bold','Bright','Calm','Keen','Wise','Wild','Quiet','Sharp','Cool','Gentle','Merry','Noble'];
const nouns = ['Penguin','Narrator','Scribe','Author','Dreamer','Writer','Poet','Falcon','Otter','Fox','Raven','Panda','Tiger','Koala','Wolf'];

const generateUsername = (prefix) => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return prefix ? prefix + '_' + adj + noun + num : adj + noun + num;
};
const generatePasscode = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateClassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const sectionStyle = { background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem' };
const inputStyle = { width: '100%', background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#3A3226', fontFamily: 'sans-serif', fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' };
const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', display: 'block', marginBottom: '0.5rem' };
const btnPrimary = { background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' };
const btnSecondary = { background: 'transparent', color: '#6B5D4E', border: '1px solid #D9C9B0', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' };

const FictiflyLogo = () => (
  <svg viewBox="0 0 250 45" xmlns="http://www.w3.org/2000/svg" style={{ width: '200px', height: '35px', display: 'block' }}>
    <text x="0" y="28" fontSize="28" fontWeight="600" letterSpacing="-1.5" fontFamily="system-ui, sans-serif">
      <tspan fill="#3A3226">ficti</tspan><tspan fill="#D4845A">fly</tspan>
    </text>
    <rect x="0" y="34" width="16" height="3" rx="1.5" fill="#5B9EC9" opacity="0.35"/>
    <rect x="20" y="33" width="19" height="4" rx="2" fill="#5B9EC9" opacity="0.55"/>
    <rect x="43" y="32" width="21" height="5" rx="2.5" fill="#5B9EC9" opacity="0.75"/>
    <rect x="68" y="31" width="24" height="6" rx="3" fill="#5B9EC9"/>
    <rect x="96" y="31" width="24" height="6" rx="3" fill="none" stroke="#D9C9B0" strokeWidth="1"/>
    <rect x="124" y="31" width="24" height="6" rx="3" fill="none" stroke="#D9C9B0" strokeWidth="1"/>
    <rect x="152" y="31" width="24" height="6" rx="3" fill="none" stroke="#D9C9B0" strokeWidth="1"/>
  </svg>
);

export default function ClassroomDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classMembers, setClassMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('classes');
  const [classDetailTab, setClassDetailTab] = useState('students');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showBulkGenerate, setShowBulkGenerate] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkCount, setBulkCount] = useState(5);
  const [generatedAccounts, setGeneratedAccounts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentPromptType, setAssignmentPromptType] = useState('microfiction');
  const [assignmentWordCount, setAssignmentWordCount] = useState(100);
  const [assignmentGenre, setAssignmentGenre] = useState('');
  const [assignmentAction, setAssignmentAction] = useState('');
  const [assignmentWord, setAssignmentWord] = useState('');
  const [assignmentLocation, setAssignmentLocation] = useState('');
  const [assignmentObject, setAssignmentObject] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentTarget, setAssignmentTarget] = useState('class');
  const [assignmentStudentId, setAssignmentStudentId] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Submission review
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [savingFeedback, setSavingFeedback] = useState({});

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    setClasses(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    if (profile && profile.account_type !== 'teacher') navigate('/dashboard');
    fetchClasses();
  }, [profile, navigate, fetchClasses]);

  const fetchClassMembers = async (classId) => {
    const { data } = await supabase
      .from('class_members')
      .select('*, users(*)')
      .eq('class_id', classId);
    setClassMembers(data || []);
  };

  const fetchAssignments = async (classId) => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    if (!data) { setAssignments([]); return; }
    const withCounts = await Promise.all(data.map(async (a) => {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('assignment_id', a.id)
        .eq('submitted_to_teacher', true);
      return { ...a, submissionCount: count || 0 };
    }));
    setAssignments(withCounts);
  };

  const fetchAssignmentSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    const { data: subs } = await supabase
      .from('submissions')
      .select('*, users(username, display_name)')
      .eq('assignment_id', assignment.id)
      .eq('submitted_to_teacher', true);
    setAssignmentSubmissions(subs || []);
    const map = {};
    (subs || []).forEach(s => { map[s.id] = s.teacher_feedback || ''; });
    setFeedbackMap(map);
  };

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setView('class-detail');
    setClassDetailTab('students');
    setSelectedAssignment(null);
    await fetchClassMembers(cls.id);
    await fetchAssignments(cls.id);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) { setError('Please enter a class name.'); return; }
    const classCode = generateClassCode();
    const { data, error: insertError } = await supabase
      .from('classes')
      .insert({ teacher_id: user.id, name: newClassName.trim(), grade_level: newClassGrade || null, class_code: classCode })
      .select().single();
    if (insertError) { setError('Failed to create class: ' + insertError.message); return; }
    setClasses(prev => [data, ...prev]);
    setShowCreateClass(false);
    setNewClassName('');
    setNewClassGrade('');
    setSuccess('Class created successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleBulkGenerate = async () => {
    if (!bulkPrefix.trim()) { setError('Please enter a username prefix.'); return; }
    if (bulkCount < 1 || bulkCount > 30) { setError('Please generate between 1 and 30 accounts.'); return; }
    if (classMembers.length + bulkCount > 30 && profile.account_type !== 'premium') {
      setError('Free accounts are limited to 30 students per class. Contact us at upgrade@fictifly.com to add more.');
      return;
    }
    setGenerating(true);
    setError(null);
    const accounts = Array.from({ length: bulkCount }, () => ({
      username: generateUsername(bulkPrefix.trim()),
      passcode: generatePasscode(),
    }));
    try {
      const response = await fetch('/api/create-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts, classId: selectedClass.id }),
      });
      const data = await response.json();
      const successful = data.results.filter(r => r.success);
      setGeneratedAccounts(successful);
      await fetchClassMembers(selectedClass.id);
    } catch (e) {
      setError('Something went wrong generating accounts. Please try again.');
    }
    setGenerating(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Student Account Cards - ' + selectedClass.name + '</title>');
    printWindow.document.write('<style>body{font-family:sans-serif;padding:20px;} .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;} .card{border:2px solid #D9C9B0;border-radius:8px;padding:16px;text-align:center;background:#FFFCF8;} .class-name{font-size:11px;color:#9A8878;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;} .username{font-size:14px;font-weight:700;color:#3A3226;margin-bottom:6px;} .passcode{font-size:20px;font-weight:700;color:#2E6DA4;letter-spacing:0.2em;margin-bottom:6px;} .label{font-size:10px;color:#9A8878;} @media print{.no-print{display:none;}}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2 style="color:#3A3226;margin-bottom:20px;">Student Login Cards — ' + selectedClass.name + '</h2>');
    printWindow.document.write('<div class="grid">');
    generatedAccounts.forEach(acc => {
      printWindow.document.write('<div class="card"><div class="class-name">' + selectedClass.name + '</div><div class="label">Username</div><div class="username">' + acc.username + '</div><div class="label">Passcode</div><div class="passcode">' + acc.passcode + '</div><div style="font-size:10px;color:#9A8878;margin-top:8px;">fictifly.com</div></div>');
    });
    printWindow.document.write('</div></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleCreateAssignment = async () => {
    if (!assignmentTitle.trim()) { setError('Please enter an assignment title.'); return; }
    if (!assignmentDueDate) { setError('Please set a due date.'); return; }
    if (assignmentTarget === 'student' && !assignmentStudentId) { setError('Please select a student.'); return; }
    setSavingAssignment(true);
    setError(null);
    const payload = {
      teacher_id: user.id,
      class_id: assignmentTarget === 'class' ? selectedClass.id : null,
      student_id: assignmentTarget === 'student' ? assignmentStudentId : null,
      title: assignmentTitle.trim(),
      prompt_type: assignmentPromptType,
      word_count: assignmentWordCount,
      genre: assignmentGenre || null,
      action: (assignmentPromptType === 'microfiction' || (assignmentPromptType === 'flash-fiction' && assignmentWordCount === 500)) ? (assignmentAction || null) : null,
      word: assignmentPromptType === 'microfiction' ? (assignmentWord || null) : null,
      location: assignmentPromptType === 'flash-fiction' && assignmentWordCount === 1000 ? (assignmentLocation || null) : null,
      object: assignmentPromptType === 'flash-fiction' ? (assignmentObject || null) : null,
      due_date: assignmentDueDate,
    };
    const { data, error: insertError } = await supabase
      .from('assignments')
      .insert(payload)
      .select().single();
    if (insertError) { setError('Failed to create assignment: ' + insertError.message); setSavingAssignment(false); return; }
    setAssignments(prev => [{ ...data, submissionCount: 0 }, ...prev]);
    setShowCreateAssignment(false);
    setAssignmentTitle('');
    setAssignmentGenre('');
    setAssignmentAction('');
    setAssignmentWord('');
    setAssignmentLocation('');
    setAssignmentObject('');
    setAssignmentDueDate('');
    setAssignmentTarget('class');
    setAssignmentStudentId('');
    setSavingAssignment(false);
    setSuccess('Assignment created!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSaveFeedback = async (submissionId) => {
    setSavingFeedback(prev => ({ ...prev, [submissionId]: true }));
    await supabase
      .from('submissions')
      .update({ teacher_feedback: feedbackMap[submissionId], feedback_at: new Date().toISOString() })
      .eq('id', submissionId);
    setSavingFeedback(prev => ({ ...prev, [submissionId]: false }));
    setSuccess('Feedback saved!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const wordCountOptions = assignmentPromptType === 'microfiction' ? [100, 200, 300] : [500, 1000];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9A8878', fontStyle: 'italic' }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <Link to="/dashboard" style={{ color: '#6B5D4E', textDecoration: 'none', fontSize: '0.85rem' }}>← Dashboard</Link>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
          <FictiflyLogo />
        </Link>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Classes list */}
        {view === 'classes' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.4rem' }}>Educator</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>My Classes</h1>
              </div>
              <button onClick={() => {
                if (classes.length >= 1 && profile.account_type !== 'premium') {
                  setError('Free accounts are limited to 1 class. Contact us to upgrade for unlimited classes.');
                  return;
                }
                setError(null);
                setShowCreateClass(true);
              }} style={btnPrimary}>+ New Class</button>
            </div>

            {error && !showCreateClass && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '10px', color: '#B56840', padding: '0.85rem 1.1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            {success && <div style={{ background: '#F0F7ED', border: '1px solid #6BAF72', borderRadius: '10px', color: '#3A7040', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>{success}</div>}

            {showCreateClass && (
              <div style={sectionStyle}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Create a new class</h3>
                <label style={labelStyle}>Class name
                  <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g. Period 1 Creative Writing" style={{ ...inputStyle, marginTop: '0.4rem', marginBottom: '0.75rem' }} />
                </label>
                <label style={labelStyle}>Grade level (optional)
                  <select value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)} style={{ ...inputStyle, marginTop: '0.4rem', appearance: 'none' }}>
                    <option value="">Select grade level...</option>
                    {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={handleCreateClass} style={btnPrimary}>Create class</button>
                  <button onClick={() => { setShowCreateClass(false); setError(null); }} style={btnSecondary}>Cancel</button>
                </div>
              </div>
            )}

            {classes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9A8878', fontStyle: 'italic' }}>No classes yet — create your first class to get started.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {classes.map(cls => (
                  <div key={cls.id} onClick={() => handleSelectClass(cls)}
                    style={{ ...sectionStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: 0 }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(58,50,38,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{cls.name}</div>
                      <div style={{ fontSize: '0.82rem', color: '#9A8878' }}>{cls.grade_level || 'No grade level set'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9A8878', marginBottom: '0.25rem' }}>Class code</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2E6DA4', letterSpacing: '0.15em' }}>{cls.class_code}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Class detail */}
        {view === 'class-detail' && selectedClass && (
          <div>
            <button onClick={() => { setView('classes'); setSelectedClass(null); setGeneratedAccounts([]); setShowBulkGenerate(false); setSelectedAssignment(null); }} style={{ ...btnSecondary, marginBottom: '1.5rem' }}>← Back to classes</button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.4rem' }}>Class</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>{selectedClass.name}</h1>
                <div style={{ fontSize: '0.85rem', color: '#9A8878' }}>{selectedClass.grade_level || 'No grade level'}</div>
                <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#EAF4FB', border: '1px solid #5B9EC9', borderRadius: '8px', padding: '0.35rem 0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9A8878' }}>Class code:</span>
                  <span style={{ fontWeight: 700, color: '#2E6DA4', letterSpacing: '0.15em' }}>{selectedClass.class_code}</span>
                </div>
              </div>
              {classMembers.length >= 30 && profile.account_type !== 'premium' && (
                <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '10px', padding: '0.85rem 1.1rem', fontSize: '0.85rem', color: '#B56840' }}>
                  You have reached the 30 student limit. <a href="mailto:upgrade@fictifly.com" style={{ color: '#D4845A', fontWeight: 600 }}>Contact us to upgrade.</a>
                </div>
              )}
            </div>

            {success && <div style={{ background: '#F0F7ED', border: '1px solid #6BAF72', borderRadius: '10px', color: '#3A7040', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>{success}</div>}
            {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '10px', color: '#B56840', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

            {/* Tab bar */}
            <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '12px', padding: '4px', gap: '2px', marginBottom: '1.5rem' }}>
              {['students', 'assignments'].map(t => (
                <button key={t} onClick={() => { setClassDetailTab(t); setSelectedAssignment(null); setShowBulkGenerate(false); setShowCreateAssignment(false); setError(null); }}
                  style={{ flex: 1, background: classDetailTab === t ? '#FFFCF8' : 'transparent', border: 'none', borderRadius: '9px', color: classDetailTab === t ? '#3A3226' : '#9A8878', fontFamily: 'sans-serif', fontWeight: classDetailTab === t ? 600 : 400, fontSize: '0.85rem', padding: '0.5rem 1rem', cursor: 'pointer', transition: 'all 0.18s', boxShadow: classDetailTab === t ? '0 1px 4px rgba(58,50,38,0.1)' : 'none' }}>
                  {t === 'students' ? `Students (${classMembers.length})` : `Assignments (${assignments.length})`}
                </button>
              ))}
            </div>

            {/* Students tab */}
            {classDetailTab === 'students' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button onClick={() => setShowBulkGenerate(!showBulkGenerate)} style={btnPrimary}>Generate student accounts</button>
                </div>
                {showBulkGenerate && (
                  <div style={sectionStyle}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bulk generate student accounts</h3>
                    <p style={{ fontSize: '0.85rem', color: '#9A8878', marginBottom: '1rem' }}>Accounts will be automatically linked to this class. You'll get a printable card sheet with each student's login details.</p>
                    <label style={labelStyle}>Username prefix
                      <input type="text" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value.replace(/\s/g, ''))} placeholder="e.g. MrsSmith_Period1" style={{ ...inputStyle, marginTop: '0.4rem', marginBottom: '0.75rem' }} />
                    </label>
                    <div style={{ fontSize: '0.75rem', color: '#9A8878', marginBottom: '0.75rem' }}>Usernames will look like: <strong>{bulkPrefix || 'Prefix'}_SwiftFalcon42</strong></div>
                    <label style={labelStyle}>Number of accounts (max 30)
                      <input type="number" value={bulkCount} onChange={(e) => setBulkCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} min={1} max={50} style={{ ...inputStyle, marginTop: '0.4rem' }} />
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button onClick={handleBulkGenerate} disabled={generating} style={{ ...btnPrimary, opacity: generating ? 0.6 : 1 }}>{generating ? 'Generating...' : 'Generate accounts'}</button>
                      <button onClick={() => { setShowBulkGenerate(false); setGeneratedAccounts([]); setError(null); }} style={btnSecondary}>Cancel</button>
                    </div>
                    {generatedAccounts.length > 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div style={{ fontWeight: 600, color: '#3A7040' }}>{generatedAccounts.length} accounts created!</div>
                          <button onClick={handlePrint} style={btnPrimary}>Print login cards</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                          {generatedAccounts.map((acc, i) => (
                            <div key={i} style={{ background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.7rem', color: '#9A8878', marginBottom: '0.25rem' }}>Username</div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#3A3226', marginBottom: '0.5rem' }}>{acc.username}</div>
                              <div style={{ fontSize: '0.7rem', color: '#9A8878', marginBottom: '0.25rem' }}>Passcode</div>
                              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2E6DA4', letterSpacing: '0.15em' }}>{acc.passcode}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div style={sectionStyle}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Students ({classMembers.length}{profile.account_type !== 'premium' ? '/30' : ''})
                  </h3>
                  {classMembers.length === 0 ? (
                    <p style={{ color: '#9A8878', fontStyle: 'italic', fontSize: '0.9rem' }}>No students yet. Generate accounts or share the class code <strong style={{ color: '#2E6DA4' }}>{selectedClass.class_code}</strong> with your students.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   {classMembers.filter(member => member.users).map((member) => (
  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F5EFE6', borderRadius: '8px' }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.users.display_name || member.users.username}</div>
      <div style={{ fontSize: '0.78rem', color: '#9A8878' }}>@{member.users.username}</div>
    </div>
    <div style={{ fontSize: '0.75rem', color: '#9A8878' }}>
      {member.users.account_type === 'student' ? 'Class account' : 'Self-registered'}
    </div>
  </div>
))}
The only change is .filter(member => member.users) before the .map() — silently skips any member whose user record didn't join correctly. Also worth checking in Supabase whether the class_members table has a foreign key to users or auth.users, since the select *, users(*) needs to match the actual table name.



                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignments list */}
            {classDetailTab === 'assignments' && !selectedAssignment && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button onClick={() => { setShowCreateAssignment(!showCreateAssignment); setError(null); }} style={btnPrimary}>+ New Assignment</button>
                </div>

                {showCreateAssignment && (
                  <div style={sectionStyle}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Create assignment</h3>

                    <label style={labelStyle}>Title
                      <input type="text" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} placeholder="e.g. Week 3 Horror Challenge" style={{ ...inputStyle, marginTop: '0.4rem', marginBottom: '0.75rem' }} />
                    </label>

                    <label style={{ ...labelStyle, marginBottom: '0.4rem' }}>Assign to</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {['class', 'student'].map(t => (
                        <button key={t} onClick={() => setAssignmentTarget(t)}
                          style={{ ...btnSecondary, background: assignmentTarget === t ? '#D4845A' : 'transparent', color: assignmentTarget === t ? '#FFFCF8' : '#6B5D4E', borderColor: assignmentTarget === t ? '#D4845A' : '#D9C9B0' }}>
                          {t === 'class' ? 'Whole class' : 'Individual student'}
                        </button>
                      ))}
                    </div>

                    {assignmentTarget === 'student' && (
                      <label style={labelStyle}>Select student
                        <select value={assignmentStudentId} onChange={e => setAssignmentStudentId(e.target.value)} style={{ ...inputStyle, marginTop: '0.4rem', marginBottom: '0.75rem', appearance: 'none' }}>
                          <option value="">Choose a student...</option>
                          {classMembers.map(m => (
                            <option key={m.student_id} value={m.student_id}>{m.users.display_name || m.users.username}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label style={{ ...labelStyle, marginBottom: '0.4rem' }}>Generator type</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {[{ value: 'microfiction', label: 'Microfiction' }, { value: 'flash-fiction', label: 'Flash Fiction' }].map(opt => (
                        <button key={opt.value} onClick={() => { setAssignmentPromptType(opt.value); setAssignmentWordCount(opt.value === 'microfiction' ? 100 : 500); }}
                          style={{ ...btnSecondary, background: assignmentPromptType === opt.value ? '#D4845A' : 'transparent', color: assignmentPromptType === opt.value ? '#FFFCF8' : '#6B5D4E', borderColor: assignmentPromptType === opt.value ? '#D4845A' : '#D9C9B0' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <label style={{ ...labelStyle, marginBottom: '0.4rem' }}>Word count</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {wordCountOptions.map(n => (
                        <button key={n} onClick={() => setAssignmentWordCount(n)}
                          style={{ ...btnSecondary, background: assignmentWordCount === n ? '#D4845A' : 'transparent', color: assignmentWordCount === n ? '#FFFCF8' : '#6B5D4E', borderColor: assignmentWordCount === n ? '#D4845A' : '#D9C9B0' }}>
                          {n} words
                        </button>
                      ))}
                    </div>

                    <label style={labelStyle}>Genre (optional)
                      <select value={assignmentGenre} onChange={e => setAssignmentGenre(e.target.value)} style={{ ...inputStyle, marginTop: '0.4rem', marginBottom: '0.75rem', appearance: 'none' }}>
                        <option value="">Random / student's choice</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </label>

                    <div style={{ background: '#F5EFE6', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9A8878', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Prompt ingredients (optional)</div>
                      <div style={{ fontSize: '0.78rem', color: '#9A8878', marginBottom: '0.75rem' }}>Leave blank to let students generate their own ingredients.</div>
                      {assignmentPromptType === 'microfiction' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={labelStyle}>Action (gerund, e.g. "Wandering")
                            <input type="text" value={assignmentAction} onChange={e => setAssignmentAction(e.target.value)} placeholder="e.g. Unraveling" style={{ ...inputStyle, marginTop: '0.3rem' }} />
                          </label>
                          <label style={labelStyle}>Word (single evocative word)
                            <input type="text" value={assignmentWord} onChange={e => setAssignmentWord(e.target.value)} placeholder="e.g. Courage" style={{ ...inputStyle, marginTop: '0.3rem' }} />
                          </label>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {assignmentWordCount === 500 && (
                            <label style={labelStyle}>Action (gerund)
                              <input type="text" value={assignmentAction} onChange={e => setAssignmentAction(e.target.value)} placeholder="e.g. Warning" style={{ ...inputStyle, marginTop: '0.3rem' }} />
                            </label>
                          )}
                          {assignmentWordCount === 1000 && (
                            <label style={labelStyle}>Location
                              <input type="text" value={assignmentLocation} onChange={e => setAssignmentLocation(e.target.value)} placeholder="e.g. A pawnshop" style={{ ...inputStyle, marginTop: '0.3rem' }} />
                            </label>
                          )}
                          <label style={labelStyle}>Object
                            <input type="text" value={assignmentObject} onChange={e => setAssignmentObject(e.target.value)} placeholder="e.g. A compass" style={{ ...inputStyle, marginTop: '0.3rem' }} />
                          </label>
                        </div>
                      )}
                    </div>

                    <label style={labelStyle}>Due date
                      <input type="date" value={assignmentDueDate} onChange={e => setAssignmentDueDate(e.target.value)} style={{ ...inputStyle, marginTop: '0.4rem', marginBottom: '0.75rem' }} />
                    </label>

                    {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleCreateAssignment} disabled={savingAssignment} style={{ ...btnPrimary, opacity: savingAssignment ? 0.6 : 1 }}>{savingAssignment ? 'Saving...' : 'Create assignment'}</button>
                      <button onClick={() => { setShowCreateAssignment(false); setError(null); }} style={btnSecondary}>Cancel</button>
                    </div>
                  </div>
                )}

                {assignments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9A8878', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No assignments yet — create one to get your students writing.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {assignments.map(a => {
                      const isOverdue = a.due_date && new Date(a.due_date) < new Date();
                      return (
                        <div key={a.id}
                          style={{ ...sectionStyle, marginBottom: 0, cursor: 'pointer' }}
                          onClick={() => fetchAssignmentSubmissions(a)}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(58,50,38,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{a.title}</div>
                              <div style={{ fontSize: '0.8rem', color: '#9A8878', marginBottom: '0.4rem' }}>
                                {a.prompt_type === 'microfiction' ? 'Microfiction' : 'Flash Fiction'} · {a.word_count} words{a.genre ? ` · ${a.genre}` : ''}
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {a.action && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Action: {a.action}</span>}
                                {a.word && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Word: {a.word}</span>}
                                {a.location && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Location: {a.location}</span>}
                                {a.object && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Object: {a.object}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2E6DA4', marginBottom: '0.25rem' }}>{a.submissionCount} submitted</div>
                              <div style={{ fontSize: '0.72rem', color: isOverdue ? '#B56840' : '#9A8878' }}>
                                Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {isOverdue ? ' · Overdue' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Submission review */}
            {classDetailTab === 'assignments' && selectedAssignment && (
              <div>
                <button onClick={() => setSelectedAssignment(null)} style={{ ...btnSecondary, marginBottom: '1.5rem' }}>← Back to assignments</button>

                <div style={sectionStyle}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.4rem' }}>Assignment</div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedAssignment.title}</h2>
                  <div style={{ fontSize: '0.82rem', color: '#9A8878', marginBottom: '0.5rem' }}>
                    {selectedAssignment.prompt_type === 'microfiction' ? 'Microfiction' : 'Flash Fiction'} · {selectedAssignment.word_count} words{selectedAssignment.genre ? ` · ${selectedAssignment.genre}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {selectedAssignment.action && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Action: {selectedAssignment.action}</span>}
                    {selectedAssignment.word && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Word: {selectedAssignment.word}</span>}
                    {selectedAssignment.location && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Location: {selectedAssignment.location}</span>}
                    {selectedAssignment.object && <span style={{ fontSize: '0.72rem', background: '#EDE3D4', color: '#6B5D4E', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>Object: {selectedAssignment.object}</span>}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3A3226', marginBottom: '0.75rem' }}>
                  {assignmentSubmissions.length} submission{assignmentSubmissions.length !== 1 ? 's' : ''}
                </div>

                {assignmentSubmissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9A8878', fontStyle: 'italic', fontSize: '0.9rem' }}>No submissions yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {assignmentSubmissions.map(sub => (
                      <div key={sub.id} style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sub.users?.display_name || sub.users?.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9A8878' }}>
                              Submitted {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          {sub.title && <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#6B5D4E' }}>"{sub.title}"</div>}
                        </div>

                        {sub.content ? (
                          <div style={{ background: '#F5EFE6', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#3A3226', lineHeight: 1.75, fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap', margin: 0 }}>{sub.content}</p>
                          </div>
                        ) : (
                          <div style={{ color: '#9A8878', fontStyle: 'italic', fontSize: '0.85rem', marginBottom: '1rem' }}>No story content submitted.</div>
                        )}

                        <div>
                          <label style={labelStyle}>Feedback</label>
                          <textarea
                            value={feedbackMap[sub.id] || ''}
                            onChange={e => setFeedbackMap(prev => ({ ...prev, [sub.id]: e.target.value }))}
                            placeholder="Leave feedback for this student..."
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical', marginBottom: '0.5rem' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                              onClick={() => handleSaveFeedback(sub.id)}
                              disabled={savingFeedback[sub.id]}
                              style={{ ...btnPrimary, fontSize: '0.8rem', padding: '0.4rem 1rem', opacity: savingFeedback[sub.id] ? 0.6 : 1 }}>
                              {savingFeedback[sub.id] ? 'Saving...' : sub.teacher_feedback ? 'Update feedback' : 'Save feedback'}
                            </button>
                            {sub.feedback_at && (
                              <span style={{ fontSize: '0.72rem', color: '#9A8878' }}>
                                Last saved {new Date(sub.feedback_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}