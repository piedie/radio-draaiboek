import React from 'react';

const Clock = ({ items, currentTime, isPlaying, setIsPlaying, theme, t, formatTime, formatTimeShort, totalDuration }) => {
  const radius = 140, center = 160, hourDuration = 3600;
  let acc = 0;
  const segments = items.map((item) => {
    const start = acc, end = acc + item.duration;
    if (start >= hourDuration) return null;
    const dur = Math.min(item.duration, hourDuration - start);
    const angle = (dur / hourDuration) * 360, startA = (start / hourDuration) * 360 - 90;
    const startRad = startA * Math.PI / 180, endRad = (startA + angle) * Math.PI / 180;
    const x1 = center + radius * Math.cos(startRad), y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad), y2 = center + radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    const path = 'M ' + center + ' ' + center + ' L ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
    acc += item.duration;
    return <path key={item.id} d={path} fill={end > hourDuration ? '#dc2626' : item.color} stroke={theme === 'light' ? '#e5e7eb' : '#374151'} strokeWidth={1} opacity={0.8} />;
  }).filter(Boolean);
  const currAngle = (currentTime / hourDuration) * 360 - 90, currRad = currAngle * Math.PI / 180;
  const handX = center + (radius - 10) * Math.cos(currRad), handY = center + (radius - 10) * Math.sin(currRad);
  return (
    <div className="flex flex-col items-center">
      <svg width="320" height="320" className="mb-4">
        {segments}
        {[0, 15, 30, 45].map(min => {
          const a = (min / 60) * 360 - 90, rad = a * Math.PI / 180;
          return (
            <g key={min}>
              <line x1={center + (radius - 15) * Math.cos(rad)} y1={center + (radius - 15) * Math.sin(rad)} x2={center + radius * Math.cos(rad)} y2={center + radius * Math.sin(rad)} stroke={theme === 'light' ? '#9ca3af' : '#6b7280'} strokeWidth={2} />
              <text x={center + (radius + 25) * Math.cos(rad)} y={center + (radius + 25) * Math.sin(rad)} textAnchor="middle" dominantBaseline="middle" className={'text-base font-bold ' + t.text} style={{ userSelect: 'none' }}>{min}</text>
            </g>
          );
        })}
        <line x1={center} y1={center} x2={handX} y2={handY} stroke={theme === 'light' ? '#1f2937' : '#fff'} strokeWidth={3} />
        <circle cx={center} cy={center} r={6} fill={theme === 'light' ? '#1f2937' : '#fff'} />
      </svg>
      <div className={'text-2xl font-mono font-bold mb-2 ' + t.text}>{formatTime(currentTime)} / {formatTime(3600)}</div>
      <div className={'text-sm mb-4 ' + t.textSecondary}>Totaal: {formatTime(totalDuration)}{totalDuration > 3600 && <span className="text-red-500 ml-2">(+{formatTime(totalDuration - 3600)} over)</span>}</div>
      <button onClick={() => setIsPlaying(!isPlaying)} className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}>{isPlaying ? <>Pause</> : <>Start</>}</button>
    </div>
  );
};

export default Clock;
