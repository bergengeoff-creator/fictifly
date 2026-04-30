import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

const adjectives = ['Swift','Brave','Clever','Bold','Bright','Calm','Keen','Wise','Wild','Quiet','Sharp','Cool','Gentle','Merry','Noble'];
const nouns = ['Penguin','Narrator','Scribe','Author','Dreamer','Writer','Poet','Falcon','Otter','Fox','Raven','Panda','Tiger','Koala','Wolf'];

const generateUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return adj + noun + num;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    // No profile found — this is a Google OAuth user who slipped through
    // Auto-create a minimal profile so they aren't stuck on a blank page
    let username = generateUsername();

    // Make sure username is unique
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (!existing) break;
      username = generateUsername();
      attempts++;
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username,
        account_type: 'standard',
        is_minor: false,
        age_verified: true,
        profile_public: false,
        profile_complete: false,
        recovery_type: 'teacher',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      setProfile(null);
    } else {
      setProfile(newProfile);
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}