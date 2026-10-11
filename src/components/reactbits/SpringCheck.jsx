import React from 'react';
import { motion } from 'framer-motion';

/**
 * SpringCheck - Tactile spring-animated checkbox
 * Inspired by React Bits (https://reactbits.dev/micro/spring-check)
 * 
 * Features:
 * - Spring SVG checkmark path drawing
 * - Bouncy squash-and-stretch box scale
 * - Full keyboard & ARIA accessibility
 */
export function SpringCheck({
  checked = false,
  onChange,
  disabled = false,
  id,
  label,
  sublabel,
  className = '',
  size = 'md' // 'sm' | 'md' | 'lg'
}) {
  const boxSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size] || 'w-5 h-5';

  const checkSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size] || 'w-3.5 h-3.5';

  const handleToggle = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange?.(!checked);
    }
  };

  return (
    <div
      role="checkbox"
      id={id}
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-3 select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Box container */}
      <motion.div
        className={`relative flex items-center justify-center rounded-md border-2 transition-colors ${boxSizes} ${
          checked
            ? 'bg-secondary border-secondary shadow-sm shadow-secondary/30'
            : 'bg-surface border-outline-variant hover:border-secondary'
        }`}
        style={{
          width: size === 'sm' ? '18px' : size === 'lg' ? '26px' : '22px',
          height: size === 'sm' ? '18px' : size === 'lg' ? '26px' : '22px',
          minWidth: size === 'sm' ? '18px' : size === 'lg' ? '26px' : '22px',
          minHeight: size === 'sm' ? '18px' : size === 'lg' ? '26px' : '22px',
          borderRadius: '6px',
          border: `2px solid ${checked ? 'var(--teal)' : 'var(--line)'}`,
          backgroundColor: checked ? 'var(--teal)' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: checked ? '0 2px 6px rgba(0, 106, 100, 0.25)' : 'none'
        }}
        animate={{
          scale: checked ? [1, 1.2, 0.95, 1] : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 20
        }}
      >
        {/* Animated SVG Check Path */}
        <svg
          viewBox="0 0 12 10"
          style={{ width: '14px', height: '14px', stroke: '#ffffff', fill: 'none' }}
          className={`${checkSizes} text-white fill-none stroke-current`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M1.5 5.2L4.5 8.2L10.5 1.8"
            initial={false}
            animate={{
              pathLength: checked ? 1 : 0,
              opacity: checked ? 1 : 0
            }}
            transition={{
              pathLength: { type: 'spring', stiffness: 500, damping: 25 },
              opacity: { duration: 0.1 }
            }}
          />
        </svg>
      </motion.div>

      {/* Label & Sublabel */}
      {(label || sublabel) && (
        <div className="flex flex-col text-left">
          {label && (
            <span
              className={`font-body-md text-xs md:text-sm font-semibold transition-all ${
                checked
                  ? 'line-through text-on-surface-variant/60'
                  : 'text-on-surface'
              }`}
            >
              {label}
            </span>
          )}
          {sublabel && (
            <span className="font-label-sm text-[11px] text-on-surface-variant/70">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default SpringCheck;
