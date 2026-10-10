import { motion, useReducedMotion } from 'framer-motion';
import { tokens } from '../lib/tokens';
import { spring } from '../lib/motion';

export default function Button({ variant = 'primary', children, onClick, disabled = false }) {
  const reduced = useReducedMotion();
  const styles = {
    primary: { background: tokens.color.coral, color: tokens.color.ink, border: '1px solid transparent' },
    secondary: {
      background: tokens.color.surface, color: tokens.color.ink,
      border: `1px solid color-mix(in srgb, ${tokens.color.ink} 6%, transparent)`,
      backdropFilter: 'blur(24px)',
    },
    ghost: { background: 'transparent', color: tokens.color.ink, border: '1px solid transparent' },
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled || reduced ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', ...spring }}
      style={{
        ...styles[variant], borderRadius: tokens.radius.pill, padding: '12px 24px',
        fontFamily: tokens.font.display, fontWeight: 600, fontSize: 16, lineHeight: '24px',
        opacity: disabled ? 0.6 : 1, cursor: disabled ? 'default' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {children}
    </motion.button>
  );
}
