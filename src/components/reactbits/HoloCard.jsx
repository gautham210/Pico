import { useState, useRef, useEffect } from 'react';

export function HoloCard({
  children,
  className = '',
  rarity = 'rare', // 'common' | 'rare' | 'legendary'
  maxTilt = 14,
  style = {},
  onClick
}) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, isHovered: false });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handlePointerMove = (e) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1
    setCoords({ x, y, isHovered: true });
  };

  const handlePointerLeave = () => {
    setCoords((prev) => ({ ...prev, isHovered: false }));
  };

  const tiltX = coords.isHovered && !reducedMotion ? (coords.y - 0.5) * -maxTilt * 2 : 0;
  const tiltY = coords.isHovered && !reducedMotion ? (coords.x - 0.5) * maxTilt * 2 : 0;
  const glareX = coords.isHovered ? coords.x * 100 : 50;
  const glareY = coords.isHovered ? coords.y * 100 : 50;

  const rarityGradients = {
    common: 'linear-gradient(135deg, rgba(122,246,236,0.3) 0%, rgba(224,233,247,0.4) 100%)',
    rare: 'linear-gradient(135deg, rgba(255,91,73,0.4) 0%, rgba(255,222,173,0.5) 50%, rgba(0,106,100,0.4) 100%)',
    legendary: 'linear-gradient(135deg, rgba(255,91,73,0.6) 0%, rgba(122,246,236,0.6) 25%, rgba(255,222,173,0.6) 50%, rgba(195,136,6,0.6) 75%, rgba(255,91,73,0.6) 100%)'
  };

  return (
    <div
      ref={cardRef}
      className={`holo-card holo-card--${rarity} ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transition: coords.isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: coords.isHovered
          ? '0 16px 32px -4px rgba(27, 27, 47, 0.18), 0 0 20px 2px rgba(255, 91, 73, 0.2)'
          : '0 4px 16px -2px rgba(19, 28, 38, 0.06)',
        ...style
      }}
    >
      {/* Holographic prismatic sheen overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          opacity: coords.isHovered ? 0.75 : 0.2,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 55%), ${rarityGradients[rarity] || rarityGradients.rare}`,
          mixBlendMode: 'color-dodge'
        }}
      />

      {/* Prismatic rainbow foil lines */}
      {rarity !== 'common' && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 3,
            opacity: coords.isHovered ? 0.45 : 0,
            transition: 'opacity 0.3s ease',
            background: `linear-gradient(${115 + (coords.x - 0.5) * 60}deg, rgba(255,0,128,0.2) 0%, rgba(0,255,255,0.2) 30%, rgba(255,255,0,0.2) 60%, rgba(0,255,128,0.2) 100%)`,
            mixBlendMode: 'overlay'
          }}
        />
      )}

      {/* Card Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

export default HoloCard;

