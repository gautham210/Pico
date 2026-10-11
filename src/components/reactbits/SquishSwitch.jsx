import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * SquishSwitch - Tactile squash-and-stretch toggle switch
 * Inspired by React Bits (https://reactbits.dev/micro/squish-switch)
 * 
 * Features:
 * - Dynamic thumb deformation (squish & stretch) during drag/toggle
 * - Controlled switch state
 * - Full ARIA switch semantics & keyboard navigation
 * - Explanatory caption for flight route mode & budget impact
 */
export function SquishSwitch({
  checked = false,
  onChange,
  disabled = false,
  label = 'Flight Mode',
  description = 'Includes flight transit options in route plans',
  id = 'squish-flight-switch',
  className = ''
}) {
  const [isPressed, setIsPressed] = useState(false);

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
    <div className={`flex items-start justify-between gap-4 p-3 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 ${className}`}>
      <div className="flex flex-col select-none pr-2">
        <label
          htmlFor={id}
          className="font-headline-sm font-bold text-on-surface text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
          onClick={handleToggle}
        >
          <span className="text-base" aria-hidden="true">✈️</span>
          <span>{label}</span>
        </label>
        {description && (
          <p className="font-body-sm text-[11px] text-on-surface-variant/80 mt-0.5">
            {description}
          </p>
        )}
        <span className="text-[10px] text-on-surface-variant/60 italic mt-0.5">
          Affects itinerary transit estimates. Does not modify device radios.
        </span>
      </div>

      {/* Switch Control */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        style={{
          width: '56px',
          height: '32px',
          borderRadius: '9999px',
          padding: '4px',
          backgroundColor: checked ? 'var(--coral)' : '#e0e9f7',
          border: '1px solid rgba(200, 215, 235, 0.6)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'background-color 0.25s ease'
        }}
        className={`relative inline-flex items-center w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          checked ? 'bg-primary' : 'bg-surface-container-high'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <motion.div
          style={{
            height: '24px',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(19, 28, 38, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="h-6 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-none"
          initial={false}
          animate={{
            x: checked ? 24 : 0,
            width: isPressed ? 28 : 24,
            scaleY: isPressed ? 0.85 : 1
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 24,
            mass: 0.7
          }}
        >
          <span className="text-[10px]" aria-hidden="true">
            {checked ? '✈️' : ''}
          </span>
        </motion.div>
      </button>
    </div>
  );
}

export default SquishSwitch;
