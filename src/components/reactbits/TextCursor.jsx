import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * TextCursor - Interactive typewriter reveal with expressive blinking cursor
 * Inspired by React Bits (https://reactbits.dev/text-animations/text-cursor)
 * 
 * Features:
 * - Dynamic letter-by-letter reveal speed
 * - Coral/brand pulsing cursor element
 * - Full accessibility with static fallback for screen readers
 * - Clean timer teardown on unmount or text change
 */
export function TextCursor({
  text = '',
  speed = 28, // ms per character
  delay = 100,
  cursorChar = '▍',
  cursorColor = 'text-primary',
  onComplete,
  className = '',
  as: Component = 'span'
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeoutId;
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const startTyping = () => {
      const intervalId = setInterval(() => {
        index += 1;
        setDisplayedText(text.slice(0, index));

        if (index >= text.length) {
          clearInterval(intervalId);
          setIsTyping(false);
          onComplete?.();
        }
      }, speed);

      return intervalId;
    };

    timeoutId = setTimeout(() => {
      const interval = startTyping();
      timeoutId = interval;
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(timeoutId);
    };
  }, [text, speed, delay]);

  return (
    <Component className={`relative inline-block ${className}`} aria-label={text}>
      {/* Screen reader full text */}
      <span className="sr-only">{text}</span>

      {/* Visually animated text */}
      <span aria-hidden="true">
        {displayedText}
        <motion.span
          className={`inline-block ml-0.5 font-bold ${cursorColor}`}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
        >
          {cursorChar}
        </motion.span>
      </span>
    </Component>
  );
}

export default TextCursor;
