import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { tokens } from '../lib/tokens';
import { spring, duration } from '../lib/motion';

export default function Sheet({ open, onClose, children, title }) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
      if (event.key === 'Tab') {
        const focusable = [...panel.current.querySelectorAll(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        )].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first) {
          event.preventDefault();
          panel.current.focus();
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="pico-sheet-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          style={{ background: `color-mix(in srgb, ${tokens.color.ink} 40%, transparent)` }}
          onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
        >
          <motion.section ref={panel} className="pico-sheet" role="dialog" aria-modal="true"
            aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Details'}
            tabIndex={-1} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={reduced ? { duration: 0 } : { type: 'spring', ...spring }}
            style={{
              background: tokens.color.bg, color: tokens.color.ink,
              borderRadius: `${tokens.radius.card}px ${tokens.radius.card}px 0 0`,
              fontFamily: tokens.font.body,
            }}
          >
            <div aria-hidden="true" className="pico-sheet-handle" style={{
              background: tokens.color.muted, borderRadius: tokens.radius.pill,
            }} />
            {title && <h2 id={titleId} style={{ fontFamily: tokens.font.display }}>{title}</h2>}
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
