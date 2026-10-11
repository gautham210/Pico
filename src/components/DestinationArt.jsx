export default function DestinationArt({kind='coast'}){
  const k = String(kind || '').toLowerCase();
  const isTemple = /temple|chapel|church|cathedral/.test(k);
  const isMarket = /market|bazaar|nightlife|shop/.test(k);
  const isCafe = /cafe|food|restaurant|bistro|dining/.test(k);
  const isPalace = /palace|cultur|fort|monument|historic/.test(k);
  const isHills = /hill|tea|mountain|nature|viewpoint|waterfall/.test(k);
  const isGarden = /garden|park/.test(k);

  const styleClass = isTemple ? 'art-temple' : isMarket ? 'art-market' : isCafe ? 'art-cafe' : isPalace ? 'art-palace' : isHills ? 'art-hills' : isGarden ? 'art-garden' : 'art-coast';

  return (
    <svg viewBox="0 0 400 250" className={'destination-art ' + styleClass} aria-hidden="true">
      <rect width="400" height="250" fill="var(--art-sky)"/>
      <circle cx="310" cy="56" r="28" fill="var(--art-sun)"/>

      {isTemple ? (
        <>
          <path d="M120 220 L140 140 L160 90 L200 40 L240 90 L260 140 L280 220 Z" fill="var(--art-back)"/>
          <path d="M196 28 L204 28 L200 16 Z" fill="var(--art-sun)"/>
          <path d="M150 220 L165 150 L180 100 L200 60 L220 100 L235 150 L250 220 Z" fill="var(--art-front)"/>
          <rect x="185" y="170" width="30" height="50" rx="15" fill="var(--art-sky)"/>
          <line x1="160" y1="120" x2="240" y2="120" stroke="var(--art-sky)" strokeWidth="3"/>
          <line x1="148" y1="160" x2="252" y2="160" stroke="var(--art-sky)" strokeWidth="3"/>
          <rect x="0" y="220" width="400" height="30" fill="var(--art-front)"/>
        </>
      ) : isMarket ? (
        <>
          <path d="M30 220 L30 140 L190 140 L190 220 Z" fill="var(--art-back)"/>
          <path d="M210 220 L210 130 L370 130 L370 220 Z" fill="var(--art-back)"/>
          <path d="M20 140 L40 105 L200 105 L180 140 Z" fill="var(--art-front)"/>
          <path d="M200 130 L220 95 L380 95 L360 130 Z" fill="var(--art-sun)"/>
          <path d="M20 70 Q 200 110 380 65" fill="none" stroke="var(--art-front)" strokeWidth="2.5"/>
          <polygon points="80,82 100,105 105,84" fill="var(--art-sun)"/>
          <polygon points="170,90 190,114 195,92" fill="var(--art-front)"/>
          <polygon points="260,86 280,108 285,87" fill="var(--art-sun)"/>
          <rect x="0" y="220" width="400" height="30" fill="var(--art-front)"/>
        </>
      ) : isCafe ? (
        <>
          <path d="M60 220 L60 110 L340 110 L340 220 Z" fill="var(--art-back)"/>
          <path d="M40 110 L70 70 L330 70 L360 110 Z" fill="var(--art-front)"/>
          <path d="M180 150 L180 185 Q 180 200 200 200 Q 220 200 220 185 L 220 150 Z" fill="var(--art-sky)"/>
          <path d="M220 160 Q 235 160 235 175 Q 235 190 220 190" fill="none" stroke="var(--art-sky)" strokeWidth="4"/>
          <path d="M192 138 Q 196 130 192 122" fill="none" stroke="var(--art-sun)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M205 138 Q 209 130 205 122" fill="none" stroke="var(--art-sun)" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="0" y="220" width="400" height="30" fill="var(--art-front)"/>
        </>
      ) : isPalace ? (
        <>
          <path d="M65 215V130H335V215M100 130V88H135V130M265 130V88H300V130M180 130V72Q200 28 220 72V130" fill="var(--art-back)"/>
          <path d="M179 215V163Q200 128 221 163V215M93 168H119V194H93ZM280 168H306V194H280Z" fill="var(--art-front)"/>
          <path d="M45 217H356" stroke="var(--art-front)" strokeWidth="7"/>
          <rect x="0" y="220" width="400" height="30" fill="var(--art-front)"/>
        </>
      ) : isHills ? (
        <>
          <path d="M0 165 100 62 195 167 278 85 400 170V250H0Z" fill="var(--art-back)"/>
          <path d="M0 217Q130 130 245 199T400 183V250H0Z" fill="var(--art-front)"/>
          <path d="M0 238Q130 155 245 224M100 250Q235 180 400 219" fill="none" stroke="var(--art-sky)" strokeWidth="3"/>
        </>
      ) : isGarden ? (
        <>
          <path d="M85 217V125L200 53 315 125V217Z" fill="var(--art-back)"/>
          <path d="M85 125H315M140 89V217M200 53V217M259 89V217M85 170H315" stroke="var(--art-sky)" strokeWidth="5"/>
          <path d="M0 240Q200 171 400 240" fill="var(--art-front)"/>
        </>
      ) : (
        <>
          <path d="M0 140Q100 110 200 140T400 138V250H0Z" fill="var(--art-back)"/>
          <path d="M0 199Q130 140 400 225V250H0Z" fill="var(--art-sun)"/>
          <path d="M65 205Q83 122 68 70M68 80Q21 50 14 85M68 80Q110 36 127 73M68 80Q104 75 124 106" fill="none" stroke="var(--art-front)" strokeWidth="8" strokeLinecap="round"/>
          <path d="M151 169Q214 154 280 177" stroke="var(--art-sky)" fill="none" strokeWidth="3"/>
        </>
      )}
    </svg>
  );
}
