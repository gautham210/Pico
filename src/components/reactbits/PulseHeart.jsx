import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PulseHeart - Tactile animated heart for public likes
 * Inspired by React Bits (https://reactbits.dev/micro/pulse-heart)
 * 
 * Features:
 * - Particle burst and expanding ripple on like
 * - Spring scale bounce
 * - Debounced rapid tap protection
 * - Displays public like count with accessibility labels
 */
export function PulseHeart({
  isLiked = false,
  likesCount = 0,
  onToggle,
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  showCount = true,
  className = '',
  label = 'public like'
}) {
  const [particles, setParticles] = useState([]);
  const lastTapRef = useRef(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  }[size] || 'w-5 h-5';

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;

    // Prevent duplicate triggers if tapped rapidly within 350ms
    const now = Date.now();
    if (now - lastTapRef.current < 350) return;
    lastTapRef.current = now;

    const willLike = !isLiked;
    if (willLike) {
      // Spawn floating sparkles/particles
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: `${now}-${i}`,
        angle: (i * 60 * Math.PI) / 180,
        distance: 18 + Math.random() * 8
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 700);
    }

    onToggle?.(willLike);
  };

  return (
    <div className={`relative inline-flex items-center gap-1.5 select-none ${className}`}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        aria-label={`${isLiked ? 'Unlike' : 'Like'} this place (${likesCount} ${label}s)`}
        aria-pressed={isLiked}
        whileTap={{ scale: 0.82 }}
        className={`relative p-2 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isLiked ? 'text-rose-500' : 'text-on-surface-variant hover:text-rose-400'
        }`}
      >
        {/* Heart Icon */}
        <motion.svg
          viewBox="0 0 24 24"
          className={`${sizeClasses} ${
            isLiked
              ? 'fill-rose-500 stroke-rose-500 drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]'
              : 'fill-transparent stroke-currentColor stroke-[1.8]'
          }`}
          animate={{
            scale: isLiked ? [1, 1.35, 0.95, 1] : 1
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 15
          }}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </motion.svg>

        {/* Pulse Ripple Ring */}
        <AnimatePresence>
          {isLiked && particles.length > 0 && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-rose-400 pointer-events-none"
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Floating Sparks */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute w-1.5 h-1.5 rounded-full bg-rose-400 pointer-events-none"
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                scale: [0, 1.2, 0],
                opacity: [1, 0.8, 0]
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </motion.button>

      {showCount && (
        <span className="font-label-md font-bold text-xs text-on-surface-variant tabular-nums">
          {likesCount}
        </span>
      )}
    </div>
  );
}

export default PulseHeart;
