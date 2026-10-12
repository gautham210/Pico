import { supportedCities } from '../../data/city-collections.js';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore, committed, activeTripPlaces } from '../lib/store';
import { loadCatalog } from '../lib/catalog';
import { money } from '../lib/provider';
import { Budget, Companion, Heading, Icon, PlaceImage, PhotoCredit } from '../components/JourneyUI';
import Button from '../components/Button';
import Sheet from '../components/Sheet';
import { matchesInterests } from '../lib/discovery.js';
import { PaperCrumple, FoldText, PulseHeart, PeekRating } from '../components/reactbits';
import { PicoMascot } from '../components/pico';

export default function Discover({ navigate }) {
  const s = useStore();
  const reduced = useReducedMotion();
  const [catalog, setCatalog] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [details, setDetails] = useState(false);
  const [filters, setFilters] = useState(false);
  const [message, setMessage] = useState('');
  const [intent, setIntent] = useState(0);
  const [isCrumpling, setIsCrumpling] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const isProcessingRef = useRef(false);

  const city = s.userPrefs.city || 'Kochi';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadCatalog(city)
      .then(result => {
        if (active) {
          setCatalog(result.places);
          setSource(result.source);
        }
      })
      .catch(e => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [city, retry]);

  const unseen = catalog.filter(p => !s.likedPlaces.some(x => x.id === p.id) && !s.passedPlaces.some(x => x.id === p.id));
  const vibes = s.userPrefs.vibes || [];
  const matches = unseen.filter(place => matchesInterests(place, vibes));
  const noInterestMatches = vibes.length > 0 && unseen.length > 0 && matches.length === 0;
  const ordered = noInterestMatches ? unseen : matches;

  useEffect(() => {
    if (noInterestMatches) {
      setMessage('No exact category matches in this collection; showing all remaining places.');
    }
  }, [noInterestMatches, vibes.join(',')]);

  const place = ordered[0];
  const next = ordered[1];

  const decide = (like) => {
    if (!place || isProcessingRef.current) return;
    if (like) {
      isProcessingRef.current = true;
      if (!s.likePlace(place)) {
        setMessage('Activities plus known transport estimates exceed your budget envelope. Increase budget or pass.');
        isProcessingRef.current = false;
        return;
      }
      setLastAction({ place, liked: true });
      setMessage(`Saved ${place.name} to your trip plan!`);
      setTimeout(() => { isProcessingRef.current = false; }, 280);
    } else {
      if (reduced) {
        s.passPlace(place);
        setLastAction({ place, liked: false });
        setMessage(`Passed ${place.name}.`);
      } else {
        isProcessingRef.current = true;
        setIsCrumpling(true);
      }
    }
  };

  const handleCrumpleFinish = () => {
    if (place) {
      s.passPlace(place);
      setLastAction({ place, liked: false });
      setMessage(`Passed ${place.name}.`);
    }
    setIsCrumpling(false);
    isProcessingRef.current = false;
  };

  const handleUndo = () => {
    if (!lastAction) return;
    s.undoSwipe(lastAction.place.id, lastAction.liked);
    setMessage(`Restored ${lastAction.place.name} to the deck.`);
    setLastAction(null);
  };

  // Keyboard navigation for desktop users
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowLeft' && place) decide(false);
      if (e.key === 'ArrowRight' && place) decide(true);
      if ((e.key === 'u' || e.key === 'U') && lastAction) handleUndo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [place, lastAction]);

  const closeDetails = useCallback(() => setDetails(false), []);
  const closeFilters = useCallback(() => setFilters(false), []);
  const activePlaces = activeTripPlaces(s);

  return (
    <main className="page discover-page">
      <Heading
        eyebrow={`${city} · Discover your next detour`}
        title="Follow your curiosity."
        action={
          <button className="quiet-button" onClick={() => setFilters(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Icon>tune</Icon>Destination & Filters
          </button>
        }
      >
        Swipe places that match your vibe. Compact cards, honest facts, zero guesswork.
      </Heading>

      <div className="discover-layout">
        <section className="deck-column">
          <div className="mobile-budget"><Budget /></div>

          {/* Swipe Teaching Indicator */}
          <div
            className="swipe-teaching-bar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 14px',
              borderRadius: '12px',
              background: 'color-mix(in srgb, var(--coral) 8%, var(--paper))',
              border: '1px solid color-mix(in srgb, var(--coral) 18%, var(--line))',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--coral)', fontWeight: 700 }}>👈 Pass</span> (Swipe Left)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--muted)', opacity: 0.75 }}>or use action buttons</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              (Swipe Right) <span style={{ color: 'var(--teal)', fontWeight: 700 }}>Save 👉</span>
            </span>
          </div>

          <div className="row spread" style={{ alignItems: 'center' }}>
            <small className="eyebrow" style={{ fontSize: '10px' }}>{loading ? 'Opening collection' : source}</small>
            <span className="count-pill">{catalog.length - unseen.length} / {catalog.length}</span>
          </div>

          {loading ? (
            <section className="panel loading" role="status">Pico is opening your collection…</section>
          ) : error ? (
            <section className="panel" role="alert">
              <h2>We couldn't open this collection.</h2>
              <p>{error}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button onClick={() => setRetry(retry + 1)}>Try again</Button>
                <Button variant="ghost" onClick={() => s.setPrefs({ city: 'Kochi' })}>Use Kochi collection</Button>
              </div>
            </section>
          ) : place ? (
            <>
              <div className="deck-stack">
                {next && <div className="deck-under" aria-hidden="true" />}
                <PaperCrumple isCrumpling={isCrumpling} onCrumpleComplete={handleCrumpleFinish}>
                  <motion.article
                    key={place.id}
                    id="deck-card-top"
                    className="swipe-card"
                    drag={isCrumpling ? false : "x"}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.65}
                    onDrag={(_, info) => setIntent(info.offset.x > 25 ? 1 : info.offset.x < -25 ? -1 : 0)}
                    onDragEnd={(_, info) => {
                      setIntent(0);
                      if (info.offset.x > 75) decide(true);
                      else if (info.offset.x < -75) decide(false);
                    }}
                    whileDrag={reduced ? undefined : { rotate: intent * 3 }}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ touchAction: 'pan-y' }}
                  >
                    <div className={"card-visual " + (place.image ? "has-photo" : "no-photo")}>
                      <PlaceImage place={place} />
                      <span className="location-pill">
                        <Icon>location_on</Icon>{place.city || city}
                      </span>
                      {intent !== 0 && (
                        <strong className={'decision-stamp ' + (intent > 0 ? 'keep' : 'pass')}>
                          {intent > 0 ? 'KEEP' : 'PASS'}
                        </strong>
                      )}
                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: 'rgba(255,255,255,0.88)', borderRadius: '9999px', backdropFilter: 'blur(8px)', padding: '2px' }}>
                        <PulseHeart
                          isLiked={Boolean(s.publicLikes?.[place.id]?.userLiked)}
                          likesCount={s.publicLikes?.[place.id]?.count ?? 0}
                          onToggle={() => s.togglePublicLike(place.id)}
                        />
                      </div>
                    </div>

                    <div className="card-copy">
                      <div className="card-header-flow">
                        <small className="card-eyebrow">{place.city || city} · {place.category}</small>
                        <h2 className="card-title">
                          <FoldText key={place.id} text={place.name} />
                        </h2>
                      </div>
                      <div className="chips">
                        <span className="chip mint">{place.category}</span>
                        <span className="chip">{place.time} min visit</span>
                        <span className="chip">{place.distance || 'Central area'}</span>
                      </div>
                      <p className="card-desc">{place.description}</p>
                      <div className="visit-price">
                        {Number.isFinite(place.cost) ? (place.cost === 0 ? "Free admission / Open access" : `₹${place.cost.toLocaleString('en-IN')} / person · planning estimate`) : "Price not verified · confirm locally"}
                      </div>
                      <PhotoCredit place={place} />
                      <div className="reality">
                        <Icon>lightbulb</Icon>
                        <div>
                          <strong>Pico Reality Check</strong>
                          <p>{place.caveat}</p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </PaperCrumple>
              </div>

              {/* Action Buttons with Undo */}
              <div className="swipe-actions">
                <button id="btn-pass" aria-label="Pass on location (Swipe left)" onClick={() => decide(false)} disabled={isCrumpling}>
                  <Icon>close</Icon>
                  <small>Pass</small>
                </button>

                {lastAction && (
                  <button
                    id="btn-undo"
                    aria-label="Undo last swipe"
                    onClick={handleUndo}
                    title="Undo last swipe (U)"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--card)',
                      border: '1.5px solid var(--line)',
                      color: 'var(--muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon>undo</Icon>
                    <small style={{ fontSize: '9px', fontWeight: 600 }}>Undo</small>
                  </button>
                )}

                <button id="btn-info" aria-label="Details" onClick={() => setDetails(true)}>
                  <Icon>info</Icon>
                  <small>Details</small>
                </button>

                <button id="btn-like" className="keep" aria-label="Keep place (Swipe right)" onClick={() => decide(true)} disabled={isCrumpling}>
                  <Icon>favorite</Icon>
                  <small>Keep</small>
                </button>
              </div>

              {/* Arctic Tern Companion Feedback */}
              <div className="pico-companion-card" style={{ marginTop: '8px' }}>
                <PicoMascot
                  mood={isCrumpling ? 'curious' : intent > 0 ? 'excited' : intent < 0 ? 'curious' : s.budgetEnvelope > 0 && s.budgetRemaining < s.budgetEnvelope * 0.15 ? 'worried' : 'curious'}
                  size="md"
                  message={
                    isCrumpling
                      ? `Passing ${place.name}! Moving on…`
                      : intent > 0
                      ? `Release right to save ${place.name} to itinerary!`
                      : intent < 0
                      ? `Release left to pass ${place.name}.`
                      : s.budgetEnvelope > 0 && s.budgetRemaining < s.budgetEnvelope * 0.15
                      ? 'Budget envelope is getting tight! We can prioritize must-see spots.'
                      : message || `Swipe right to save ${place.name}, or left to pass.`
                  }
                  animateSpeech={true}
                />
              </div>
            </>
          ) : (
            /* Exhausted Deck State */
            <section className="panel empty" style={{ padding: '28px 20px', textAlign: 'center', display: 'grid', gap: '14px' }}>
              <div style={{ fontSize: '36px' }}>🎉</div>
              <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 800 }}>Deck Complete for {city}!</h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                You've reviewed all available spots in {city}. You have {activePlaces.length} destination(s) ready in your itinerary.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => navigate('plan')}>
                  Review Multi-Day Plan →
                </Button>
                <Button variant="secondary" onClick={() => s.revisit()}>
                  Revisit Passed Places
                </Button>
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <small style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Explore Another Destination
                </small>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {supportedCities.filter(c => c !== city).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => s.setPrefs({ city: c })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      📍 {c}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <p className="feedback" role="status" style={{ fontSize: '12px', color: 'var(--teal)', minHeight: '18px', textAlign: 'center' }}>
            {message}
          </p>
        </section>

        {/* Desktop Aside */}
        <aside className="discover-aside">
          <div className="desktop-budget"><Budget /></div>
          <section className="panel shortlist">
            <div className="row spread">
              <h2>Your saved places</h2>
              <span className="count-pill">{activePlaces.length}</span>
            </div>
            {activePlaces.length ? (
              <ul>
                {activePlaces.map(p => (
                  <li key={p.id}>
                    <PlaceImage place={p} />
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.category} · {Number.isFinite(p.cost) ? (p.cost === 0 ? 'Free' : money(p.cost)) : 'Unpriced'}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Keep what calls to you. Your saved places appear here as you explore.</p>
            )}
            <button className="ink-button" onClick={() => navigate('plan')}>
              Plan my itinerary <Icon>arrow_forward</Icon>
            </button>
          </section>
          <Companion title="The honest bit matters.">
            Every place comes with a verified reality check. Your journey deserves fewer unpleasant surprises.
          </Companion>
        </aside>
      </div>

      {/* Details Sheet with PeekRating & PulseHeart */}
      <Sheet open={details} onClose={closeDetails} title={place?.name}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0 12px' }}>
          <PeekRating value={4.8} count={48} source="Pico Community" readOnly={true} />
          <PulseHeart
            isLiked={Boolean(s.publicLikes?.[place?.id]?.userLiked)}
            likesCount={s.publicLikes?.[place?.id]?.count ?? 0}
            onToggle={() => place && s.togglePublicLike(place.id)}
          />
        </div>
        <p style={{ fontSize: '14px', lineHeight: 1.5 }}>{place?.description}</p>
        <div className="reality" style={{ margin: '12px 0' }}>
          <Icon>lightbulb</Icon>
          <div>
            <strong>Reality Check</strong>
            <p>{place?.caveat}</p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {Number.isFinite(place?.cost) ? (place.cost === 0 ? 'Free entry' : `${money(place?.cost)} estimated per person`) : 'Price unverified'} · {place?.time} minutes suggested duration
        </p>
        <div className="actions" style={{ marginTop: '16px' }}>
          <Button onClick={() => { decide(true); setDetails(false); }}>
            Keep this place
          </Button>
          <Button variant="ghost" onClick={closeDetails}>Close</Button>
        </div>
      </Sheet>

      {/* Destination & Preferences Sheet */}
      <Sheet open={filters} onClose={closeFilters} title="Destination & Preferences">
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
          Choose Destination
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {supportedCities.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => s.setPrefs({ city: c })}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: city === c ? '2px solid var(--coral)' : '1px solid var(--line)',
                background: city === c ? 'color-mix(in srgb, var(--coral) 10%, var(--paper))' : 'var(--paper)',
                color: city === c ? 'var(--coral)' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              📍 {c}
            </button>
          ))}
        </div>

        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
          Budget Envelope (₹)
        </label>
        <input
          type="number"
          min={0}
          step={1000}
          value={s.budgetEnvelope}
          onChange={e => s.setBudget(Number(e.target.value))}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '14px', marginBottom: '16px' }}
        />

        <Button onClick={closeFilters} style={{ width: '100%' }}>Done</Button>
      </Sheet>
    </main>
  );
}
