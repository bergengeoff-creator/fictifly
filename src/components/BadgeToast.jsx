import { useEffect } from 'react';

const BADGE_COLORS = {
  'First Spark': '#D4845A',
  'Story Hoarder': '#2E6DA4',
  'Dedicated Writer': '#E86A3A',
  'Week Warrior': '#C8A060',
  'Genre Explorer': '#6BAF72',
  'Microfiction Master': '#B07AC0',
  'Flash Fiction Fan': '#5B9EC9',
  'Prolific Writer': '#F2C94C',
};

export default function BadgeToast({ badges, onDismiss }) {
  useEffect(() => {
    if (badges.length > 0) {
      const timer = setTimeout(() => onDismiss(), 4000);
      return () => clearTimeout(timer);
    }
  }, [badges, onDismiss]);

  if (badges.length === 0) return null;

  return (
    <div style={{ position:'fixed', bottom:'2rem', right:'2rem', display:'flex', flexDirection:'column', gap:'0.75rem', zIndex:1000, maxWidth:'320px' }}>
      {badges.map((badge, i) => (
        <div key={i} style={{ background:'#FFFCF8', border:`1px solid ${BADGE_COLORS[badge.name] || '#D9C9B0'}`, borderLeft:`4px solid ${BADGE_COLORS[badge.name] || '#D4845A'}`, borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 4px 20px rgba(58,50,38,0.15)', display:'flex', alignItems:'center', gap:'0.75rem', animation:'slideIn 0.3s ease' }}>
          <div style={{ fontSize:'2rem' }}>{badge.icon}</div>
          <div>
            <div style={{ fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:BADGE_COLORS[badge.name] || '#D4845A', marginBottom:'0.2rem' }}>Badge Earned!</div>
            <div style={{ fontWeight:700, color:'#3A3226', fontSize:'0.95rem' }}>{badge.name}</div>
            <div style={{ fontSize:'0.78rem', color:'#9A8878' }}>{badge.description}</div>
          </div>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}
