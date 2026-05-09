// FictiflyLogo — the full brand logo with Flor de Barcelona i-dots
// Use this on splash screens, onboarding, and auth pages

export default function FictiflyLogo({ width = 260, style = {} }) {
  const height = Math.round(width * (155.27 / 634.73));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 634.73 155.27"
      width={width}
      height={height}
      style={{ display: 'block', ...style }}
    >
      <g>
        <path d="M50.21,55.56h-7.48v-9.2h7.48v-3.68c0-10.46,6.25-15.4,15.23-15.4.88,0,2.91.1,6.6.39v10.26c-1.58-.19-3.17-.29-4.49-.29-3.61,0-4.84,1.55-4.84,5.81v2.9h8.63v9.2h-8.63v40.86h-12.5v-40.86ZM85.24,96.42h-12.5v-50.06h12.5v50.06Z" style={{fill:'#3b3227'}}/>
        <path d="M131.72,63.98h-12.24c-.79-5.71-3.87-8.62-9.24-8.62-7.57,0-10.65,8.13-10.65,16.27s3.08,15.78,10.39,15.78c5.55,0,9.07-3.49,9.95-10.17h12.06c-1.67,13.17-9.77,20.53-21.92,20.53-14.17,0-22.98-11.13-22.98-25.66,0-15.98,8.8-27.11,23.24-27.11,11.62,0,20.77,6.97,21.39,18.98Z" style={{fill:'#3b3227'}}/>
        <path d="M151.36,46.36h9.15v9.2h-9.15v24.79c0,4.65,1.06,5.81,5.28,5.81,1.41,0,2.82-.1,3.87-.39v10.75c-2.11.39-4.93.48-7.39.48-9.59,0-14.26-3.2-14.26-12.1v-29.34h-7.57v-9.2h7.57v-15.01h12.5v15.01Z" style={{fill:'#3b3227'}}/>
        <path d="M174.36,96.42h-12.5v-50.06h12.5v50.06Z" style={{fill:'#3b3227'}}/>
        <path d="M183.43,55.56h-7.48v-9.2h7.48v-3.68c0-10.46,6.25-15.4,15.23-15.4.88,0,2.91.1,6.6.39v10.26c-1.58-.19-3.17-.29-4.49-.29-3.61,0-4.84,1.55-4.84,5.81v2.9h8.63v9.2h-8.63v40.86h-12.5v-40.86ZM222.87,96.42h-12.5V27.29h12.5v69.14Z" style={{fill:'#d4845b'}}/>
        <path d="M247.6,80.64h.18l9.95-34.28h12.94l-19.02,56.36c-2.64,7.84-7.04,11.33-15.49,11.33-2.99,0-5.19-.19-7.83-.48v-11.33c2.64.39,4.84.48,6.6.48,3.52,0,5.55-2.71,5.55-6.29,0-.87-.09-1.74-.53-3.1l-16.02-46.96h13.38l10.3,34.28Z" style={{fill:'#d4845b'}}/>
      </g>

      {/* Flor de Barcelona — first i dot */}
      <g>
        <circle cx="79.05" cy="33.44" r="3.54" style={{fill:'#d4845b',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M75.63,34.27c-1.33-.41-2.3-1.66-2.3-3.13,0-1.81,1.47-3.27,3.27-3.27,1.39,0,2.58.87,3.05,2.09" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M78.32,29.98c.47-1.23,1.66-2.11,3.06-2.11,1.81,0,3.27,1.47,3.27,3.27,0,1.42-.9,2.63-2.16,3.08" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M79.74,36.9c-.4,1.35-1.66,2.34-3.14,2.34-1.81,0-3.27-1.47-3.27-3.27,0-1.45.94-2.67,2.24-3.11" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M82.55,32.9c1.23.47,2.11,1.66,2.11,3.06,0,1.81-1.47,3.27-3.27,3.27-.94,0-1.79-.4-2.39-1.04" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M78.99,38.2c-.34-.37-.6-.81-.75-1.3" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
      </g>

      {/* Flor de Barcelona — second i dot */}
      <g>
        <circle cx="168.17" cy="33.33" r="3.54" style={{fill:'#d4845b',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M164.75,34.16c-1.33-.41-2.3-1.66-2.3-3.13,0-1.81,1.47-3.27,3.27-3.27,1.39,0,2.58.87,3.05,2.09" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M167.44,29.87c.47-1.23,1.66-2.11,3.06-2.11,1.81,0,3.27,1.47,3.27,3.27,0,1.42-.9,2.63-2.16,3.08" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M168.86,36.79c-.4,1.35-1.66,2.34-3.14,2.34-1.81,0-3.27-1.47-3.27-3.27,0-1.45.94-2.67,2.24-3.11" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M171.67,32.79c1.23.47,2.11,1.66,2.11,3.06,0,1.81-1.47,3.27-3.27,3.27-.94,0-1.79-.4-2.39-1.04" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
        <path d="M168.11,38.09c-.34-.37-.6-.81-.75-1.3" style={{fill:'none',stroke:'#5a9eca',strokeMiterlimit:10}}/>
      </g>

      {/* Cascading underline system */}
      <rect x="21.56" y="121.47" width="56.75" height="8.66" rx="4.33" style={{fill:'#c7dce9'}}/>
      <rect x="89.31" y="119.53" width="63.62" height="10.54" rx="5.27" style={{fill:'#a6cadd'}}/>
      <rect x="165.22" y="117.26" width="71.68" height="12.8" rx="6.4" style={{fill:'#8ab5d4'}}/>
      <rect x="249.13" y="115.99" width="80.19" height="14.12" rx="7.06" style={{fill:'#5a9eca'}}/>
      <rect x="341.49" y="114.04" width="81.32" height="14.68" rx="7.34" style={{fill:'none',stroke:'#d6cab0',strokeMiterlimit:10,strokeWidth:'1.5px'}}/>
      <rect x="432.67" y="114.38" width="81.32" height="14.68" rx="7.34" style={{fill:'none',stroke:'#d6cab0',strokeMiterlimit:10,strokeWidth:'1.5px'}}/>
      <rect x="523.86" y="114.38" width="81.32" height="14.68" rx="7.34" style={{fill:'none',stroke:'#d6cab0',strokeMiterlimit:10,strokeWidth:'1.5px'}}/>
    </svg>
  );
}