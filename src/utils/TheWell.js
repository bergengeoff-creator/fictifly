import { useId, useState, useEffect } from 'react';

/**
 * TheWell — Fictifly's visual identity mark.
 *
 * Props:
 *   size     — 'full' (480px) | 'medium' (240px) | 'icon' (48px)  default: 'full'
 *   darkBg   — boolean — renders dark background if true            default: true
 *   animate  — boolean — enable CSS animations                      default: true
 *   style    — passthrough style object
 *   className — passthrough className
 */
export default function TheWell({
  size = 'full',
  darkBg = true,
  animate = true,
  style = {},
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const px = { full: 480, medium: 240, icon: 48 }[size] || 480;
  const an = animate ? '' : 'animation:none!important;';

  // Letter cycling for the glass gear porthole — "fictifly" one letter at a time
  const LETTERS = ['f','i','c','t','i','f','l','y'];
  const GEAR_DURATION_MS = 7000; // matches gsr animation duration
  const PER_LETTER_MS = GEAR_DURATION_MS / LETTERS.length;
  const [letterIdx, setLetterIdx] = useState(0);
  const [letterVisible, setLetterVisible] = useState(true);

  useEffect(() => {
    if (!animate || size === 'icon') return;
    const cycle = () => {
      setLetterVisible(false);
      setTimeout(() => {
        setLetterIdx(i => (i + 1) % LETTERS.length);
        setLetterVisible(true);
        setTimeout(() => setLetterVisible(false), PER_LETTER_MS * 0.55);
      }, PER_LETTER_MS * 0.2);
    };
    setLetterVisible(true);
    setTimeout(() => setLetterVisible(false), PER_LETTER_MS * 0.55);
    const interval = setInterval(cycle, PER_LETTER_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, size]);

  const css = `
    @keyframes cab-gs-${uid}  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes cab-gsr-${uid} { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    @keyframes cab-fl-${uid}  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes cab-qu-${uid}  { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(-8deg) translateY(-2px)} }
    @keyframes cab-gw-${uid}  { 0%,100%{opacity:0.6} 50%{opacity:1} }
    @keyframes cab-gs2-${uid} { 0%,100%{opacity:0.08} 50%{opacity:0.18} }
    @keyframes cab-sp-${uid}  { 0%,100%{opacity:0;transform:scale(0.3)} 50%{opacity:1;transform:scale(1)} }
    @keyframes cab-sm-${uid}  { 0%{transform:translateY(0);opacity:0.5} 100%{transform:translateY(-36px);opacity:0} }
    .c${uid}-gs  { animation:cab-gs-${uid}  10s linear infinite; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-gsr { animation:cab-gsr-${uid}  7s linear infinite; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-gs2 { animation:cab-gs-${uid}   5s linear infinite; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-gsr2{ animation:cab-gsr-${uid}  6s linear infinite; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-gs3 { animation:cab-gs-${uid}   4s linear infinite; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-letter { transition: opacity ${Math.round(PER_LETTER_MS * 0.2)}ms ease; }
    .c${uid}-fl1 { animation:cab-fl-${uid} 4.5s ease-in-out infinite 0.2s; ${an} }
    .c${uid}-fl2 { animation:cab-fl-${uid} 5.5s ease-in-out infinite 1s; ${an} }
    .c${uid}-fl3 { animation:cab-fl-${uid} 4s ease-in-out infinite 2s; ${an} }
    .c${uid}-qu  { animation:cab-qu-${uid} 2.8s ease-in-out infinite; ${an} }
    .c${uid}-gw1 { animation:cab-gw-${uid} 3s ease-in-out infinite; ${an} }
    .c${uid}-gw2 { animation:cab-gw-${uid} 2.5s ease-in-out infinite 0.5s; ${an} }
    .c${uid}-gw3 { animation:cab-gw-${uid} 2s ease-in-out infinite 1s; ${an} }
    .c${uid}-gt  { animation:cab-gs2-${uid} 8s ease-in-out infinite; ${an} }
    .c${uid}-sp1 { animation:cab-sp-${uid} 2s ease-in-out infinite 0.3s; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-sp2 { animation:cab-sp-${uid} 2.8s ease-in-out infinite 1.2s; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-sp3 { animation:cab-sp-${uid} 2.3s ease-in-out infinite 0.7s; transform-box:fill-box; transform-origin:center; ${an} }
    .c${uid}-sm1 { animation:cab-sm-${uid} 3s ease-in infinite 0s; ${an} }
    .c${uid}-sm2 { animation:cab-sm-${uid} 3.5s ease-in infinite 1.1s; ${an} }
    .c${uid}-sm3 { animation:cab-sm-${uid} 4s ease-in infinite 2.2s; ${an} }
  `;

  // ── Icon ───────────────────────────────────────────────────────────────
  if (size === 'icon') {
    return (
      <span className={className} style={{ display:'inline-block', width:px, height:px, ...style }}>
        <style>{css}</style>
        <svg width={px} height={px} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`ip-${uid}`} cx="40%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#5B9EC9"/><stop offset="50%" stopColor="#1A4A7A"/><stop offset="100%" stopColor="#0A1A30"/>
            </radialGradient>
          </defs>
          {darkBg && <circle cx="24" cy="24" r="24" fill="#1A1610"/>}
          <circle cx="24" cy="24" r="22" fill="#0A0A18"/>
          <circle cx="24" cy="24" r="19" fill={`url(#ip-${uid})`} className={`c${uid}-gw1`}/>
          <circle cx="22" cy="22" r="7"   fill="#2E6DA4" opacity="0.4" className={`c${uid}-gw2`}/>
          <circle cx="21" cy="21" r="3.5" fill="#5B9EC9" opacity="0.35" className={`c${uid}-gw3`}/>
          <circle cx="20" cy="20" r="1.5" fill="#A8D4F0" opacity="0.6"/>
          <circle cx="19" cy="19" r="0.8" fill="white" opacity="0.8"/>
          <circle cx="24" cy="24" r="19" fill="none" stroke="#5B9EC9" strokeWidth="0.5" opacity="0.4"/>
          <circle cx="24" cy="24" r="22" fill="none" stroke="#C8A060" strokeWidth="1.5"/>
        </svg>
      </span>
    );
  }

  // Gear teeth helper — renders N teeth around origin
  const teeth = (n, r, len, sw, color) => {
    return Array.from({length:n}, (_,i) => {
      const a = (i / n) * Math.PI * 2;
      const x1 = Math.cos(a) * r, y1 = Math.sin(a) * r;
      const x2 = Math.cos(a) * (r+len), y2 = Math.sin(a) * (r+len);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw}/>;
    });
  };

  // Gear component
  const Gear = ({cx, cy, r, n, fill, stroke, spoke, cls}) => (
    <g transform={`translate(${cx},${cy})`} className={cls}>
      <circle r={r+4} fill="none" stroke={stroke} strokeWidth="1.5"/>
      <circle r={r} fill={fill} stroke={stroke} strokeWidth="1"/>
      <circle r={r*0.28} fill={stroke} stroke={fill} strokeWidth="0.8"/>
      {teeth(n, r, 5, 2.5, stroke)}
      {spoke && <>
        <line x1={-r*0.8} y1="0" x2={r*0.8} y2="0" stroke={spoke} strokeWidth="1.2"/>
        <line x1="0" y1={-r*0.8} x2="0" y2={r*0.8} stroke={spoke} strokeWidth="1.2"/>
        <line x1={-r*0.56} y1={-r*0.56} x2={r*0.56} y2={r*0.56} stroke={spoke} strokeWidth="0.8"/>
        <line x1={r*0.56} y1={-r*0.56} x2={-r*0.56} y2={r*0.56} stroke={spoke} strokeWidth="0.8"/>
      </>}
    </g>
  );

  // ── Medium ─────────────────────────────────────────────────────────────
  if (size === 'medium') {
    // Tighter composition — gears hug the inkwell
    return (
      <span className={className} style={{ display:'inline-block', width:px, height:px, ...style }}>
        <style>{css}</style>
        <svg width={px} height={px} viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`ip-${uid}`} cx="40%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#5B9EC9"/><stop offset="50%" stopColor="#1A4A7A"/><stop offset="100%" stopColor="#0A1A30"/>
            </radialGradient>
            <radialGradient id={`br-${uid}`} cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#E8C888"/><stop offset="50%" stopColor="#C8A060"/><stop offset="100%" stopColor="#7A5A18"/>
            </radialGradient>
            <filter id={`igf-${uid}`}>
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <clipPath id={`wc-${uid}`}><ellipse cx="120" cy="125" rx="38" ry="40"/></clipPath>
          </defs>
          {darkBg && <rect width="240" height="240" fill="#1A1610"/>}

          {/* Gears mounted on the body */}
          <Gear cx={54}  cy={108} r={22} n={12} fill="#2A1808" stroke="#B8903A" spoke="#6A4010" cls={`c${uid}-gs`}/>
          <Gear cx={186} cy={108} r={18} n={10} fill="#2A1808" stroke="#C8A060" spoke="#6A4010" cls={`c${uid}-gsr`}/>
          <Gear cx={120} cy={48}  r={14} n={8}  fill="#2A1808" stroke="#E8C888" spoke={null}     cls={`c${uid}-gs2`}/>
          <Gear cx={120} cy={195} r={13} n={8}  fill="#2A1808" stroke="#D4845A" spoke={null}     cls={`c${uid}-gsr2`}/>

          {/* Connector pipes */}
          <line x1="76"  y1="108" x2="84"  y2="108" stroke="#6A4010" strokeWidth="3"/>
          <line x1="156" y1="108" x2="164" y2="108" stroke="#6A4010" strokeWidth="3"/>
          <line x1="120" y1="62"  x2="120" y2="80"  stroke="#6A4010" strokeWidth="3"/>
          <line x1="120" y1="182" x2="120" y2="168" stroke="#6A4010" strokeWidth="3"/>

          {/* Inkwell body */}
          <ellipse cx="120" cy="122" rx="58" ry="62" fill="#2A1808" stroke="#B8903A" strokeWidth="2.5"/>
          <ellipse cx="120" cy="122" rx="53" ry="57" fill="#1E1208" stroke="#7A5A18" strokeWidth="1"/>
          <ellipse cx="120" cy="122" rx="48" ry="52" fill="none" stroke="#7A5A18" strokeWidth="0.6" strokeDasharray="3,3"/>

          {/* Brass collar */}
          <path d="M70 100 Q120 93 170 100 Q170 110 120 114 Q70 110 70 100Z" fill={`url(#br-${uid})`} stroke="#7A5A18" strokeWidth="0.8"/>
          {[78,96,114,132,150,162].map(x => <circle key={x} cx={x} cy="106" r="2" fill="#E8C888" stroke="#7A5A18" strokeWidth="0.5"/>)}
          <path d="M73 138 Q120 146 167 138 Q167 148 120 152 Q73 148 73 138Z" fill="#B8903A" stroke="#7A5A18" strokeWidth="0.8"/>

          {/* Ink pool */}
          <ellipse cx="120" cy="122" rx="40" ry="42" fill="#0A0A18"/>
          <ellipse cx="120" cy="122" rx="36" ry="38" fill={`url(#ip-${uid})`} className={`c${uid}-gw1`} filter={`url(#igf-${uid})`}/>
          <ellipse cx="120" cy="122" rx="25" ry="27" fill="#0A1A38" opacity="0.6"/>
          <g clipPath={`url(#wc-${uid})`}>
            <text x="120" y="125" textAnchor="middle" fontFamily="'Fraunces',Georgia,serif" fontSize="5.5" fontStyle="italic" letterSpacing="1.5" fill="#A8D4F0" opacity="0.13" className={`c${uid}-gt`}>de la tinta, tot</text>
          </g>
          <ellipse cx="119" cy="118" rx="16" ry="17" fill="#2E6DA4" opacity="0.35" className={`c${uid}-gw2`}/>
          <ellipse cx="118" cy="116" rx="8"  ry="8.5" fill="#5B9EC9" opacity="0.3" className={`c${uid}-gw3`}/>
          <ellipse cx="117" cy="115" rx="3.5" ry="4" fill="#A8D4F0" opacity="0.5"/>
          <ellipse cx="116" cy="114" rx="1.8" ry="2" fill="white" opacity="0.75"/>
          <ellipse cx="120" cy="122" rx="36" ry="38" fill="none" stroke="#5B9EC9" strokeWidth="0.8" opacity="0.4"/>

          {/* Magnifying glass */}
          <circle cx="120" cy="115" r="28" fill="none" stroke="#C8A060" strokeWidth="4"/>
          <circle cx="120" cy="115" r="25" fill="none" stroke="#E8C888" strokeWidth="1"/>
          <ellipse cx="112" cy="107" rx="11" ry="6" fill="white" opacity="0.05" transform="rotate(-20,112,107)"/>
          <rect x="138" y="130" width="6" height="26" rx="3" fill={`url(#br-${uid})`} stroke="#7A5A18" strokeWidth="0.8" transform="rotate(35,141,143)"/>

          {/* Smoke */}
          <g className={`c${uid}-sm1`} opacity="0.4"><path d="M114 86 Q111 79 114 72" stroke="#5B9EC9" strokeWidth="1.5" fill="none" strokeLinecap="round"/></g>
          <g className={`c${uid}-sm2`} opacity="0.35"><path d="M120 84 Q123 77 120 70" stroke="#5B9EC9" strokeWidth="1.5" fill="none" strokeLinecap="round"/></g>
          <g className={`c${uid}-sm3`} opacity="0.3"><path d="M126 86 Q129 78 126 71" stroke="#5B9EC9" strokeWidth="1.5" fill="none" strokeLinecap="round"/></g>

          {/* Gauges */}
          <circle cx="78"  cy="148" r="10" fill="#0A0808" stroke="#C8A060" strokeWidth="1.5"/>
          <circle cx="78"  cy="148" r="7"  fill="#0A0808" stroke="#7A5A18" strokeWidth="0.8"/>
          <line x1="78" y1="148" x2="82" y2="143" stroke="#D4845A" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="78" cy="148" r="1.5" fill="#C8A060"/>
          <circle cx="162" cy="148" r="8"  fill="#0A0808" stroke="#C8A060" strokeWidth="1.2"/>
          <circle cx="162" cy="148" r="5"  fill="#0A0808" stroke="#7A5A18" strokeWidth="0.8"/>
          <line x1="162" y1="148" x2="159" y2="144" stroke="#5B9EC9" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="162" cy="148" r="1.2" fill="#C8A060"/>

          {/* Sparkles */}
          <g className={`c${uid}-sp1`}><path d="M52 62 L54 57 L56 62 L54 67Z" fill="#E8C888" opacity="0.8"/></g>
          <g className={`c${uid}-sp2`}><path d="M188 62 L190 57 L192 62 L190 67Z" fill="#D4845A" opacity="0.7"/></g>
          <g className={`c${uid}-sp3`}><path d="M120 22 L122 17 L124 22 L122 27Z" fill="#5B9EC9" opacity="0.6"/></g>
        </svg>
      </span>
    );
  }

  // ── Full ───────────────────────────────────────────────────────────────
  return (
    <span className={className} style={{ display:'inline-block', width:px, height:px, ...style }}>
      <style>{css}</style>
      <svg width={px} height={px} viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" style={{overflow:'visible'}}>
        <defs>
          <radialGradient id={`bgG-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2E6DA4" stopOpacity="0.12"/><stop offset="100%" stopColor="#1A1610" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id={`ipG-${uid}`} cx="40%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#5B9EC9"/><stop offset="50%" stopColor="#1A4A7A"/><stop offset="100%" stopColor="#0A1A30"/>
          </radialGradient>
          <radialGradient id={`brG-${uid}`} cx="30%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#E8C888"/><stop offset="50%" stopColor="#C8A060"/><stop offset="100%" stopColor="#7A5A18"/>
          </radialGradient>
          <radialGradient id={`brG2-${uid}`} cx="30%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#D8B060"/><stop offset="50%" stopColor="#B8903A"/><stop offset="100%" stopColor="#6A4A10"/>
          </radialGradient>
          <filter id={`igF-${uid}`}>
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id={`wC-${uid}`}><ellipse cx="240" cy="248" rx="68" ry="72"/></clipPath>
        </defs>

        {darkBg && <rect width="480" height="480" fill="#1A1610"/>}
        <ellipse cx="240" cy="248" rx="220" ry="200" fill={`url(#bgG-${uid})`}/>

        {/* ── Large gear — left, hugging the body ── */}
        <g transform="translate(102,240)" className={`c${uid}-gs`}>
          <circle r="52" fill="none" stroke="#B8903A" strokeWidth="2"/>
          <circle r="46" fill="#2A1808" stroke="#7A5A18" strokeWidth="1.5"/>
          <circle r="13" fill="#B8903A" stroke="#7A5A18" strokeWidth="1.5"/>
          {Array.from({length:14},(_,i) => {
            const a=(i/14)*Math.PI*2, x1=Math.cos(a)*46, y1=Math.sin(a)*46, x2=Math.cos(a)*54, y2=Math.sin(a)*54;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B8903A" strokeWidth="3"/>;
          })}
          <line x1="-34" y1="0" x2="34" y2="0" stroke="#7A5A18" strokeWidth="1.5"/>
          <line x1="0" y1="-34" x2="0" y2="34" stroke="#7A5A18" strokeWidth="1.5"/>
          <line x1="-24" y1="-24" x2="24" y2="24" stroke="#7A5A18" strokeWidth="1"/>
          <line x1="24" y1="-24" x2="-24" y2="24" stroke="#7A5A18" strokeWidth="1"/>
        </g>

        {/* ── Medium gear RIGHT — glass porthole with fictifly letters ── */}
        <g transform="translate(378,240)" className={`c${uid}-gsr`}>
          <circle r="40" fill="none" stroke="#C8A060" strokeWidth="2"/>
          {/* Glass interior — dark translucent */}
          <circle r="34" fill="#1A2A3A" opacity="0.95"/>
          <circle r="34" fill="none" stroke="#C8A060" strokeWidth="1.5"/>
          {/* Glass sheen */}
          <ellipse cx="-8" cy="-12" rx="10" ry="6" fill="white" opacity="0.04" transform="rotate(-20,-8,-12)"/>
          {/* Rivets around glass frame */}
          {[0,45,90,135,180,225,270,315].map((deg,i) => {
            const a = deg * Math.PI / 180;
            return <circle key={i} cx={Math.round(Math.cos(a)*34*10)/10} cy={Math.round(Math.sin(a)*34*10)/10} r="2" fill="#E8C888" stroke="#7A5A18" strokeWidth="0.5"/>;
          })}
          {/* Gear teeth */}
          {Array.from({length:12},(_,i) => {
            const a=(i/12)*Math.PI*2, x1=Math.cos(a)*34, y1=Math.sin(a)*34, x2=Math.cos(a)*42, y2=Math.sin(a)*42;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8A060" strokeWidth="2.5"/>;
          })}
        </g>

        {/* ── Letter porthole — fixed position, letter fades in/out ── */}
        <text
          x="378" y="247"
          textAnchor="middle"
          fontFamily="'Fraunces',Georgia,serif"
          fontSize="26"
          fontStyle="italic"
          fill="#C8A060"
          opacity={letterVisible ? 0.78 : 0}
          className={`c${uid}-letter`}
        >{LETTERS[letterIdx]}</text>



        {/* ── Small gear — top ── */}
        <g transform="translate(240,122)" className={`c${uid}-gs2`}>
          <circle r="26" fill="none" stroke="#E8C888" strokeWidth="1.8"/>
          <circle r="21" fill="#2A1808" stroke="#7A5A18" strokeWidth="1"/>
          <circle r="6"  fill="#E8C888" stroke="#7A5A18" strokeWidth="1"/>
          {Array.from({length:10},(_,i) => {
            const a=(i/10)*Math.PI*2, x1=Math.cos(a)*21, y1=Math.sin(a)*21, x2=Math.cos(a)*28, y2=Math.sin(a)*28;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E8C888" strokeWidth="2"/>;
          })}
          <line x1="-16" y1="0" x2="16" y2="0" stroke="#7A5A18" strokeWidth="1.2"/>
          <line x1="0" y1="-16" x2="0" y2="16" stroke="#7A5A18" strokeWidth="1.2"/>
        </g>

        {/* ── Small gear — bottom ── */}
        <g transform="translate(240,372)" className={`c${uid}-gsr2`}>
          <circle r="24" fill="none" stroke="#D4845A" strokeWidth="1.8"/>
          <circle r="19" fill="#2A1808" stroke="#7A5A18" strokeWidth="1"/>
          <circle r="5"  fill="#D4845A" stroke="#7A5A18" strokeWidth="1"/>
          {Array.from({length:10},(_,i) => {
            const a=(i/10)*Math.PI*2, x1=Math.cos(a)*19, y1=Math.sin(a)*19, x2=Math.cos(a)*26, y2=Math.sin(a)*26;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D4845A" strokeWidth="2"/>;
          })}
        </g>

        {/* ── Extra small accent gear top-left ── */}
        <g transform="translate(148,155)" className={`c${uid}-gs3`}>
          <circle r="16" fill="none" stroke="#E8C888" strokeWidth="1.5"/>
          <circle r="12" fill="#2A1808" stroke="#7A5A18" strokeWidth="1"/>
          <circle r="3.5" fill="#E8C888" stroke="#7A5A18" strokeWidth="0.8"/>
          {Array.from({length:8},(_,i) => {
            const a=(i/8)*Math.PI*2, x1=Math.cos(a)*12, y1=Math.sin(a)*12, x2=Math.cos(a)*18, y2=Math.sin(a)*18;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E8C888" strokeWidth="1.8"/>;
          })}
        </g>

        {/* ── Connector pipes — short, tight to body ── */}
        <line x1="154" y1="240" x2="164" y2="240" stroke="#7A5A18" strokeWidth="3.5"/>
        <line x1="316" y1="240" x2="326" y2="240" stroke="#7A5A18" strokeWidth="3.5"/>
        <line x1="240" y1="148" x2="240" y2="162" stroke="#7A5A18" strokeWidth="3.5"/>
        <line x1="240" y1="342" x2="240" y2="356" stroke="#7A5A18" strokeWidth="3.5"/>
        <line x1="162" y1="165" x2="170" y2="174" stroke="#7A5A18" strokeWidth="2.5"/>

        {/* ── Pipes feeding the well ── */}
        <path d="M168 228 Q155 220 148 210" stroke="#8A6030" strokeWidth="7" fill="none" strokeLinecap="round"/>
        <circle cx="147" cy="209" r="5.5" fill="#C8A060" stroke="#7A5A18" strokeWidth="1"/>
        <path d="M312 228 Q325 220 332 210" stroke="#8A6030" strokeWidth="7" fill="none" strokeLinecap="round"/>
        <circle cx="333" cy="209" r="5.5" fill="#C8A060" stroke="#7A5A18" strokeWidth="1"/>
        <path d="M228 178 Q224 166 220 155" stroke="#8A6030" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M252 178 Q256 166 260 155" stroke="#8A6030" strokeWidth="6" fill="none" strokeLinecap="round"/>

        {/* ── Inkwell body ── */}
        <ellipse cx="240" cy="248" rx="100" ry="104" fill="#2A1808" stroke="#B8903A" strokeWidth="3"/>
        <ellipse cx="240" cy="248" rx="94"  ry="98"  fill="#1E1208" stroke="#7A5A18" strokeWidth="1"/>
        <ellipse cx="240" cy="248" rx="87"  ry="91"  fill="none" stroke="#7A5A18" strokeWidth="0.7" strokeDasharray="4,3"/>

        {/* Brass collar top */}
        <path d="M160 208 Q240 198 320 208 Q320 222 240 228 Q160 222 160 208Z" fill={`url(#brG-${uid})`} stroke="#7A5A18" strokeWidth="1"/>
        {[174,196,218,240,262,284,306].map(x => <circle key={x} cx={x} cy="216" r="2.8" fill="#E8C888" stroke="#7A5A18" strokeWidth="0.7"/>)}

        {/* Brass collar bottom */}
        <path d="M166 278 Q240 288 314 278 Q314 292 240 298 Q166 292 166 278Z" fill={`url(#brG2-${uid})`} stroke="#7A5A18" strokeWidth="1"/>

        {/* ── Ink pool ── */}
        <ellipse cx="240" cy="248" rx="72" ry="76" fill="#0A0A18"/>
        <ellipse cx="240" cy="248" rx="65" ry="68" fill={`url(#ipG-${uid})`} className={`c${uid}-gw1`} filter={`url(#igF-${uid})`}/>
        <ellipse cx="228" cy="234" rx="30" ry="16" fill="#A8D4F0" opacity="0.1" transform="rotate(-15,228,234)"/>
        <ellipse cx="240" cy="248" rx="45" ry="48" fill="#0A1A38" opacity="0.6"/>

        {/* Hidden Catalan text — submerged */}
        <g clipPath={`url(#wC-${uid})`}>
          <text x="240" y="252" textAnchor="middle" fontFamily="'Fraunces',Georgia,serif" fontSize="9.5" fontStyle="italic" letterSpacing="2" fill="#A8D4F0" opacity="0.13" className={`c${uid}-gt`}>de la tinta, tot</text>
        </g>

        <ellipse cx="238" cy="242" rx="28" ry="30" fill="#2E6DA4" opacity="0.35" className={`c${uid}-gw2`}/>
        <ellipse cx="236" cy="238" rx="14" ry="15" fill="#5B9EC9" opacity="0.3" className={`c${uid}-gw3`}/>
        <ellipse cx="234" cy="235" rx="6"  ry="7"  fill="#A8D4F0" opacity="0.5"/>
        <ellipse cx="232" cy="233" rx="3"  ry="3.5" fill="white" opacity="0.7"/>
        <ellipse cx="240" cy="248" rx="65" ry="68" fill="none" stroke="#5B9EC9" strokeWidth="1" opacity="0.4"/>
        <ellipse cx="240" cy="248" rx="55" ry="58" fill="none" stroke="#2E6DA4" strokeWidth="0.5" opacity="0.3"/>

        {/* Ink drip */}
        <path d="M240 316 Q242 327 240 340" stroke="#1A4A7A" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
        <ellipse cx="240" cy="342" rx="4" ry="5" fill="#2E6DA4" opacity="0.6"/>

        {/* ── Magnifying glass over the ink ── */}
        <circle cx="240" cy="235" r="46" fill="none" stroke="#C8A060" strokeWidth="5"/>
        <circle cx="240" cy="235" r="43" fill="none" stroke="#E8C888" strokeWidth="1.5"/>
        <circle cx="240" cy="235" r="38" fill="none" stroke="#7A5A18" strokeWidth="0.7"/>
        <ellipse cx="228" cy="222" rx="18" ry="10" fill="white" opacity="0.05" transform="rotate(-20,228,222)"/>
        {/* Handle */}
        <rect x="272" y="258" width="11" height="46" rx="5.5" fill={`url(#brG-${uid})`} stroke="#7A5A18" strokeWidth="1" transform="rotate(35,277,281)"/>
        {[[284,272,298,288],[288,276,302,292],[292,280,306,296]].map(([x1,y1,x2,y2],i) =>
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7A5A18" strokeWidth="0.8" opacity="0.5"/>
        )}

        {/* ── Pressure gauges ── */}
        <circle cx="158" cy="294" r="18" fill="#1A1208" stroke="#C8A060" strokeWidth="2"/>
        <circle cx="158" cy="294" r="14" fill="#0A0808" stroke="#7A5A18" strokeWidth="1"/>
        <line x1="158" y1="294" x2="165" y2="286" stroke="#D4845A" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="158" cy="294" r="2.5" fill="#C8A060"/>
        {[[144,294,147,294],[169,294,172,294],[158,280,158,283],[158,305,158,308]].map(([x1,y1,x2,y2],i) =>
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9A8878" strokeWidth="1"/>
        )}
        <circle cx="322" cy="294" r="14" fill="#0A0808" stroke="#C8A060" strokeWidth="2"/>
        <circle cx="322" cy="294" r="10" fill="#0A0808" stroke="#7A5A18" strokeWidth="0.8"/>
        <line x1="322" y1="294" x2="318" y2="288" stroke="#5B9EC9" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="322" cy="294" r="2" fill="#C8A060"/>

        {/* ── Smoke / vapour ── */}
        <g className={`c${uid}-sm1`} opacity="0.4"><path d="M228 188 Q224 178 228 168" stroke="#5B9EC9" strokeWidth="2" fill="none" strokeLinecap="round"/></g>
        <g className={`c${uid}-sm2`} opacity="0.35"><path d="M240 185 Q244 174 240 164" stroke="#5B9EC9" strokeWidth="2" fill="none" strokeLinecap="round"/></g>
        <g className={`c${uid}-sm3`} opacity="0.3"><path d="M252 188 Q256 177 252 167" stroke="#5B9EC9" strokeWidth="2" fill="none" strokeLinecap="round"/></g>

        {/* ── Orbiting objects — closer in now ── */}
        {/* Book — upper left */}
        <g transform="translate(100,108)" className={`c${uid}-fl1`}>
          <path d="M0 0 Q-22 -6 -30 0 Q-22 6 0 0Z" fill="#D9C9B0" stroke="#9A8878" strokeWidth="0.8"/>
          <path d="M0 0 Q22 -6 30 0 Q22 6 0 0Z"  fill="#EDE3D4" stroke="#9A8878" strokeWidth="0.8"/>
          <path d="M0 -6 L0 6" stroke="#B8903A" strokeWidth="1" fill="none"/>
          {[-24,-22,-20].map((x,i) => <path key={i} d={`M${x} ${[-2,2,5][i]} Q${x+16} ${[-3,1,4][i]} ${x+18} ${[-2,2,5][i]}`} stroke="#9A8878" strokeWidth="0.6" fill="none"/>)}
          {[8,8,8].map((x,i) => <path key={i} d={`M${x} ${[-2,2,5][i]} Q${x+14} ${[-3,1,4][i]} ${x+22} ${[-2,2,5][i]}`} stroke="#9A8878" strokeWidth="0.6" fill="none"/>)}
        </g>

        {/* Quill — upper right */}
        <g transform="translate(376,100)" className={`c${uid}-qu`}>
          <path d="M0 0 Q-12 -28 -24 -56 Q-16 -36 -10 -24 Q-15 -38 -13 -52" fill="#EDE3D4" stroke="#D9C9B0" strokeWidth="0.8"/>
          <path d="M0 0 Q-8 -26 -14 -46" fill="#F5EFE6" opacity="0.7"/>
          <path d="M0 0 L3 14" stroke="#9A8878" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
          <ellipse cx="3" cy="16" rx="2" ry="2.5" fill="#1A4A7A"/>
          <path d="M3 16 Q4 22 3 26" stroke="#2E6DA4" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7"/>
        </g>

        {/* Scroll — lower right */}
        <g transform="translate(376,384)" className={`c${uid}-fl2`}>
          <rect x="-14" y="-20" width="28" height="40" rx="3" fill="#D9C9B0" stroke="#9A8878" strokeWidth="0.7"/>
          <ellipse cx="0" cy="-20" rx="14" ry="5" fill="#C8B090" stroke="#9A8878" strokeWidth="0.6"/>
          <ellipse cx="0" cy="20"  rx="14" ry="5" fill="#C8B090" stroke="#9A8878" strokeWidth="0.6"/>
          {[-14,-9,-4,1,6,10].map((y,i) => <path key={i} d={`M-8 ${y} L${i%2===0?6:8} ${y}`} stroke="#6B5D4E" strokeWidth="0.7" fill="none"/>)}
          <circle cx="0" cy="16" r="6" fill="#D4845A" stroke="#B56840" strokeWidth="0.7"/>
          <text x="0" y="19" textAnchor="middle" fontFamily="Georgia,serif" fontSize="6" fill="#7A3810">f</text>
        </g>

        {/* Inkpot — lower left */}
        <g transform="translate(104,384)" className={`c${uid}-fl3`}>
          <rect x="-12" y="-15" width="24" height="22" rx="3" fill="#5A3A10" stroke="#B8903A" strokeWidth="1"/>
          <ellipse cx="0" cy="-15" rx="12" ry="4.5" fill="#3A2008" stroke="#B8903A" strokeWidth="1"/>
          <ellipse cx="0" cy="-13" rx="8" ry="3" fill="#1A4A7A" opacity="0.8"/>
          <path d="M12 -4 Q18 0 16 6 Q13 3 12 -4Z" fill="#1A4A7A" opacity="0.5"/>
          <rect x="-8" y="-6" width="16" height="12" rx="2" fill="#EDE3D4" opacity="0.8"/>
          {[-2,1,4].map(y => <path key={y} d={`M-5 ${y} L5 ${y}`} stroke="#6B5D4E" strokeWidth="0.6" fill="none"/>)}
        </g>

        {/* Sparkles */}
        <g className={`c${uid}-sp1`}><path d="M76 76 L78 71 L80 76 L78 81Z" fill="#E8C888" opacity="0.8"/><line x1="73" y1="76" x2="83" y2="76" stroke="#E8C888" strokeWidth="0.8" opacity="0.5"/></g>
        <g className={`c${uid}-sp2`}><path d="M404 76 L406 71 L408 76 L406 81Z" fill="#D4845A" opacity="0.7"/></g>
        <g className={`c${uid}-sp3`}><path d="M240 58 L242 53 L244 58 L242 63Z" fill="#5B9EC9" opacity="0.6"/></g>

        {/* Floating letters */}
        <g className={`c${uid}-sp1`}><text x="60" y="200" fontFamily="'Fraunces',Georgia,serif" fontSize="16" fill="#D4845A" opacity="0.45" fontStyle="italic">f</text></g>
        <g className={`c${uid}-sp2`}><text x="402" y="198" fontFamily="'Fraunces',Georgia,serif" fontSize="13" fill="#5B9EC9" opacity="0.4" fontStyle="italic">i</text></g>

      </svg>
    </span>
  );
}