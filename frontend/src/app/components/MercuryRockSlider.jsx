'use client';

export default function MercuryRockSlider({
  label,
  subLabel,
  value,
  displayValue,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  minLabel,
  maxLabel,
  isDark
}) {
  const numValue = Number(value);
  const numMin = Number(min);
  const numMax = Number(max);
  const pct = Math.min(100, Math.max(0, ((numValue - numMin) / (numMax - numMin)) * 100));

  // The thumb is 28px wide. Its center travels from 14px (at 0%) to calc(100% - 14px) (at 100%).
  // Offset formula: 14px - (pct / 100) * 28px
  const offset = 14 - (pct / 100) * 28;
  const thumbPos = `calc(${pct}% + ${offset.toFixed(2)}px)`;
  const midPos = `calc(${(pct * 0.5).toFixed(2)}% + ${(offset * 0.5).toFixed(2)}px)`;

  // Dynamic rock canyon track: glowing molten amber/terracotta on the left, dark cratered basalt on the right
  const trackStyle = {
    backgroundImage: isDark
      ? `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 6px),
         linear-gradient(to right, 
           #92400e 0%, 
           #d97706 ${midPos}, 
           #f59e0b ${thumbPos}, 
           #22140d ${thumbPos}, 
           #150c07 100%)`
      : `repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 6px),
         linear-gradient(to right, 
           #9a3412 0%, 
           #ea580c ${midPos}, 
           #f59e0b ${thumbPos}, 
           #dfcebd ${thumbPos}, 
           #cdb9a6 100%)`,
    borderColor: isDark ? 'rgba(180, 83, 9, 0.45)' : 'rgba(194, 65, 12, 0.35)',
  };

  return (
    <div className="space-y-2">
      {/* Label and Value Header */}
      <div className="flex justify-between items-baseline gap-2">
        <label className={`text-sm sm:text-base font-bold uppercase tracking-wider ${
          isDark ? 'text-[#b8a394]' : 'text-[#6b5646]'
        }`}>
          {label}
          {subLabel && (
            <span className={`font-normal ml-1 sm:ml-2 block sm:inline ${
              isDark ? 'text-[#9c8677]' : 'text-[#8c7462]'
            }`}>
              {subLabel}
            </span>
          )}
        </label>
        <span
          className={`text-lg sm:text-xl font-mono font-bold tracking-tight select-none transition-colors ${
            isDark 
              ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]' 
              : 'text-amber-700 drop-shadow-[0_0_4px_rgba(180,83,9,0.2)]'
          }`}
        >
          {displayValue !== undefined ? displayValue : `${value}${unit}`}
        </span>
      </div>

      {/* Rock-Textured Range Input Slider */}
      <div className="relative py-2 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          style={trackStyle}
          className="mercury-rock-slider border"
          aria-label={label}
        />
      </div>

      {/* Min / Max Range Markers */}
      <div className="flex justify-between items-center text-xs font-mono select-none px-1">
        <span className={isDark ? 'text-[#7d6859]' : 'text-[#9e8b7c]'}>
          {minLabel !== undefined ? minLabel : `${min}${unit}`}
        </span>
        <span className={isDark ? 'text-[#7d6859]' : 'text-[#9e8b7c]'}>
          {maxLabel !== undefined ? maxLabel : `${max}${unit}`}
        </span>
      </div>
    </div>
  );
}

