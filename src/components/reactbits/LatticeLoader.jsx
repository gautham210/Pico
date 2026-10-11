import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_STAGES = [
  'Getting to know your travel vibe…',
  'Finding places that fit your budget…',
  'Checking routes and travel times…',
  'Putting your adventure together…'
];

/**
 * LatticeLoader - AI Thinking & Planning state component
 * Inspired by React Bits (https://reactbits.dev/micro/lattice-loader)
 * 
 * Features:
 * - Animated interconnected SVG lattice mesh
 * - Contextual step messages matching real planning phases
 * - Error/failure state with retry callback
 */
export function LatticeLoader({
  stageText,
  stageIndex = 0,
  error = null,
  onRetry = null,
  title = 'Pico AI Itinerary Planner',
  stages = DEFAULT_STAGES,
  className = ''
}) {
  const [internalStage, setInternalStage] = useState(stageIndex);

  // Cycle through honest informational planning stages if stageText is not locked
  useEffect(() => {
    if (stageText || error) return;
    const interval = setInterval(() => {
      setInternalStage((prev) => (prev + 1) % stages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [stageText, error, stages.length]);

  const currentMessage = error
    ? error
    : stageText || stages[internalStage] || stages[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/30 text-center shadow-lg select-none ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 24px',
        borderRadius: '24px',
        background: 'linear-gradient(145deg, #ffffff 0%, #f4f8fe 100%)',
        border: '1.5px solid rgba(0, 106, 100, 0.2)',
        boxShadow: '0 12px 32px rgba(19, 28, 38, 0.08)',
        textAlign: 'center'
      }}
    >
      {/* Geometric Lattice Animation */}
      <div style={{ position: 'relative', width: '112px', height: '112px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!error ? (
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Connecting Lattice Lines */}
            <motion.line
              x1="20" y1="20" x2="80" y2="20"
              stroke="#006A64" strokeWidth="2" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
            <motion.line
              x1="20" y1="80" x2="80" y2="80"
              stroke="#006A64" strokeWidth="2" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, 16] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
            <motion.line
              x1="20" y1="20" x2="20" y2="80"
              stroke="#006A64" strokeWidth="2" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, 16] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
            <motion.line
              x1="80" y1="20" x2="80" y2="80"
              stroke="#006A64" strokeWidth="2" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
            {/* Diagonal Lattice Connections */}
            <motion.line
              x1="20" y1="20" x2="80" y2="80"
              stroke="#FF5B49" strokeWidth="2" strokeOpacity="0.7"
              animate={{ strokeOpacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />
            <motion.line
              x1="80" y1="20" x2="20" y2="80"
              stroke="#FF5B49" strokeWidth="2" strokeOpacity="0.7"
              animate={{ strokeOpacity: [0.8, 0.3, 0.8] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />

            {/* Pulsing Lattice Nodes */}
            {[
              { cx: 20, cy: 20, delay: 0 },
              { cx: 80, cy: 20, delay: 0.3 },
              { cx: 80, cy: 80, delay: 0.6 },
              { cx: 20, cy: 80, delay: 0.9 },
              { cx: 50, cy: 50, delay: 0.45, isCenter: true }
            ].map((node, i) => (
              <motion.g key={i}>
                <motion.circle
                  cx={node.cx}
                  cy={node.cy}
                  r={node.isCenter ? 8 : 6}
                  fill={node.isCenter ? "#FF5B49" : "#006A64"}
                  animate={{
                    scale: [1, 1.35, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    delay: node.delay,
                    ease: "easeInOut"
                  }}
                />
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={node.isCenter ? 3.5 : 2.5}
                  fill="#FFFFFF"
                />
              </motion.g>
            ))}
          </svg>
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        )}
      </div>

      {/* Header title */}
      <h4 className="font-headline-sm text-on-surface font-bold text-base md:text-lg mb-1">
        {error ? 'Planning Paused' : title}
      </h4>

      {/* Dynamic stage copy */}
      <div className="h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className={`font-body-md text-xs md:text-sm max-w-xs ${
              error ? 'text-red-600 font-medium' : 'text-on-surface-variant'
            }`}
          >
            {currentMessage}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Retry Action */}
      {error && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-xl bg-primary text-white font-label-md font-bold text-xs shadow-md hover:bg-primary/90 transition-transform active:scale-95"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default LatticeLoader;
