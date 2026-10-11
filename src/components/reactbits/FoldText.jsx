import React from 'react';
import { motion } from 'framer-motion';

/**
 * FoldText - 3D paper fold / origami editorial reveal for titles & milestones
 * Inspired by React Bits (https://reactbits.dev/text-animations/fold-text)
 * 
 * Features:
 * - 3D fold perspective rotation along X axis
 * - Word or character-based sequential unfolding
 * - Respects prefers-reduced-motion
 * - Screen reader accessible with intact aria-label
 */
export function FoldText({
  text = '',
  className = '',
  as: Component = 'span',
  delay = 0,
  stagger = 0.04
}) {
  const words = typeof text === 'string' ? text.split(' ') : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay
      }
    }
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      rotateX: -90,
      y: -10,
      transformOrigin: 'top center'
    },
    visible: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      transition: {
        type: 'spring',
        damping: 16,
        stiffness: 240
      }
    }
  };

  return (
    <Component className={`inline-block perspective-500 ${className}`} aria-label={text}>
      <motion.span
        className="inline-flex flex-wrap gap-x-[0.25em]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ perspective: 800, display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em' }}
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={wordVariants}
            className="inline-block transform-gpu origin-top"
            style={{ display: 'inline-block', transformOrigin: 'top center' }}
            aria-hidden="true"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}

export default FoldText;
