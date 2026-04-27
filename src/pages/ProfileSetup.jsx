import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const GENRES = [
  'Action/Adventure','Comedy','Crime Caper','Drama','Fairy Tale','Fantasy',
  'Ghost Story','Historical Fiction','Horror','Mystery','Political Satire',
  'Romance','Romantic Comedy','Sci-Fi','Spy','Suspense','Thriller','Open Genre'
];

const AVATAR_STYLES = {
  standard: [
    { id: 'notionists', name: 'Notionists' },
    { id: 'lorelei', name: 'Lorelei' },
  ],
  teacher: [
    { id: 'notionists', name: 'Notionists' },
    { id: 'lorelei', name: 'Lorelei' },
  ],
  minor: [
    { id: 'notionists', name: 'Notionists' },
    { id: 'lorelei', name: 'Lorelei' },
    { id: 'bottts', name: 'Bottts' },
    { id: 'fun-emoji', name: 'Fun Emoji' },
  ],
  student: [
    { id: 'bottts', name: 'Bottts' },
    { id: 'fun-emoji', name: 'Fun Emoji' },
  ],
};

const generateSeeds = () => Array.from({ length: 4 }, () => Math.random().toString(36).substring(2, 8));

const SUBJECTS = ['English','Creative Writing','Language Arts','Literature','Other'];
const REGIONS = ['North America','South America','Europe','Asia','Africa','Australia/Oceania','Other'];

const inputStyle = { width: '100%', background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#3A3226', fontFamily: 'sans-serif', fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' };
const sectionStyle = { background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem' };
const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', display: 'block', marginBottom: '0.5rem' };

export default function ProfileSetup() {
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [uploadedAvatar, setUploadedAvatar] = useState(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null);
  const [avatarMode, setAvatarMode] = useState('preset');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [customGenre, setCustomGenre] = useState('');
  const [profilePublic, setProfilePublic] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [subject, setSubject] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarError, setAvatarError] = useState(null);

  const isTeacher = profile && profile.account_type === 'teacher';
  const getAvailableStyles = () => AVATAR_STYLES[profile ? profile.account_type : 'standard'] || AVATAR_STYLES.standard;
const [avatarStyle, setAvatarStyle] = useState(() => getAvailableStyles()[0].id);
const [avatarSeeds, setAvatarSeeds] = useState(generateSeeds());
const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg','image/png','image/webp'];
    if (!allowedTypes.includes(file.type)) { setAvatarError('Only JPG, PNG, and WebP files are allowed.'); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError('File must be under 2MB.'); return; }
    setAvatarError(null);
    setUploadedAvatar(file);
    setUploadedAvatarUrl(URL.createObjectURL(file));
    setSelectedPreset(null);
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const addCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (trimmed && !selectedGenres.includes(trimmed)) {
      setSelectedGenres(prev => [...prev, trimmed]);
      setCustomGenre('');
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) { setError('Please enter a display name.'); return; }
if (!profile || !profile.username) {
  if (!username.trim()) { setError('Please choose a username.'); return; }
  if (username.trim().includes(' ')) { setError('Username cannot contain spaces.'); return; }
  const { data: existing } = await supabase.from('users').select('id').eq('username', username.trim()).single();
  if (existing) { setError('That username is already taken. Please choose another.'); return; }
}
    if (profilePublic === null) { setError('Please choose whether your profile is public or private.'); return; }
    setLoading(true);
let avatarUrl = selectedAvatarUrl || null;
if (uploadedAvatar) {
      const fileExt = uploadedAvatar.name.split('.').pop();
      const filePath = user.id + '/avatar.' + fileExt;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, uploadedAvatar, { upsert: true });
      if (uploadError) { setError('Avatar upload failed: ' + uploadError.message); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }
const updates = {
  ...((!profile || !profile.username) && { username: username.trim() }),
  display_name: displayName.trim(),
      bio: bio.trim() || null,
      avatar_url: uploadedAvatar ? avatarUrl : selectedAvatarUrl,
avatar_preset: null,
      favourite_genres: selectedGenres.length > 0 ? selectedGenres : null,
      profile_public: profilePublic,
      profile_complete: true,
      school_name: isTeacher && schoolName ? schoolName.trim() : null,
      subject: isTeacher && subject ? subject : null,
      region: region || null,
    };
    const { error: updateError } = await supabase.from('users').update(updates).eq('id', user.id);
    if (updateError) { setError('Failed to save profile: ' + updateError.message); setLoading(false); return; }
    await fetchProfile(user.id);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '2rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4845A', marginBottom: '0.6rem' }}>Almost there</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#3A3226', marginBottom: '0.5rem' }}>Set up your profile</h1>
          <p style={{ color: '#6B5D4E', fontSize: '0.95rem' }}>Only your display name and privacy setting are required.</p>
        </div>

 <div style={sectionStyle}>
  <label style={labelStyle}>Display name <span style={{ color: '#D4845A' }}>*</span></label>
  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How should we call you?" maxLength={40} style={{ ...inputStyle, marginBottom: '0.75rem' }} />
  {(!profile || !profile.username) && (
    <div>
      <label style={labelStyle}>Username <span style={{ color: '#D4845A' }}>*</span></label>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} placeholder="Choose a unique username..." maxLength={30} style={inputStyle} />
      <div style={{ fontSize: '0.75rem', color: '#9A8878', marginTop: '0.25rem' }}>No spaces allowed. This is how others find you.</div>
    </div>
  )}
