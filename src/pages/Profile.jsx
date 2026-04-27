import { useState } from 'react';
import { Link } from 'react-router-dom';
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
const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', display: 'block', marginBottom: '0.5rem' };
const sectionStyle = { background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem' };

export default function Profile() {
  const { user, profile, fetchProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile ? profile.display_name || '' : '');
  const [username, setUsername] = useState(profile ? profile.username || '' : '');
  const [bio, setBio] = useState(profile ? profile.bio || '' : '');
  const [selectedPreset, setSelectedPreset] = useState(profile ? profile.avatar_preset || null : null);
  const [uploadedAvatar, setUploadedAvatar] = useState(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null);
  const [avatarMode, setAvatarMode] = useState(profile && profile.avatar_url ? 'upload' : 'preset');
  const [selectedGenres, setSelectedGenres] = useState(profile ? profile.favourite_genres || [] : []);
  const [customGenre, setCustomGenre] = useState('');
  const [profilePublic, setProfilePublic] = useState(profile ? profile.profile_public : false);
  const [schoolName, setSchoolName] = useState(profile ? profile.school_name || '' : '');
  const [subject, setSubject] = useState(profile ? profile.subject || '' : '');
  const [region, setRegion] = useState(profile ? profile.region || '' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  const isTeacher = profile && profile.account_type === 'teacher';
  const isMinor = profile && profile.account_type === 'minor';
  const getAvailableStyles = () => AVATAR_STYLES[profile ? profile.account_type : 'standard'] || AVATAR_STYLES.standard;
const [avatarStyle, setAvatarStyle] = useState(() => getAvailableStyles()[0].id);
const [avatarSeeds, setAvatarSeeds] = useState(generateSeeds());
const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(profile ? profile.avatar_url : null);

  const getAvatarDisplay = () => {
    if (profile.avatar_url) return <img src={profile.avatar_url} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />;
    if (profile.avatar_preset) {
      const preset = PRESET_AVATARS.find(a => a.id === profile.avatar_preset);
      if (preset) return <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: preset.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.8rem' }}>{preset.label}</div>;
    }
    return <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EDE3D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8878', fontWeight: 700, fontSize: '1.8rem' }}>{profile.username ? profile.username[0].toUpperCase() : 'W'}</div>;
  };

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

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Display name is required.'); return; }
    if (!username.trim()) { setError('Username is required.'); return; }
    if (username.trim().includes(' ')) { setError('Username cannot contain spaces.'); return; }
    setLoading(true);
    setError(null);

    // Check if username is already taken by another user
    if (username.trim() !== profile.username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .neq('id', user.id)
        .single();
      if (existing) {
        setError('That username is already taken. Please choose another.');
        setLoading(false);
        return;
      }
    }

let avatarUrl = selectedAvatarUrl || profile.avatar_url;
if (uploadedAvatar) {
      const fileExt = uploadedAvatar.name.split('.').pop();
      const filePath = user.id + '/avatar.' + fileExt;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, uploadedAvatar, { upsert: true });
      if (uploadError) { setError('Avatar upload failed: ' + uploadError.message); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }

    const updates = {
      username: username.trim(),
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
    if (updateError) { setError('Failed to save: ' + updateError.message); setLoading(false); return; }
    await fetchProfile(user.id);
    setLoading(false);
    setSuccess(true);
    setEditing(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!profile) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', fontFamily: 'sans-serif', color: '#3A3226', padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9C9B0', marginBottom: '2.5rem' }}>
        <Link to="/dashboard" style={{ color: '#6B5D4E', textDecoration: 'none', fontSize: '0.85rem' }}>Back to dashboard</Link>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Fictifly</div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getAvatarDisplay()}
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.2rem' }}>{profile.display_name || profile.username}</h1>
              <div style={{ fontSize: '0.82rem', color: '#9A8878' }}>@{profile.username}</div>
              <div style={{ fontSize: '0.78rem', color: '#9A8878', marginTop: '0.2rem' }}>
                {profile.account_type === 'teacher' ? 'Educator' : profile.account_type === 'minor' ? 'Student' : 'Writer'} · {profile.profile_public ? 'Public profile' : 'Private profile'}
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} style={{ background: editing ? 'transparent' : '#2E6DA4', color: editing ? '#6B5D4E' : '#FFFCF8', border: '1px solid ' + (editing ? '#D9C9B0' : '#2E6DA4'), borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            {editing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        {success && (
          <div style={{ background: '#F0F7ED', border: '1px solid #6BAF72', borderRadius: '10px', color: '#3A7040', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
            Profile saved successfully!
          </div>
        )}

        {!editing ? (
          <div>
            <div style={sectionStyle}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>About</div>
              {profile.bio ? (
                <p style={{ color: '#3A3226', lineHeight: 1.65, fontSize: '0.95rem' }}>{profile.bio}</p>
              ) : (
                <p style={{ color: '#9A8878', fontStyle: 'italic', fontSize: '0.9rem' }}>No bio yet.</p>
              )}
            </div>

            {profile.favourite_genres && profile.favourite_genres.length > 0 && (
              <div style={sectionStyle}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>Favourite genres</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {profile.favourite_genres.map(g => (
                    <span key={g} style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#EDE3D4', color: '#6B5D4E', fontSize: '0.78rem' }}>{g}</span>
                  ))}
                </div>
              </div>
            )}

            {isTeacher && (profile.school_name || profile.subject || profile.region) && (
              <div style={sectionStyle}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>Educator info</div>
                {profile.school_name && <div style={{ fontSize: '0.9rem', color: '#3A3226', marginBottom: '0.3rem' }}>{profile.school_name}</div>}
                {profile.subject && <div style={{ fontSize: '0.85rem', color: '#6B5D4E', marginBottom: '0.3rem' }}>{profile.subject}</div>}
                {profile.region && <div style={{ fontSize: '0.85rem', color: '#9A8878' }}>{profile.region}</div>}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={sectionStyle}>
              <label style={labelStyle}>Display name <span style={{ color: '#D4845A' }}>*</span></label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} style={{ ...inputStyle, marginBottom: '0.75rem' }} />
              <label style={labelStyle}>
                Username <span style={{ color: '#D4845A' }}>*</span>
                {isMinor && <span style={{ color: '#9A8878', fontWeight: 400, marginLeft: '0.5rem' }}>(you can generate a new random one)</span>}
              </label>
              {isMinor ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#3A3226', fontStyle: 'italic' }}>{username}</div>
                  <button onClick={() => {
                    const adjs = ['Swift','Brave','Clever','Bold','Bright','Calm','Keen','Wise','Wild','Quiet'];
                    const ns = ['Penguin','Narrator','Scribe','Author','Dreamer','Writer','Poet','Falcon','Otter','Fox'];
                    const adj = adjs[Math.floor(Math.random() * adjs.length)];
                    const noun = ns[Math.floor(Math.random() * ns.length)];
                    const num = Math.floor(Math.random() * 90) + 10;
                    setUsername(adj + noun + num);
                  }} style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#6B5D4E', fontSize: '0.78rem', padding: '0.6rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    New one
                  </button>
                </div>
              ) : (
                <div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} placeholder="Your username" maxLength={30} style={inputStyle} />
                  <div style={{ fontSize: '0.75rem', color: '#9A8878', marginTop: '0.25rem' }}>No spaces allowed. This is how others find you.</div>
                </div>
              )}
            </div>

<div style={sectionStyle}>
  <label style={labelStyle}>Profile picture (optional)</label>

  {/* Style selector */}
  <div style={{ display: 'flex', background: '#EDE3D4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '1rem', flexWrap: 'wrap' }}>
    {getAvailableStyles().map((style) => (
      <button key={style.id} onClick={() => { setAvatarStyle(style.id); setAvatarSeeds(generateSeeds()); }}
        style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: '8px', border: 'none', background: avatarStyle === style.id ? '#FFFCF8' : 'transparent', color: avatarStyle === style.id ? '#3A3226' : '#9A8878', fontWeight: avatarStyle === style.id ? 600 : 400, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
        {style.name}
      </button>
    ))}
  </div>

  {/* Avatar grid */}
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

  {/* Upload option */}
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
              <label style={labelStyle}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community a little about yourself..." maxLength={200} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ fontSize: '0.75rem', color: '#9A8878', textAlign: 'right', marginTop: '0.25rem' }}>{bio.length}/200</div>
            </div>

            <div style={sectionStyle}>
              <label style={labelStyle}>Favourite genres</label>
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
                <label style={labelStyle}>School or institution</label>
                <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Lincoln High School" style={{ ...inputStyle, marginBottom: '0.75rem' }} />
                <label style={labelStyle}>Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inputStyle, marginBottom: '0.75rem', appearance: 'none' }}>
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <label style={labelStyle}>Region</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Select a region...</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div style={sectionStyle}>
              <label style={labelStyle}>Profile visibility <span style={{ color: '#D4845A' }}>*</span></label>
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

            <button onClick={handleSave} disabled={loading} style={{ background: loading ? '#D9C9B0' : '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.85rem', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
