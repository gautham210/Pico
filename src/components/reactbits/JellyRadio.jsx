import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * JellyRadio - Animated jelly/squash selection indicator for tabs & navigation
 * Inspired by React Bits (https://reactbits.dev/micro/jelly-radio)
 * 
 * Supports keyboard navigation, ARIA radiogroup/tab semantics, and smooth spring physics.
 */
export function JellyRadio({
  options = [],
  value,
  onChange,
  className = '',
  name = 'jelly-nav',
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'pill' // 'pill' | 'underline'
}) {
  const containerRef = useRef(null);
  const [bubbleStyle, setBubbleStyle] = useState({ left: 0, width: 0, top: 0, height: 0, ready: false });
  const [isPressing, setIsPressing] = useState(false);

  // Measure active tab element to place jelly pill
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(`[data-jelly-id="${value}"]`);
    if (activeEl) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const rect = activeEl.getBoundingClientRect();
      setBubbleStyle({
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        ready: true
      });
    }
  }, [value, options]);

  // Keyboard navigation
  const handleKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = options.length - 1;
    }

    if (nextIndex !== null) {
      const nextOpt = options[nextIndex];
      onChange?.(nextOpt.id);
      const nextEl = containerRef.current?.querySelector(`[data-jelly-id="${nextOpt.id}"]`);
      nextEl?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Navigation selection"
      className={`relative inline-flex items-center select-none bg-surface-container-high/60 backdrop-blur-md p-1 rounded-full border border-outline-variant/30 ${className}`}
      onMouseDown={() => setIsPressing(true)}
      onMouseUp={() => setIsPressing(false)}
      onMouseLeave={() => setIsPressing(false)}
    >
      {/* Animated Jelly Indicator */}
      {bubbleStyle.ready && (
        <motion.div
          layoutId={`jelly-bubble-${name}`}
          className={`absolute rounded-full pointer-events-none shadow-sm ${
            variant === 'pill'
              ? 'bg-primary text-white shadow-primary/20'
              : 'border-b-2 border-primary bg-primary/10'
          }`}
          initial={false}
          animate={{
            left: bubbleStyle.left,
            top: bubbleStyle.top,
            width: bubbleStyle.width,
            height: bubbleStyle.height,
            scaleX: isPressing ? 1.08 : 1,
            scaleY: isPressing ? 0.92 : 1
          }}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 32,
            mass: 0.8
          }}
        />
      )}

      {/* Options */}
      {options.map((opt, idx) => {
        const isSelected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            data-jelly-id={opt.id}
            onClick={() => onChange?.(opt.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative z-10 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full font-label-md font-semibold transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              size === 'sm' ? 'text-xs py-1 px-2.5' : size === 'lg' ? 'text-sm py-2 px-5' : 'text-xs md:text-sm'
            } ${
              isSelected
                ? 'text-white'
                : 'text-on-surface-variant hover:text-on-surface active:text-on-surface'
            }`}
          >
            {opt.icon && (
              <span className="flex-shrink-0 text-base" aria-hidden="true">
                {opt.icon}
              </span>
            )}
            <span>{opt.label}</span>
            {opt.badge !== undefined && opt.badge > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-primary-container text-white'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default JellyRadio;
