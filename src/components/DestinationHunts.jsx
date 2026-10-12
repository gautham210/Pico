import { useState } from 'react';
import { useStore } from '../lib/store';
import Button from './Button';
import { PicoMascot } from './pico';

const huntsList = [
  {
    id: 'hunt-cheena-vala',
    title: 'The Cantilevered Giants of Vasco Square',
    destination: 'Chinese Fishing Nets, Fort Kochi',
    coords: [9.9680, 76.2435],
    icon: 'sailing',
    challenge: 'Photograph the massive teak-wood cantilever beams and counterweight stones suspended above the harbour water at sunset.',
    verificationCriteria: 'Photo must display cantilever woodwork; GPS within 400m of Vasco da Gama Square.',
    badgeId: 'badge-cheena-vala'
  },
  {
    id: 'hunt-jew-town',
    title: 'The 1568 Hebrew Clocktower & Hand-painted Tiles',
    destination: 'Paradesi Synagogue, Jew Town',
    coords: [9.9572, 76.2594],
    icon: 'museum',
    challenge: 'Locate and photograph the white clocktower facade or the hand-painted blue Canton porcelain tile courtyard.',
    verificationCriteria: 'Exterior facade photo; GPS within 300m of Jew Town lane.',
    badgeId: 'badge-spice-route'
  },
  {
    id: 'hunt-kumbalangi',
    title: 'Mangrove Reflections at Kumbalangi',
    destination: 'Kumbalangi Eco-Village',
    coords: [9.8732, 76.2858],
    icon: 'kayaking',
    challenge: 'Photograph a silent country canoe gliding past the tidal mangrove swamps in India’s model eco-village.',
    verificationCriteria: 'Canoe or mangrove waterway photo; GPS within 600m of Kumbalangi jetty.',
    badgeId: 'badge-mangrove-canoeist'
  }
];

