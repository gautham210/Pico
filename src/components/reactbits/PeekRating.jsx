import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * PeekRating - Expressive interactive & display star rating component
 * Inspired by React Bits (https://reactbits.dev/micro/peek-rating)
 * 
 * Features:
 * - Hover peek bounce effect with spring physics
 * - Accessible keyboard controls (Left/Right arrows, 1-5 number keys)
 * - Clear distinction between user-submitted and external ratings
 * - Honest unavailable state when rating data is null/undefined
 */
export function PeekRating({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  showNumber = true,
  count = null,
  source = null,
  label = 'Rating',
  className = ''
}) {
  const [hoveredValue, setHoveredValue] = useState(null);
  const activeRating = hoveredValue !== null ? hoveredValue : (value || 0);

  // If completely unrated and read-only
  if (value === null || value === undefined) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-on-surface-variant/70 text-xs ${className}`}>
        <span className="opacity-60">★</span>
        <span className="font-label-sm italic">Unrated</span>
      </div>
    );
  }

  const starSizeClasses = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-xl'
  }[size] || 'w-5 h-5 text-base';

  const handleKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(max, (value || 0) + 1);
      onChange?.(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value || 0) - 1);
      onChange?.(prev);
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      const num = parseInt(e.key, 10);
      if (num <= max) onChange?.(num);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      role={readOnly ? 'img' : 'slider'}
      aria-label={`${label}: ${value} out of ${max} stars`}
      aria-valuemin={1}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHoveredValue(null)}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => {
          const starIndex = i + 1;
          const isFilled = activeRating >= starIndex;
          const isHovered = hoveredValue === starIndex;

          return (
            <motion.button
              key={starIndex}
              type="button"
              disabled={readOnly}
              aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
              className={`relative p-0.5 transition-colors focus:outline-none ${
                readOnly ? 'cursor-default' : 'cursor-pointer'
              }`}
              onClick={() => !readOnly && onChange?.(starIndex)}
              onMouseEnter={() => !readOnly && setHoveredValue(starIndex)}
              animate={{
                y: isHovered && !readOnly ? -4 : 0,
                scale: isHovered && !readOnly ? 1.25 : 1
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 18
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className={`${starSizeClasses} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.4)]'
                    : 'text-outline-variant/40 fill-transparent'
                }`}
                stroke="currentColor"
                strokeWidth={isFilled ? '1' : '1.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </motion.button>
          );
        })}
      </div>

      {showNumber && (
        <span className="font-label-md font-bold text-on-surface text-xs md:text-sm flex items-center gap-1">
          <span>{Number(value).toFixed(1)}</span>
          {count !== null && (
            <span className="font-normal text-on-surface-variant/70 text-[11px]">
              ({count})
            </span>
          )}
          {source && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-surface-container-high text-on-surface-variant/80">
              {source}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export default PeekRating;
