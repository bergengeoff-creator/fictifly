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
