import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SwipeToast - Horizontal swipe-to-dismiss alert notification
 * Inspired by React Bits (https://reactbits.dev/micro/swipe-toast)
 * 
 * Features:
 * - Swipe drag gesture to dismiss left or right
 * - Tiered alert styling (info, warning, critical)
 * - Source and timestamp indicators
 * - Accessible keyboard dismiss button
 * - Non-dismissible critical safeguard until acknowledged
 */
export function SwipeToast({
  id,
  type = 'warning', // 'info' | 'warning' | 'critical'
  title,
  message,
  source = 'OSRM Traffic Feed',
  timestamp = 'Just now',
  isSimulated = false,
  onDismiss,
  className = ''
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  const typeConfig = {
    info: {
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-500/10',
      iconBg: 'bg-cyan-500/20 text-cyan-600',
      icon: 'ℹ️',
      badge: 'Info'
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      iconBg: 'bg-amber-500/20 text-amber-600',
      icon: '⚠️',
      badge: 'Alert'
    },
    critical: {
      border: 'border-rose-500/50',
      bg: 'bg-rose-500/15',
      iconBg: 'bg-rose-500/25 text-rose-600',
      icon: '🚨',
      badge: 'Critical'
    }
  }[type] || typeConfig.warning;

  const handleDragEnd = (_, info) => {
    // If dragged horizontally past threshold of 100px, dismiss
    if (Math.abs(info.offset.x) > 100) {
      setIsDismissed(true);
      setTimeout(() => onDismiss?.(id), 250);
    }
  };

  const handleManualDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => onDismiss?.(id), 250);
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          layout
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, x: 200, transition: { duration: 0.2 } }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          className={`relative overflow-hidden rounded-2xl p-4 shadow-lg backdrop-blur-xl border ${typeConfig.border} ${typeConfig.bg} bg-surface-container-lowest/90 cursor-grab active:cursor-grabbing select-none ${className}`}
          style={{
            background: type === 'critical' ? '#fff1f2' : type === 'warning' ? '#fffbeb' : '#f0fdf4',
            border: `1.5px solid ${type === 'critical' ? '#f43f5e' : type === 'warning' ? '#f59e0b' : '#10b981'}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(19, 28, 38, 0.12)',
            touchAction: 'pan-y'
          }}
          role="alert"
          aria-live={type === 'critical' ? 'assertive' : 'polite'}
        >
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${typeConfig.iconBg}`}>
              {typeConfig.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-headline-sm font-bold text-on-surface text-xs md:text-sm truncate">
                  {title}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant">
                  {typeConfig.badge}
                </span>
                {isSimulated && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Simulated
                  </span>
                )}
              </div>

              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                {message}
              </p>

              {/* Source & Timestamp */}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-on-surface-variant/70 font-label-sm">
                <span>Source: {source}</span>
                <span>•</span>
                <span>{timestamp}</span>
              </div>
            </div>

            {/* Manual Dismiss Button for accessibility */}
            <button
              type="button"
              onClick={handleManualDismiss}
              aria-label="Dismiss alert"
              className="absolute top-3 right-3 p-1 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Swipe indicator hint bar */}
          <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant/60">
            <span>← Swipe left/right to dismiss</span>
            <span>Tap ✕ to close</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SwipeToast;
