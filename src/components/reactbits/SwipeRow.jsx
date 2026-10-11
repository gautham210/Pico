import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * SwipeRow - Compact list row with swipe-to-reveal action affordances
 * Inspired by React Bits (https://reactbits.dev/micro/swipe-row)
 * 
 * Features:
 * - Drag left to reveal action buttons (Delete, Edit, Save)
 * - Rubber-band resistance
 * - Keyboard & accessibility friendly toggle
 * - Prevents conflict with parent drag contexts
 */
export function SwipeRow({
  children,
  actions = [], // Array of { id, label, icon, onClick, variant: 'danger' | 'primary' | 'secondary' }
  className = '',
  actionWidth = 80
}) {
  const [isOpen, setIsOpen] = useState(false);
  const totalActionWidth = actions.length * actionWidth;

  const handleDragEnd = (_, info) => {
    // If dragged past half of total action width, snap open; else snap shut
    if (info.offset.x < -(totalActionWidth / 2)) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/30 select-none ${className}`}>
      {/* Background action buttons */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end z-0">
        {actions.map((act) => {
          const variantClasses = {
            danger: 'bg-red-500 hover:bg-red-600 text-white',
            primary: 'bg-primary hover:bg-primary/90 text-white',
            secondary: 'bg-secondary hover:bg-secondary/90 text-white'
          }[act.variant || 'secondary'];

          return (
            <button
              key={act.id}
              type="button"
              style={{ width: `${actionWidth}px` }}
              onClick={(e) => {
                e.stopPropagation();
                act.onClick?.();
                setIsOpen(false);
              }}
              className={`h-full flex flex-col items-center justify-center gap-1 font-label-md font-bold text-xs transition-colors focus:outline-none ${variantClasses}`}
              aria-label={act.label}
            >
              {act.icon && <span className="text-base" aria-hidden="true">{act.icon}</span>}
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Foreground Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -totalActionWidth, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ x: isOpen ? -totalActionWidth : 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="relative z-10 bg-surface-container-lowest p-3.5 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex-1 min-w-0 pr-2">
          {children}
        </div>

        {/* Keyboard / non-gesture toggle button */}
        {actions.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            aria-label={isOpen ? "Hide actions" : "Show actions"}
            className="p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary flex-shrink-0"
          >
            <span className="text-xs">⋯</span>
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default SwipeRow;
