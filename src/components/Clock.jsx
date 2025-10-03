import React from 'react';
import { Play, Pause } from 'lucide-react';

const Clock = ({ 
  items, 
  currentTime, 
  isPlaying, 
  setIsPlaying, 
  theme, 
  formatTime, 
  formatTimeShort 
}) => {
  const t = theme === 'light' ? {
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    button: 'bg-blue-600 hover:bg-blue-700 text-white'
  } : {
    text: 'text-white',
    textSecondary: 'text-gray-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white'
  };

  const radius = 140;
  const center = 160;
  const hourDuration = 3600;
  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);

  let acc = 0;
  const segments = items.map((item) => {
    const start = acc;
    const end = acc + item.duration;
    if (start >= hourDuration) return null;
    
    const dur = Math.min(item.duration, hourDuration - start);
    const angle = (dur / hourDuration) * 360;
    const startA = (start / hourDuration) * 360 - 90;
    const startRad = startA * Math.PI / 180;
    const endRad = (startA + angle) * Math.PI / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    acc += item.duration;
    
    return (
      <path 
        key={item.id} 
        d={path} 
        fill={end > hourDuration ? '#dc2626' : item.color} 
        stroke={theme === 'light' ? '#e5e7eb' : '#374151'} 
        strokeWidth={1} 
        opacity={0.8} 
      />
    );
  }).filter(Boolean);

  const currAngle = (currentTime / hourDuration) * 360 - 90;
  const currRad = currAngle * Math.PI / 180;
  const handX = center + (radius - 10) * Math.cos(currRad);
  const handY = center + (radius - 10) * Math.sin(currRad);

  return (
    <div className="flex flex-col items-center">
      <svg width="320" height="320" className="mb-4">
        {segments}
        {[0, 15, 30, 45].map(min => {
          const a = (min / 60) * 360 - 90;
          const rad = a * Math.PI / 180;
          return (
            <g key={min}>
              <line 
                x1={center + (radius - 15) * Math.cos(rad)} 
                y1={center + (radius - 15) * Math.sin(rad)} 
                x2={center + radius * Math.cos(rad)} 
                y2={center + radius * Math.sin(rad)} 
                stroke={theme === 'light' ? '#9ca3af' : '#6b7280'} 
                strokeWidth={2} 
              />
              <text 
                x={center + (radius + 25) * Math.cos(rad)} 
                y={center + (radius + 25) * Math.sin(rad)} 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className={`text-base font-bold ${t.text}`} 
                style={{ userSelect: 'none' }}
              >
                {min}
              </text>
            </g>
          );
        })}
        <line 
          x1={center} 
          y1={center} 
          x2={handX} 
          y2={handY} 
          stroke={theme === 'light' ? '#1f2937' : '#fff'} 
          strokeWidth={3} 
        />
        <circle 
          cx={center} 
          cy={center} 
          r={6} 
          fill={theme === 'light' ? '#1f2937' : '#fff'} 
        />
      </svg>
      
      <div className={`text-2xl font-mono font-bold mb-2 ${t.text}`}>
        {formatTime(currentTime)} / {formatTime(3600)}
      </div>
      
      <div className={`text-sm mb-4 ${t.textSecondary}`}>
        Totaal: {formatTime(totalDuration)}
        {totalDuration > 3600 && (
          <span className="text-red-500 ml-2">
            (+{formatTime(totalDuration - 3600)} over)
          </span>
        )}
      </div>
      
      <button 
        onClick={() => setIsPlaying(!isPlaying)} 
        className={`${t.button} px-4 py-2 rounded-lg flex items-center gap-2`}
      >
        {isPlaying ? (
          <>
            <Pause size={16} />
            Pause
          </>
        ) : (
          <>
            <Play size={16} />
            Start
          </>
        )}
      </button>
    </div>
  );
};

export default Clock;