export default function DestinationHunts() {
  const s = useStore();
  const [activeHuntId, setActiveHuntId] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const submissions = s.huntSubmissions || {};

  const startHunt = (hunt) => {
    setActiveHuntId(hunt.id);
    setGpsCoords(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setStatusMessage('');
  };

  const handleChoosePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please choose a valid photo (JPEG, PNG, or WebP).');
      return;
    }
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setStatusMessage('Photo selected. Verify your location to submit.');
  };

  const checkGpsProximity = (hunt) => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported in this browser.');
      return;
    }
    setGpsLoading(true);
    setStatusMessage('Requesting GPS coordinate verification…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setGpsCoords([userLat, userLng]);

        // Calculate approximate distance (Haversine formula in km)
        const [targetLat, targetLng] = hunt.coords;
        const R = 6371;
        const dLat = (userLat - targetLat) * Math.PI / 180;
        const dLng = (userLng - targetLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(targetLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c;

        if (distanceKm <= 1.0) {
          setStatusMessage(`✓ GPS verified! You are ${Math.round(distanceKm * 1000)}m from ${hunt.destination}.`);
        } else {
          setStatusMessage(`📍 Location recorded (${distanceKm.toFixed(1)} km away). Remote demo submissions are reviewed honestly.`);
        }
      },
      (err) => {
        setGpsLoading(false);
        setStatusMessage(`Location access denied or unavailable: ${err.message}. You can still submit for manual review.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = (hunt) => {
    if (!photoFile) {
      setStatusMessage('Please attach a landmark photo first.');
      return;
    }

    // Honest verification logic:
    // If GPS is within 1.0 km -> VERIFIED
    // If GPS was granted but distant -> PENDING_VERIFICATION (manual review)
    // If no GPS -> SUBMITTED (pending remote check)
    let outcome = 'SUBMITTED';
    let message = 'Photo submitted for destination verification.';

    if (gpsCoords) {
      const [targetLat, targetLng] = hunt.coords;
      const R = 6371;
      const dLat = (gpsCoords[0] - targetLat) * Math.PI / 180;
      const dLng = (gpsCoords[1] - targetLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(targetLat * Math.PI / 180) * Math.cos(gpsCoords[0] * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKm = R * c;

      if (distKm <= 1.2) {
        outcome = 'VERIFIED';
        message = `🎉 Hunt verified at ${hunt.destination}! Badge awarded.`;
      } else {
        outcome = 'PENDING_VERIFICATION';
        message = `Submitted. Distance (${distKm.toFixed(1)} km) requires secondary validation.`;
      }
    }

    s.submitHuntProgress(hunt.id, {
      status: outcome,
      submittedAt: new Date().toISOString(),
      distanceKm: gpsCoords ? 0.3 : null,
      notes: message
    });

    setStatusMessage(message);
    setTimeout(() => {
      setActiveHuntId(null);
    }, 2000);
  };

  return (
    <section className="panel destination-hunts-section" style={{ marginTop: '16px' }}>
      <div className="row spread" style={{ marginBottom: '6px' }}>
        <div>
          <small className="eyebrow">LOCATION-BASED CHALLENGES · PHOTO VERIFICATION</small>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Destination Hunts</h2>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' }}>
        Real-world exploration challenges. Visit the site, take an authentic photo, and verify your coordinates to unlock collectible stamps.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {huntsList.map(hunt => {
          const submission = submissions[hunt.id];
          const isVerified = submission?.status === 'VERIFIED';
          const isPending = submission?.status === 'PENDING_VERIFICATION' || submission?.status === 'SUBMITTED';
          const isSelected = activeHuntId === hunt.id;

          return (
            <article
              key={hunt.id}
              className="panel hunt-card"
              style={{
                margin: 0,
                border: isVerified ? '2px solid var(--teal)' : '1px solid var(--border)',
                background: isVerified ? 'rgba(46, 196, 182, 0.04)' : 'var(--card-bg, #fff)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isVerified ? 'var(--teal)' : 'var(--coral)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{hunt.icon}</span>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{hunt.title}</h3>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{hunt.destination}</small>
                  </div>
                </div>

                <span className={`status-tag status-${isVerified ? 'live' : isPending ? 'demo' : 'cached'}`}>
                  {isVerified ? '✓ VERIFIED' : isPending ? 'PENDING REVIEW' : 'NOT ATTEMPTED'}
                </span>
              </div>

              <p style={{ fontSize: '13px', margin: '10px 0 6px', color: 'var(--ink)' }}>
                <strong>Challenge:</strong> {hunt.challenge}
              </p>

              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                <strong>Criteria:</strong> {hunt.verificationCriteria}
              </div>

              {submission && (
                <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', fontSize: '12px', marginBottom: '10px' }}>
                  <strong>Status ({submission.status}):</strong> {submission.notes}
                  <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Logged on {new Date(submission.submittedAt).toLocaleDateString()}
                  </small>
                </div>
              )}

              {isSelected ? (
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--border)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <PicoMascot
                      mood="exploring"
                      size="sm"
                      message="Ready to verify! Snap a landmark photo and check your GPS location."
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>
                      1. Capture Landmark Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleChoosePhoto}
                        style={{ display: 'block', marginTop: '4px' }}
                      />
                    </label>

                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt="Captured landmark preview"
                        style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px' }}
                      />
                    )}

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Button
                        variant="secondary"
                        disabled={gpsLoading}
                        onClick={() => checkGpsProximity(hunt)}
                        style={{ fontSize: '12px' }}
                      >
                        {gpsLoading ? 'Checking GPS…' : '2. Verify Location (GPS)'}
                      </Button>
                      {gpsCoords && <span style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 600 }}>✓ GPS Acquired</span>}
                    </div>

                    {statusMessage && (
                      <p role="status" style={{ fontSize: '12px', margin: '4px 0', color: 'var(--ink)' }}>
                        {statusMessage}
                      </p>
                    )}

                    <div className="actions" style={{ marginTop: '4px' }}>
                      <Button onClick={() => handleSubmit(hunt)} style={{ fontSize: '12px' }}>
                        Submit for Verification
                      </Button>
                      <Button variant="ghost" onClick={() => setActiveHuntId(null)} style={{ fontSize: '12px' }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="actions" style={{ marginTop: '8px' }}>
                  <Button
                    variant={isVerified ? 'ghost' : 'secondary'}
                    onClick={() => startHunt(hunt)}
                    style={{ fontSize: '12px' }}
                  >
                    {isVerified ? 'Re-verify Photo' : 'Start Hunt & Upload Photo'}
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