</div>

<div style={sectionStyle}>
  <label style={labelStyle}>Profile picture (optional)</label>
  <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '1rem', flexWrap: 'wrap' }}>
    {getAvailableStyles().map((style) => (
      <button key={style.id} onClick={() => { setAvatarStyle(style.id); setAvatarSeeds(generateSeeds()); }}
        style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: '8px', border: 'none', background: avatarStyle === style.id ? '#FFFCF8' : 'transparent', color: avatarStyle === style.id ? '#3A3226' : '#9A8878', fontWeight: avatarStyle === style.id ? 600 : 400, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
        {style.name}
      </button>
    ))}
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
    {avatarSeeds.map((seed) => {
      const url = 'https://api.dicebear.com/7.x/' + avatarStyle + '/svg?seed=' + seed + '&backgroundColor=f5efe6';
      return (
        <div key={seed} onClick={() => setSelectedAvatarUrl(url)}
          style={{ cursor: 'pointer', borderRadius: '10px', border: '2px solid ' + (selectedAvatarUrl === url ? '#D4845A' : 'transparent'), padding: '4px', background: selectedAvatarUrl === url ? '#FDF0E8' : 'transparent' }}>
          <img src={url} alt="avatar option" style={{ width: '100%', borderRadius: '8px' }} />
        </div>
      );
    })}
  </div>
  <button onClick={() => setAvatarSeeds(generateSeeds())}
    style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.78rem', padding: '0.4rem 0.9rem', cursor: 'pointer', marginBottom: '1rem' }}>
    Regenerate options
  </button>
  <div style={{ borderTop: '1px solid #EDE3D4', paddingTop: '0.75rem' }}>
    <div style={{ fontSize: '0.75rem', color: '#9A8878', marginBottom: '0.5rem' }}>Or upload your own photo (JPG, PNG, WebP — max 2MB)</div>
    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} style={{ display: 'none' }} id="avatar-upload" />
    <label htmlFor="avatar-upload" style={{ display: 'inline-block', background: '#F5EFE6', border: '1.5px dashed #D9C9B0', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.82rem', color: '#6B5D4E' }}>
      {uploadedAvatarUrl ? 'Photo selected' : 'Choose photo'}
    </label>
    {uploadedAvatarUrl && <img src={uploadedAvatarUrl} alt="upload preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginLeft: '0.75rem', verticalAlign: 'middle' }} />}
    {avatarError && <div style={{ color: '#B56840', fontSize: '0.82rem', marginTop: '0.5rem' }}>{avatarError}</div>}
  </div>
</div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Bio (optional)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community a little about yourself as a writer..." maxLength={200} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          <div style={{ fontSize: '0.75rem', color: '#9A8878', textAlign: 'right', marginTop: '0.25rem' }}>{bio.length}/200</div>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Favourite genres (optional)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {GENRES.map((genre) => (
              <button key={genre} onClick={() => toggleGenre(genre)} style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1.5px solid ' + (selectedGenres.includes(genre) ? '#D4845A' : '#D9C9B0'), background: selectedGenres.includes(genre) ? '#D4845A' : 'transparent', color: selectedGenres.includes(genre) ? '#FFFCF8' : '#6B5D4E', fontSize: '0.78rem', cursor: 'pointer' }}>
                {genre}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" value={customGenre} onChange={(e) => setCustomGenre(e.target.value)} placeholder="Add your own genre..." style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') addCustomGenre(); }} />
            <button onClick={addCustomGenre} style={{ background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '8px', padding: '0 1rem', cursor: 'pointer', fontWeight: 600 }}>Add</button>
          </div>
        </div>

        {isTeacher && (
          <div style={sectionStyle}>
            <label style={labelStyle}>School or institution (optional)</label>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Lincoln High School" style={{ ...inputStyle, marginBottom: '0.75rem' }} />
            <label style={labelStyle}>Subject (optional)</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inputStyle, marginBottom: '0.75rem', appearance: 'none' }}>
              <option value="">Select a subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={labelStyle}>Region (optional)</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select a region...</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        <div style={sectionStyle}>
          <label style={labelStyle}>Profile visibility <span style={{ color: '#D4845A' }}>*</span></label>
          <p style={{ fontSize: '0.82rem', color: '#9A8878', marginBottom: '0.75rem' }}>Public profiles can be seen by other writers. Private profiles are only visible to you and your teacher.</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[{ value: true, label: 'Public', desc: 'Visible to the community' },{ value: false, label: 'Private', desc: 'Only visible to you' }].map((option) => (
              <div key={String(option.value)} onClick={() => setProfilePublic(option.value)} style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '1.5px solid ' + (profilePublic === option.value ? '#D4845A' : '#D9C9B0'), background: profilePublic === option.value ? '#FDF0E8' : 'transparent', cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, color: '#3A3226', marginBottom: '0.2rem' }}>{option.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#9A8878' }}>{option.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginBottom: '1rem' }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{ background: loading ? '#D9C9B0' : '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.85rem', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
          {loading ? 'Saving...' : 'Save profile and continue'}
        </button>
      </div>
    </div>
  );
}
