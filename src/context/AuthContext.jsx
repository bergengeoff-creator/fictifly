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

// Minor/student accounts use @minor.fictifly.com addresses — they are never
// subject to email verification since those addresses don't exist.
const isMinorEmail = (email) =>
  typeof email === 'string' && email.endsWith('@minor.fictifly.com');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when a standard/teacher user has signed up but not yet confirmed email
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // If email is unconfirmed and this isn't a minor account, flag it
        if (!isMinorEmail(u.email) && !u.email_confirmed_at) {
          setAwaitingVerification(true);
          setLoading(false);
        } else {
          setAwaitingVerification(false);
          fetchProfile(u.id);
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;
        setUser(u);

        if (!u) {
          setProfile(null);
          setAwaitingVerification(false);
          return;
        }

        // EMAIL_CONFIRMED fires when the user clicks the verification link.
        // SIGNED_IN fires for all sign-ins including unverified ones.
        // USER_UPDATED fires in some Supabase versions on email confirmation.
        if (event === 'EMAIL_CONFIRMED' || event === 'USER_UPDATED') {
          setAwaitingVerification(false);
          fetchProfile(u.id);
          return;
        }

        if (event === 'SIGNED_IN') {
          // Minor/student accounts are always considered verified
          if (isMinorEmail(u.email)) {
            setAwaitingVerification(false);
            fetchProfile(u.id);
            return;
          }

          // Standard/teacher: check email_confirmed_at
          if (!u.email_confirmed_at) {
            setAwaitingVerification(true);
            setLoading(false);
            return;
          }

          setAwaitingVerification(false);
          fetchProfile(u.id);
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

    // No profile found — Google OAuth user who slipped through.
    // Auto-create a minimal profile so they aren't stuck.
    let username = generateUsername();
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
    setAwaitingVerification(false);
  }

  const value = {
    user,
    profile,
    loading,
    awaitingVerification,
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