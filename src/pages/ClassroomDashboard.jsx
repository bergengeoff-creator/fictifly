import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const GRADE_LEVELS = [
  'Elementary (K-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'Other',
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

export default function ClassroomDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classMembers, setClassMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('classes');
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
    if (profile && profile.account_type !== 'teacher') {
      navigate('/dashboard');
    }
    fetchClasses();
  }, [profile, navigate, fetchClasses]);

  const fetchClassMembers = async (classId) => {
    const { data } = await supabase
      .from('class_members')
      .select('*, users(*)')
      .eq('class_id', classId);
    setClassMembers(data || []);
  };

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setView('class-detail');
    await fetchClassMembers(cls.id);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) { setError('Please enter a class name.'); return; }
    const classCode = generateClassCode();
    const { data, error: insertError } = await supabase
      .from('classes')
      .insert({ teacher_id: user.id, name: newClassName.trim(), grade_level: newClassGrade || null, class_code: classCode })
      .select()
      .single();
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

  if (loading) return <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9A8878', fontStyle: 'italic' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <Link to="/dashboard" style={{ color: '#6B5D4E', textDecoration: 'none', fontSize: '0.85rem' }}>Back to dashboard</Link>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Fictifly</div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {view === 'classes' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.4rem' }}>Educator</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>My Classes</h1>
              </div>
<>
  <button onClick={() => {
    if (classes.length >= 1 && profile.account_type !== 'premium') {
      setError('Free accounts are limited to 1 class. Contact us to upgrade for unlimited classes.');
      return;
    }
    setError(null);
    setShowCreateClass(true);
  }} style={btnPrimary}>+ New Class</button>

{error && !showCreateClass && (
    <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '10px', color: '#B56840', padding: '0.85rem 1.1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
      {error}
    </div>
  )}
</>

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
              <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9A8878', fontStyle: 'italic' }}>
                No classes yet — create your first class to get started.
              </div>
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

        {view === 'class-detail' && selectedClass && (
          <div>
            <button onClick={() => { setView('classes'); setSelectedClass(null); setGeneratedAccounts([]); setShowBulkGenerate(false); }} style={{ ...btnSecondary, marginBottom: '1.5rem' }}>← Back to classes</button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.4rem' }}>Class</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>{selectedClass.name}</h1>
                <div style={{ fontSize: '0.85rem', color: '#9A8878' }}>{selectedClass.grade_level || 'No grade level'}</div>
                <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#EAF4FB', border: '1px solid #5B9EC9', borderRadius: '8px', padding: '0.35rem 0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9A8878' }}>Class code:</span>
                  <span style={{ fontWeight: 700, color: '#2E6DA4', letterSpacing: '0.15em' }}>{selectedClass.class_code}</span>
                </div>
              </div>
              <button onClick={() => setShowBulkGenerate(!showBulkGenerate)} style={btnPrimary}>Generate student accounts</button>
              {classMembers.length >= 30 && profile.account_type !== 'premium' && (
  <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#B56840' }}>
    You have reached the 30 student limit for free accounts. <a href="mailto:upgrade@fictifly.com" style={{ color: '#D4845A', fontWeight: 600 }}>Contact us to upgrade.</a>
  </div>
)}
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
                {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={handleBulkGenerate} disabled={generating} style={{ ...btnPrimary, opacity: generating ? 0.6 : 1 }}>
                    {generating ? 'Generating...' : 'Generate accounts'}
                  </button>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
<h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
  Students ({classMembers.length}{profile.account_type !== 'premium' ? '/30' : ''})
</h3>              
</div>
              {classMembers.length === 0 ? (
                <p style={{ color: '#9A8878', fontStyle: 'italic', fontSize: '0.9rem' }}>No students yet. Generate accounts or share the class code <strong style={{ color: '#2E6DA4' }}>{selectedClass.class_code}</strong> with your students.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {classMembers.map((member) => (
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
