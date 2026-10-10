import { tokens } from '../lib/tokens';

// For delta badges, status="loss" is danger; status="savings" is the default.
export default function Badge({ variant = 'cost', children, status = 'savings' }) {
  const accent = variant === 'rarity' ? tokens.color.saffron
    : variant === 'delta' && status === 'loss' ? tokens.color.danger : tokens.color.teal;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
      background: variant === 'cost' ? tokens.color.bg
        : `color-mix(in srgb, ${accent} 15%, transparent)`,
      color: variant === 'cost' ? tokens.color.ink : accent,
      borderRadius: tokens.radius.pill, fontFamily: tokens.font.mono,
      fontSize: 11, lineHeight: '14px', fontWeight: 600,
      textTransform: 'uppercase', fontVariantCaps: 'all-small-caps', letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  );
}
