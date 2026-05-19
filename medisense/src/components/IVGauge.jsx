import React from 'react';

export default function IVGauge({ percentage, size = 160, grams }) {
  const strokeWidth = size < 130 ? 10 : 14;
  const radius = (size / 2) - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  const safe = Math.max(0, Math.min(100, isNaN(percentage) || percentage === null ? 0 : percentage));
  const dashoffset = circumference - (safe / 100) * circumference;
  const noData = percentage === null;

  // Modern Color Mapping
  let trackColor, lightBg;
  if (noData) {
    trackColor = '#E2E8F0'; // Slate 200
    lightBg = '#F8FAFC';    // Slate 50
  } else if (safe <= 10) {
    trackColor = '#EF4444'; // Red 500
    lightBg = '#FEF2F2';    // Red 50
  } else if (safe <= 25) {
    trackColor = '#F97316'; // Orange 500
    lightBg = '#FFF7ED';    // Orange 50
  } else {
    trackColor = '#7C3AED'; // Primary 600 (Purple)
    lightBg = '#F5F3FF';    // Primary 50
  }

  const fontSize = size < 130 ? 'text-2xl' : 'text-4xl';
  const subSize = size < 130 ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className="relative flex flex-col items-center justify-center group" style={{ width: size, height: size }}>
      {/* Background Glow */}
      {!noData && (
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-1000 scale-90 group-hover:scale-100"
          style={{ backgroundColor: trackColor }}
        />
      )}
      
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#F1F5F9" strokeWidth={strokeWidth} fill="white"
        />
        {/* Filled Arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={noData ? circumference : dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <div className="text-center leading-none">
          <span className={`${fontSize} font-black tracking-tight tabular-nums transition-colors duration-500`} style={{ color: noData ? '#94A3B8' : '#0F172A' }}>
            {noData ? '—' : `${safe.toFixed(0)}`}
            {!noData && <span className="text-xs font-bold text-slate-400 ml-0.5">%</span>}
          </span>
          {grams != null && !noData && (
            <p className={`${subSize} font-bold text-slate-400 mt-2 uppercase tracking-widest`}>
              {grams.toFixed(0)} <span className="font-normal">grams</span>
            </p>
          )}
          {noData && (
            <p className={`${subSize} font-bold text-slate-400 mt-1 uppercase tracking-widest`}>Offline</p>
          )}
        </div>
      </div>
    </div>
  );
}
