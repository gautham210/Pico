import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function PaperCrumple({
  children,
  isCrumpling = false,
  onCrumpleComplete,
  className = '',
  style = {}
}) {
  const reduced = useReducedMotion();

  const crumpleVariants = {
    normal: {
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      opacity: 1,
      filter: 'none',
      transition: { duration: 0.2 }
    },
    crumpled: reduced
      ? {
          x: -250,
          opacity: 0,
          transition: { duration: 0.3, ease: 'easeOut' }
        }
      : {
          scale: [1, 0.85, 0.5, 0.15],
          rotate: [0, -8, 24, -45],
          x: [0, -60, -180, -380],
          y: [0, 30, -20, 100],
          opacity: [1, 0.9, 0.7, 0],
          filter: [
            'contrast(100%) brightness(100%)',
            'contrast(130%) brightness(90%) drop-shadow(0 10px 15px rgba(0,0,0,0.3))',
            'contrast(160%) brightness(80%) drop-shadow(0 20px 25px rgba(0,0,0,0.5))',
            'contrast(200%) brightness(70%)'
          ],
          borderRadius: ['24px', '32px', '48px', '60px'],
          transition: {
            duration: 0.55,
            ease: [0.36, 0, 0.66, -0.56],
            times: [0, 0.3, 0.7, 1]
          }
        }
  };

  return (
    <motion.div
      className={`paper-crumple-wrapper ${isCrumpling ? 'is-crumpling' : ''} ${className}`}
      variants={crumpleVariants}
      initial="normal"
      animate={isCrumpling ? 'crumpled' : 'normal'}
      onAnimationComplete={() => {
        if (isCrumpling) {
          onCrumpleComplete?.();
        }
      }}
      style={{
        transformOrigin: 'center center',
        perspective: '800px',
        willChange: 'transform, opacity, filter',
        ...style
      }}
    >
      {/* Dynamic paper fold creasing overlay */}
      {isCrumpling && !reduced && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.2) 25%, rgba(0,0,0,0.3) 50%, rgba(255,255,255,0.15) 75%, rgba(0,0,0,0.4) 100%)',
            mixBlendMode: 'multiply'
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

export default PaperCrumple;

