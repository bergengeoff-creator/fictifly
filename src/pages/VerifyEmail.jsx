import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const FictiflyLogo = () => (
  <svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '220px', height: '69px', display: 'block', margin: '0 auto 1.75rem' }}>
    <text x="0" y="120" fontSize="96" fontWeight="600" letterSpacing="-5" fontFamily="system-ui, sans-serif">
      <tspan fill="#3A3226">ficti</tspan><tspan fill="#D4845A">fly</tspan>
    </text>
    <rect x="0" y="142" width="56" height="9" rx="4.5" fill="#5B9EC9" opacity="0.35"/>
    <rect x="68" y="140" width="64" height="11" rx="5.5" fill="#5B9EC9" opacity="0.55"/>
    <rect x="144" y="138" width="72" height="13" rx="6.5" fill="#5B9EC9" opacity="0.75"/>
    <rect x="228" y="136" width="80" height="15" rx="7.5" fill="#5B9EC9"/>
    <rect x="320" y="136" width="80" height="15" rx="7.5" fill="none" stroke="#D9C9B0" strokeWidth="1.5"/>
    <rect x="412" y="136" width="80" height="15" rx="7.5" fill="none" stroke="#D9C9B0" strokeWidth="1.5"/>
    <rect x="504" y="136" width="80" height="15" rx="7.5" fill="none" stroke="#D9C9B0" strokeWidth="1.5"/>
  </svg>
);

export default function VerifyEmail() {
  const { state } = useLocation();
  const email = state?.email || '';
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState(null);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendError(null);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    });
    if (error) {
      setResendError('Could not resend — please try again in a moment.');
    } else {
      setResent(true);
    }
    setResending(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <FictiflyLogo />

        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3A3226', marginBottom: '0.5rem' }}>
          Check your email
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#6B5D4E', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          We sent a confirmation link to{' '}
          {email
            ? <strong style={{ color: '#3A3226' }}>{email}</strong>
            : 'your email address'
          }.
          Click the link in the email to activate your account and start writing.
        </p>

        <div style={{ background: '#F5EFE6', border: '1px solid #D9C9B0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B5D4E', marginBottom: '0.5rem' }}>Didn't get it?</div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#9A8878', lineHeight: 1.8 }}>
            <li>Check your spam or junk folder</li>
            <li>Make sure you used the right email address</li>
            <li>The link expires after 24 hours</li>
          </ul>
        </div>

        {resent ? (
          <div style={{ background: '#F0F7ED', border: '1px solid #6BAF72', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#3A7040', fontSize: '0.88rem', fontWeight: 500 }}>
            ✓ Email resent — check your inbox again.
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending || !email}
            style={{ background: 'transparent', border: '1px solid #D9C9B0', borderRadius: '10px', color: '#6B5D4E', fontSize: '0.88rem', fontWeight: 500, padding: '0.6rem 1.25rem', cursor: resending || !email ? 'not-allowed' : 'pointer', marginBottom: '1.25rem', width: '100%' }}
          >
            {resending ? 'Resending...' : 'Resend confirmation email'}
          </button>
        )}

        {resendError && (
          <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {resendError}
          </div>
        )}

        <p style={{ fontSize: '0.82rem', color: '#9A8878', marginTop: '0.5rem' }}>
          Wrong email?{' '}
          <Link to="/signup" style={{ color: '#2E6DA4', fontWeight: 600, textDecoration: 'none' }}>
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}