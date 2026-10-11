import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextCursor } from '../reactbits/TextCursor';

/**
 * PicoSpeech - Speech bubble for Pico companion messages
 * Features:
 * - Animated typewriter TextCursor reveal
 * - Contextual action button (optional)
 * - Dismiss affordance
 * - Accessible static text fallback for screen readers
 */
export function PicoSpeech({
  message,
  actionLabel,
  onAction,
  onDismiss,
  dismissible = true,
  animate = true,
  className = ''
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 4 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className={`relative z-20 max-w-xs md:max-w-sm rounded-2xl p-3 md:p-3.5 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/30 shadow-lg text-left select-none ${className}`}
        role="status"
        aria-live="polite"
      >
        {/* Tail pointing down-left toward Pico */}
        <div className="absolute -bottom-2 left-6 w-3.5 h-3.5 bg-surface-container-lowest border-r border-b border-outline-variant/30 transform rotate-45" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className="block font-label-sm text-[10px] uppercase font-bold text-primary tracking-wider mb-0.5">
              Pico says
            </span>
            <div className="font-body-md text-xs md:text-sm text-on-surface leading-snug">
              {animate ? (
                <TextCursor text={message} speed={22} cursorChar="▋" />
              ) : (
                <span>{message}</span>
              )}
            </div>

            {/* Contextual Action Button */}
            {actionLabel && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold hover:bg-secondary hover:text-white transition-colors"
              >
                <span>{actionLabel}</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                onDismiss?.();
              }}
              aria-label="Dismiss message"
              className="p-1 rounded-md text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PicoSpeech;
