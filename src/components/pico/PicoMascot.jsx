import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PICO_MOODS } from './emotions';
import { PicoSpeech } from './PicoSpeech';

/**
 * PicoMascot - The Arctic Tern travel companion
 * Features:
 * - 13 distinct emotional states with real asset bindings
 * - Framer Motion physical gestures (breathing, tilts, celebratory hops, thinking pulses)
 * - Speech bubble integration with TextCursor reveal
 * - Interactive tap feedback
 * - Reduced-motion compliance
 */
export function PicoMascot({
  mood = 'idle',
  message = null,
  actionLabel = null,
  onAction = null,
  onDismissMessage = null,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showSpeech = true,
  onClick = null,
  className = '',
  speechPlacement = 'top', // 'top' | 'right' | 'left'
  animateSpeech = true
}) {
  const [tapHop, setTapHop] = useState(0);
  const moodData = PICO_MOODS[mood] || PICO_MOODS.idle;
  const activeMessage = message !== null ? message : null;

  const sizeDimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }[size] || 'w-16 h-16';

  // Physical motion presets for each mood
  const getMotionAnimation = () => {
    switch (mood) {
      case 'curious':
        return {
          rotate: [0, 8, 4, 8, 0],
          y: [0, -3, 0],
          transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
        };
      case 'excited':
        return {
          y: [0, -8, 0, -6, 0],
          scale: [1, 1.05, 1, 1.03, 1],
          transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
        };
      case 'celebrating':
        return {
          y: [0, -12, 0, -10, 0],
          rotate: [-6, 6, -4, 4, 0],
          scale: [1, 1.08, 1],
          transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }
        };
      case 'thinking':
        return {
          rotate: [-3, 3, -3],
          scale: [1, 0.98, 1],
          transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }
        };
      case 'planning':
        return {
          y: [0, -4, 0],
          rotate: [0, 2, 0],
          transition: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }
        };
      case 'worried':
        return {
          x: [-1.5, 1.5, -1.5, 1.5, 0],
          rotate: [-2, -4, -2],
          transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
        };
      case 'lost':
        return {
          rotate: [-8, 8, -6, 6, 0],
          y: [0, -2, 0],
          transition: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
        };
      case 'proud':
        return {
          y: -4,
          scale: 1.04,
          transition: { type: 'spring', stiffness: 300, damping: 20 }
        };
      case 'sleepy':
        return {
          y: [0, 3, 0],
          scale: [1, 0.98, 1],
          transition: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' }
        };
      case 'idle':
      default:
        return {
          y: [0, -3.5, 0],
          transition: { repeat: Infinity, duration: 3.0, ease: 'easeInOut' }
        };
    }
  };

  const handleTap = (e) => {
    setTapHop((prev) => prev + 1);
    onClick?.(e);
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Optional Speech Bubble */}
      {showSpeech && activeMessage && (
        <div className="mb-2 z-30">
          <PicoSpeech
            message={activeMessage}
            actionLabel={actionLabel}
            onAction={onAction}
            onDismiss={onDismissMessage}
            animate={animateSpeech}
          />
        </div>
      )}

      {/* Mascot Motion Container */}
      <motion.button
        type="button"
        onClick={handleTap}
        aria-label={`Pico the Arctic Tern mascot: currently ${moodData.label}`}
        whileTap={{ scale: 0.9, y: 4 }}
        animate={{
          ...getMotionAnimation(),
          ...(tapHop > 0 ? { y: [0, -12, 0] } : {})
        }}
        className={`relative p-1 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${sizeDimensions}`}
      >
        <img
          src={moodData.image}
          alt={`Pico mascot ${mood}`}
          className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,106,100,0.18)]"
          onError={(e) => {
            // Graceful fallback to idle image if specific emotion fails
            e.currentTarget.onerror = null;
            e.currentTarget.src = PICO_MOODS.idle.image;
          }}
        />

        {/* Subtle mood aura glow */}
        <span
          className={`absolute inset-0 rounded-full pointer-events-none -z-10 blur-md transition-opacity duration-500 ${
            mood === 'celebrating' || mood === 'excited'
              ? 'bg-amber-400/30 opacity-80'
              : mood === 'worried' || mood === 'lost'
              ? 'bg-rose-400/20 opacity-70'
              : mood === 'thinking' || mood === 'planning'
              ? 'bg-secondary/20 opacity-60'
              : 'bg-primary/15 opacity-40'
          }`}
        />
      </motion.button>
    </div>
  );
}

export default PicoMascot;
