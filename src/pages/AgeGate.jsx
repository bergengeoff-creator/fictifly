import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function AgeGate() {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) { setError('Please select an option to continue.'); return; }
    if (selected === 'under13') { setError('Sorry, this platform is not available for users under 13.'); return; }
    if (selected === '13to17') { navigate('/signup', { state: { isMinor: true } }); }
    else { navigate('/signup', { state: { isMinor: false } }); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <FictiflyLogo />
        <h1 style={{ color: '#3A3226', marginBottom: '0.75rem' }}>Before we begin</h1>
        <p style={{ color: '#6B5D4E', marginBottom: '2rem' }}>Please select your age group so we can set up your account correctly.</p>
        {['under13', '13to17', '18plus'].map((val) => (
          <button key={val} onClick={() => { setSelected(val); setError(null); }}
            style={{ display: 'block', width: '100%', padding: '0.85rem', marginBottom: '0.75rem', borderRadius: '10px', border: '1.5px solid ' + (selected === val ? '#D4845A' : '#D9C9B0'), background: selected === val ? '#D4845A' : 'transparent', color: selected === val ? '#FFFCF8' : '#6B5D4E', cursor: 'pointer', textAlign: 'left' }}>
            {val === 'under13' ? 'Under 13' : val === '13to17' ? '13 to 17 years old' : '18 or older'}
          </button>
        ))}
        {error && <div style={{ background: '#FDF0E8', border: '1px solid #D4845A', borderRadius: '8px', color: '#B56840', padding: '0.75rem', marginBottom: '1rem' }}>{error}</div>}
        <button onClick={handleContinue} style={{ background: '#2E6DA4', color: '#FFFCF8', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', width: '100%' }}>
          Continue
        </button>
      </div>
    </div>
  );
}