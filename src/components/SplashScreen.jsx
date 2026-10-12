import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import birdOnly from '../../Bird Only.png';

export default function SplashScreen({ onFinish, minDuration = 1400 }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, minDuration);

    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, minDuration + 400);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  const handleSkip = () => {
    setExiting(true);
    setTimeout(() => {
      onFinish?.();
    }, 250);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          onClick={handleSkip}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #FAF7F2 0%, #F5EFEB 100%)',
            padding: '24px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          role="dialog"
          aria-label="Pico Launching"
        >
          {/* Subtle warm background radial glow */}
          <div
            style={{
              position: 'absolute',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 107, 74, 0.12) 0%, rgba(255, 183, 3, 0.05) 50%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(30px)'
            }}
          />

          {/* Prominent, vibrant Arctic Tern mascot */}
          <motion.div
            initial={{ scale: 0.7, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            style={{ position: 'relative', marginBottom: '24px' }}
          >
            <motion.img
              src={birdOnly}
              alt="Pico Arctic Tern"
              animate={{
                y: [0, -8, 0],
                rotate: [0, -1.5, 1.5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                width: '136px',
                height: '136px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 12px 24px rgba(255, 107, 74, 0.18))'
              }}
            />
          </motion.div>

          {/* Brand Wordmark and Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{ textAlign: 'center', zIndex: 1 }}
          >
            <span
              style={{
                display: 'inline-block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--coral)',
                background: 'color-mix(in srgb, var(--coral) 10%, transparent)',
                padding: '4px 12px',
                borderRadius: '999px',
                marginBottom: '10px'
              }}
            >
              Travel Companion
            </span>
            <h1
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                margin: '0 0 8px'
              }}
            >
              Pico
            </h1>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                color: 'var(--muted)',
                margin: 0,
                maxWidth: '260px',
                lineHeight: 1.45
              }}
            >
              Everywhere you’ve been. Everywhere you’re going.
            </p>
          </motion.div>

          {/* Micro Progress Bar */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '80px', opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            style={{
              height: '3px',
              background: 'linear-gradient(90deg, var(--coral) 0%, var(--gold) 100%)',
              borderRadius: '999px',
              marginTop: '36px'
            }}
          />

          <span
            style={{
              position: 'absolute',
              bottom: '24px',
              fontSize: '11px',
              color: 'var(--muted)',
              opacity: 0.6
            }}
          >
            Tap anywhere to begin
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
