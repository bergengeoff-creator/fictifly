import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import StoryModal from '../components/StoryModal';

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

const isStudentAccount = (profile) =>
  profile && (profile.account_type === 'minor' || profile.account_type === 'student');

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [totalPromptsGenerated, setTotalPromptsGenerated] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [storiesWritten, setStoriesWritten] = useState(0);
  const [writtenPromptIds, setWrittenPromptIds] = useState([]);

  // Assignments (students only)
  const [assignments, setAssignments] = useState([]);
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState([]);
  const [storyModalData, setStoryModalData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: saved } = await supabase
        .from('saved_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setSavedPrompts(saved || []);

      const { data: usage } = await supabase
        .from('prompt_usage')
        .select('count')
        .eq('user_id', user.id);
      const total = usage ? usage.reduce((sum, row) => sum + row.count, 0) : 0;
      setTotalPromptsGenerated(total);

      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();
      setCurrentStreak(streakData ? streakData.current_streak : 0);

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id, prompt_id, assignment_id, submitted_to_teacher')
        .eq('user_id', user.id);
      setStoriesWritten(submissionsData ? submissionsData.length : 0);
      setWrittenPromptIds(submissionsData ? submissionsData.map(s => s.prompt_id) : []);
      setSubmittedAssignmentIds(
        submissionsData
          ? submissionsData
              .filter(s => s.submitted_to_teacher && s.assignment_id)
              .map(s => s.assignment_id)
          : []
      );

      const { data: userBadgeData } = await supabase
        .from('user_badges')
        .select('id, badge_id, earned_at')
        .eq('user_id', user.id);
      if (userBadgeData && userBadgeData.length > 0) {
        const badgeIds = userBadgeData.map(ub => ub.badge_id);
        const { data: badgeDetails } = await supabase
          .from('badges')
          .select('*')
          .in('id', badgeIds);
        const merged = userBadgeData.map(ub => ({
          ...ub,
          badges: badgeDetails ? badgeDetails.find(b => b.id === ub.badge_id) : null
        })).filter(ub => ub.badges);
        setEarnedBadges(merged);
        setBadgeCount(merged.length);
      } else {
        setEarnedBadges([]);
        setBadgeCount(0);
      }

      // Fetch assignments for students
      if (profile && isStudentAccount(profile)) {
        const { data: memberships } = await supabase
          .from('class_members')
          .select('class_id')
          .eq('student_id', user.id);
        const classIds = memberships ? memberships.map(m => m.class_id) : [];

        let allAssignments = [];
        const today = new Date().toISOString().split('T')[0];

        if (classIds.length > 0) {
          const { data: classAssignments } = await supabase
            .from('assignments')
            .select('*')
            .in('class_id', classIds)
            .gte('due_date', today)
            .order('due_date', { ascending: true });
          allAssignments = [...(classAssignments || [])];
        }

        const { data: individualAssignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('student_id', user.id)
          .gte('due_date', today)
          .order('due_date', { ascending: true });
        allAssignments = [...allAssignments, ...(individualAssignments || [])];

        const seen = new Set();
        const unique = allAssignments.filter(a => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
        setAssignments(unique);
      }
    };
    fetchData();
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleOpenSubmission = (assignment) => {
    const prompt = {
      id: null,
      dbId: null,
      prompt_type: assignment.prompt_type,
      word_count: assignment.word_count,
      wordCount: assignment.word_count,
      genre: assignment.genre,
      action: assignment.action,
      word: assignment.word,
      location: assignment.location,
      object: assignment.object,
    };
    setStoryModalData({ prompt, assignmentId: assignment.id });
  };

  const isNewUser = profile && !profile.bio && !profile.avatar_url && !profile.avatar_preset;

  const stats = [
    { label: 'Prompts Generated', value: totalPromptsGenerated },
    { label: 'Stories Written', value: storiesWritten },
    { label: 'Day Streak', value: currentStreak },
    { label: 'Badges Earned', value: badgeCount },
  ];

  const generators = [
    { title: 'Microfiction', desc: '100, 200, or 300 words', color: '#D4845A', path: '/generators/microfiction' },
    { title: 'Flash Fiction', desc: '500 or 1,000 words', color: '#2E6DA4', path: '/generators/flash-fiction' },
  ];

  const pendingAssignments = assignments.filter(a => !submittedAssignmentIds.includes(a.id));
  const submittedAssignments = assignments.filter(a => submittedAssignmentIds.includes(a.id));

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
          <FictiflyLogo />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {profile && profile.account_type === 'teacher' && (
            <Link to="/classroom" style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer', textDecoration: 'none' }}>My Classes</Link>
          )}
          <Link to="/profile" style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer', textDecoration: 'none' }}>My Profile</Link>
          <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.82rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.6rem' }}>Dashboard</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {isNewUser ? 'Welcome, ' : 'Welcome back, '}
          <span style={{ color: '#2E6DA4', fontStyle: 'italic', fontWeight: 500 }}>
            {profile ? (profile.display_name || profile.username) : 'Writer'}
          </span>
        </h1>
        <p style={{ color: '#6B5D4E', fontSize: '0.95rem', marginBottom: '2rem' }}>
          {profile && profile.account_type === 'teacher' ? 'Educator account' : profile && profile.account_type === 'minor' ? 'Student account' : 'Writer account'}
        </p>

        {isNewUser && (
          <div style={{ background: '#EAF4FB', border: '1px solid #5B9EC9', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#2E6DA4', marginBottom: '0.2rem' }}>Complete your profile</div>
              <div style={{ fontSize: '0.85rem', color: '#6B5D4E' }}>Add a bio, avatar, and favourite genres to personalise your experience.</div>
            </div>
            <Link to="/profile" style={{ background: '#2E6DA4', color: '#FFFCF8', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Complete profile</Link>
          </div>
        )}

        {/* Assignments — students only */}
        {profile && isStudentAccount(profile) && assignments.length > 0 && (
          <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Assignments</h2>
              {pendingAssignments.length > 0 && (
                <span style={{ background: '#D4845A', color: '#FFFCF8', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '20px' }}>
                  {pendingAssignments.length} due
                </span>
              )}
            </div>

            {pendingAssignments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: submittedAssignments.length > 0 ? '1.25rem' : 0 }}>
                {pendingAssignments.map(a => {
                  const dueDate = new Date(a.due_date);
                  const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                  const isDueSoon = daysUntilDue <= 2;
                  return (
                    <div key={a.id} style={{ background: '#F5EFE6', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', border: `1px solid ${isDueSoon ? '#D4845A' : 'transparent'}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#3A3226', marginBottom: '0.2rem' }}>{a.title}</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9A8878', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                          {a.prompt_type === 'microfiction' ? 'Microfiction' : 'Flash Fiction'} · {a.word_count} words{a.genre ? ` · ${a.genre}` : ''}
                        </div>
                        {(a.action || a.word || a.location || a.object) && (
                          <div style={{ fontSize: '0.78rem', color: '#6B5D4E', marginBottom: '0.2rem' }}>
                            {[
                              a.action && `Action: ${a.action}`,
                              a.word && `Word: ${a.word}`,
                              a.location && `Location: ${a.location}`,
                              a.object && `Object: ${a.object}`,
                            ].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: isDueSoon ? '#B56840' : '#9A8878', fontWeight: isDueSoon ? 600 : 400 }}>
                          Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {daysUntilDue === 0 ? ' · Due today!' : isDueSoon ? ` · ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left` : ''}
                        </div>
                      </div>
                      <button onClick={() => handleOpenSubmission(a)}
                        style={{ background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Submit story
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {submittedAssignments.length > 0 && (
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.5rem' }}>Submitted ✓</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {submittedAssignments.map(a => (
                    <div key={a.id} style={{ background: '#F0F7ED', border: '1px solid #6BAF72', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#3A3226' }}>{a.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6BAF72', fontWeight: 600, marginTop: '0.15rem' }}>Submitted ✓</div>
                      </div>
                      <button onClick={() => handleOpenSubmission(a)}
                        style={{ background: 'transparent', border: '1px solid #6BAF72', color: '#3A7040', borderRadius: '8px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
                        Edit submission
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3A3226' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#9A8878', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>Start writing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {generators.map((g) => (
            <Link key={g.title} to={g.path} style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderLeft: '4px solid ' + g.color, borderRadius: '12px', padding: '1.25rem 1.5rem', cursor: 'pointer', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', textDecoration: 'none', display: 'block' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(58,50,38,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(58,50,38,0.05)'; }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3A3226', marginBottom: '0.25rem' }}>{g.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#9A8878' }}>{g.desc}</div>
            </Link>
          ))}
        </div>

        <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Saved Prompts</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/generators/microfiction" style={{ fontSize: '0.78rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Microfiction</Link>
              <span style={{ color: '#9A8878', fontSize: '0.78rem' }}>·</span>
              <Link to="/generators/flash-fiction" style={{ fontSize: '0.78rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Flash Fiction</Link>
            </div>
          </div>

          {savedPrompts.filter(p => !writtenPromptIds.includes(p.id)).length === 0 ? (
            <p style={{ color: '#9A8878', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1rem' }}>No unwritten prompts — great work!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {savedPrompts.filter(p => !writtenPromptIds.includes(p.id)).slice(0, 3).map(p => (
                <div key={p.id} style={{ background: '#F5EFE6', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9A8878', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{p.prompt_type === 'microfiction' ? 'Microfiction' : 'Flash Fiction'} · {p.word_count} words</div>
                    <div style={{ fontSize: '0.88rem', color: '#3A3226', fontWeight: 500 }}>{p.genre}</div>
                    <div style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>{p.action || p.location} · {p.word || p.object}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {profile && isStudentAccount(profile) && (
                      <button
                        onClick={() => setStoryModalData({ prompt: { ...p, wordCount: p.word_count, dbId: p.id }, assignmentId: null })}
                        style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.72rem', fontWeight: 500, padding: '0.3rem 0.7rem', cursor: 'pointer' }}>
                        Submit
                      </button>
                    )}
                    <Link to={p.prompt_type === 'microfiction' ? '/generators/microfiction?tab=saved' : '/generators/flash-fiction?tab=saved'} style={{ fontSize: '0.75rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Write →</Link>
                  </div>
                </div>
              ))}
              {savedPrompts.filter(p => !writtenPromptIds.includes(p.id)).length > 3 && (
                <p style={{ fontSize: '0.82rem', color: '#9A8878', textAlign: 'center' }}>And {savedPrompts.filter(p => !writtenPromptIds.includes(p.id)).length - 3} more — view all in the generators above.</p>
              )}
            </div>
          )}

          {writtenPromptIds.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878' }}>Written ✓</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to="/generators/microfiction?tab=written" style={{ fontSize: '0.78rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Microfiction</Link>
                  <span style={{ color: '#9A8878', fontSize: '0.78rem' }}>·</span>
                  <Link to="/generators/flash-fiction?tab=written" style={{ fontSize: '0.78rem', color: '#2E6DA4', textDecoration: 'none', fontWeight: 500 }}>Flash Fiction</Link>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {savedPrompts.filter(p => writtenPromptIds.includes(p.id)).slice(0, 3).map(p => (
                  <div key={p.id} style={{ background: '#F0F7ED', border: '1px solid #6BAF72', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6BAF72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{p.prompt_type === 'microfiction' ? 'Microfiction' : 'Flash Fiction'} · {p.word_count} words ✓</div>
                      <div style={{ fontSize: '0.88rem', color: '#3A3226', fontWeight: 500 }}>{p.genre}</div>
                      <div style={{ fontSize: '0.82rem', color: '#6B5D4E' }}>{p.action || p.location} · {p.word || p.object}</div>
                    </div>
                    <Link to={p.prompt_type === 'microfiction' ? '/generators/microfiction?tab=written' : '/generators/flash-fiction?tab=written'} style={{ fontSize: '0.75rem', color: '#3A7040', textDecoration: 'none', fontWeight: 500 }}>View →</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {earnedBadges.length > 0 && (
          <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>Badges</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {earnedBadges.filter(ub => ub.badges).map((ub) => (
                <div key={ub.id} title={ub.badges?.description} style={{ background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#3A3226' }}>
                  <span style={{ fontSize: '1.3rem' }}>{ub.badges.icon}</span>
                  {ub.badges.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {storyModalData && (
        <StoryModal
          prompt={storyModalData.prompt}
          assignmentId={storyModalData.assignmentId}
          isStudentSubmission={true}
          onClose={() => setStoryModalData(null)}
          onSaved={() => {
            if (storyModalData.assignmentId) {
              setSubmittedAssignmentIds(prev => [...prev, storyModalData.assignmentId]);
            }
            setStoryModalData(null);
          }}
        />
      )}
    </div>
  );
}