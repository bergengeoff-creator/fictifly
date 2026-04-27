import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const GENRES = [
  'Action/Adventure','Comedy','Crime Caper','Drama','Fairy Tale','Fantasy',
  'Ghost Story','Historical Fiction','Horror','Mystery','Political Satire',
  'Romance','Romantic Comedy','Sci-Fi','Spy','Suspense','Thriller','Open Genre'
];

const PRESET_AVATARS = [
  { id: 'quill', label: 'Q', bg: '#5B9EC9', name: 'The Quill' },
  { id: 'owl', label: 'O', bg: '#D4845A', name: 'The Owl' },
  { id: 'star', label: 'S', bg: '#6BAF72', name: 'The Star' },
  { id: 'moon', label: 'M', bg: '#B07AC0', name: 'The Moon' },
  { id: 'wave', label: 'W', bg: '#2E6DA4', name: 'The Wave' },
  { id: 'flame', label: 'F', bg: '#E86A3A', name: 'The Flame' },
];

const SUBJECTS = ['English','Creative Writing','Language Arts','Literature','Other'];
const REGIONS = ['North America','South America','Europe','Asia','Africa','Australia/Oceania','Other'];

const inputStyle = { width: '100%', background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '8px', color: '#3A3226', fontFamily: 'sans-serif', fontSize: '0.95rem', padding: '0.6rem 0.9rem', outline: 'none' };
const sectionStyle = { background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem' };
const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', display: 'block', marginBottom: '0.5rem' };

export default function ProfileSetup() {
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
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
    if (profilePublic === null) { setError('Please choose whether your profile is public or private.'); return; }
    setLoading(true);
    let avatarUrl = null;
    if (avatarMode === 'upload' && uploadedAvatar) {
      const fileExt = uploadedAvatar.name.split('.').pop();
      const filePath = user.id + '/avatar.' + fileExt;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, uploadedAvatar, { upsert: true });
      if (uploadError) { setError('Avatar upload failed: ' + uploadError.message); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }
    const updates = {
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      avatar_preset: avatarMode === 'preset' ? selectedPreset : null,
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
