import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, activeTripPlaces } from '../lib/store';
import Button from '../components/Button';
import { modes, money } from '../lib/provider';
import { supportedCities } from '../../data/city-collections.js';
import { validCoords } from '../lib/service-api.js';
import {
  isSupabaseConfigured,
  createCloudTrip,
  joinCloudTrip,
  updateLiveLocation,
  subscribeTripLocations,
  leaveTripRoom,
  generateSecureInviteCode
} from '../../services/supabase.js';

export default function RideTogether({ navigate }) {
  const s = useStore();
  const activePlaces = activeTripPlaces(s);
  const user = s.user;

  // Convoy Room State
  const [activeRoom, setActiveRoom] = useState(null); // { id, name, invite_code, destination, owner_id }
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [destinationInput, setDestinationInput] = useState(s.userPrefs?.city || 'Kochi');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  // Live Location & Presence State
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [myCoords, setMyCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Idle'); // 'Idle' | 'Searching' | 'Live' | 'Denied' | 'Error'
  const [accuracyMeters, setAccuracyMeters] = useState(null);
  const [peers, setPeers] = useState([]); // [ { user_id, name, lat, lng, heading, speed, updated_at, is_sharing } ]
  const [regroupAlert, setRegroupAlert] = useState(null);

  const watchIdRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const lastCoordsRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Initialize or restore demo convoy if desired
  useEffect(() => {
    // If not in a room, check if local draft has a room code saved
    try {
      const savedRoom = sessionStorage.getItem('pico-active-convoy');
      if (savedRoom) {
        setActiveRoom(JSON.parse(savedRoom));
      }
    } catch {}
  }, []);

  // Set up Supabase Realtime location listener for the active room
  useEffect(() => {
    if (!activeRoom?.id || !isSupabaseConfigured()) return;

    const unsubscribe = subscribeTripLocations(activeRoom.id, (payload) => {
      if (!payload || payload.user_id === user?.uid) return;
      setPeers((prev) => {
        const index = prev.findIndex((p) => p.user_id === payload.user_id);
        const updated = {
          ...payload,
          name: payload.name || `Rider ${payload.user_id.slice(0, 4)}`,
          updatedAtMs: Date.now()
        };
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updated };
          return next;
        }
        return [...prev, updated];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [activeRoom?.id, user?.uid]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;
    import('leaflet').then((L) => {
      if (!mapContainerRef.current) return;
      const initialCenter = myCoords || [9.9312, 76.2673]; // Kochi default
      const mapInstance = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance);

      markersGroupRef.current = L.featureGroup().addTo(mapInstance);
      leafletMapRef.current = mapInstance;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [activeRoom]);

  // Update Leaflet Markers when my location or peer locations update
  useEffect(() => {
    if (!leafletMapRef.current || !markersGroupRef.current) return;
    import('leaflet').then((L) => {
      markersGroupRef.current.clearLayers();

      // Render My Location Marker
      if (myCoords) {
        const myIcon = L.divIcon({
          className: 'pico-map-icon-wrap',
          html: `<div style="background:var(--coral);color:white;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-weight:700;font-size:12px;">ME</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });
        L.marker(myCoords, { icon: myIcon, title: 'Your Location' })
          .bindPopup(`<strong>You (${user?.name || 'Explorer'})</strong><br/>Live GPS`)
          .addTo(markersGroupRef.current);
      }

      // Render Peer Markers
      const now = Date.now();
      peers.forEach((peer) => {
        if (!validCoords([peer.lat, peer.lng])) return;
        const isStale = (now - new Date(peer.updated_at || now).getTime()) > 120000;
        const color = isStale ? '#f59e0b' : '#006a64';

        const peerIcon = L.divIcon({
          className: 'pico-map-icon-wrap',
          html: `<div style="background:${color};color:white;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);font-size:11px;font-weight:700;">${(peer.name || 'P').charAt(0)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const statusNote = isStale ? '<span style="color:#b45309">Stale (>2m ago)</span>' : '<span style="color:#15803d">Live</span>';
        L.marker([peer.lat, peer.lng], { icon: peerIcon, title: peer.name })
          .bindPopup(`<strong>${peer.name}</strong><br/>${statusNote}`)
          .addTo(markersGroupRef.current);
      });

      // Also render destination stops pins
      activePlaces.filter(p => validCoords(p.coords)).forEach((p, idx) => {
        const stopIcon = L.divIcon({
          className: 'pico-map-icon-wrap',
          html: `<div style="background:#28313c;color:white;width:24px;height:24px;border-radius:6px;display:grid;place-items:center;border:2px solid white;font-size:10px;font-weight:700;">${idx + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker(p.coords, { icon: stopIcon, title: p.name })
          .bindPopup(`<strong>Stop ${idx + 1}: ${p.name}</strong>`)
          .addTo(markersGroupRef.current);
      });

      // Fit bounds if markers exist
      const bounds = markersGroupRef.current.getBounds();
      if (bounds.isValid()) {
        leafletMapRef.current.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
      }
    });
  }, [myCoords, peers, activePlaces]);

  // GPS Watch Position Management
  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setGpsStatus('Error');
      return;
    }

    setGpsStatus('Searching');
    setError('');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        const heading = pos.coords.heading || null;
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0; // km/h

        setMyCoords([lat, lng]);
        setAccuracyMeters(accuracy);
        setGpsStatus(`Live (±${accuracy}m)`);
        setIsSharingLocation(true);

        // Throttle updates: send only every 10s or if moved > 20 meters
        const now = Date.now();
        const lastTime = lastBroadcastRef.current;
        const prev = lastCoordsRef.current;

        const hasMovedEnough = !prev || (Math.abs(prev[0] - lat) > 0.0002 || Math.abs(prev[1] - lng) > 0.0002);
        if (now - lastTime > 10000 || hasMovedEnough) {
          lastBroadcastRef.current = now;
          lastCoordsRef.current = [lat, lng];

          if (activeRoom?.id && user?.uid && isSupabaseConfigured()) {
            updateLiveLocation(activeRoom.id, user.uid, {
              lat,
              lng,
              heading,
              speed,
              accuracy,
              is_sharing: true
            }).catch(() => {});
          }
        }
      },
      (err) => {
        if (err.code === 1) {
          setGpsStatus('Denied');
          setError('Location access was denied. You can still view other riders on the map.');
        } else {
          setGpsStatus('Error');
          setError('Unable to acquire GPS signal. Check device settings.');
        }
        setIsSharingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  const stopSharingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharingLocation(false);
    setGpsStatus('Idle');

    if (activeRoom?.id && user?.uid && isSupabaseConfigured()) {
      updateLiveLocation(activeRoom.id, user.uid, {
        lat: myCoords?.[0] || 0,
        lng: myCoords?.[1] || 0,
        is_sharing: false
      }).catch(() => {});
    }
  };

  // Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const roomName = roomNameInput.trim() || `${destinationInput} Road Trip`;
    const inviteCode = generateSecureInviteCode(6);

    try {
      if (isSupabaseConfigured() && user?.uid) {
        const res = await createCloudTrip(
          {
            title: roomName,
            destination: destinationInput,
            invite_code: inviteCode
          },
          user.uid
        );
        if (res?.error) throw res.error;
        const newRoom = {
          id: res.trip.id,
          name: roomName,
          invite_code: inviteCode,
          destination: destinationInput,
          owner_id: user.uid
        };
        setActiveRoom(newRoom);
        sessionStorage.setItem('pico-active-convoy', JSON.stringify(newRoom));
      } else {
        // Local / demo simulation room
        const demoRoom = {
          id: `room-${Date.now()}`,
          name: roomName,
          invite_code: inviteCode,
          destination: destinationInput,
          owner_id: user?.uid || 'guest-host'
        };
        setActiveRoom(demoRoom);
        sessionStorage.setItem('pico-active-convoy', JSON.stringify(demoRoom));

        // Seed with demo companion peers for realistic experience
        setPeers([
          {
            user_id: 'peer-maya',
            name: 'Maya',
            lat: 9.935,
            lng: 76.262,
            speed: 38,
            updated_at: new Date().toISOString(),
            is_sharing: true
          },
          {
            user_id: 'peer-rohan',
            name: 'Rohan',
            lat: 9.928,
            lng: 76.275,
            speed: 42,
            updated_at: new Date().toISOString(),
            is_sharing: true
          }
        ]);
      }
      setIsCreating(false);
    } catch (err) {
      setError(err.message || 'Could not create trip room. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  // Join Room
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      setError('Please enter a valid 6-character room code.');
      return;
    }
    setBusy(true);
    setError('');

    try {
      if (isSupabaseConfigured() && user?.uid) {
        const res = await joinCloudTrip(code, user.uid);
        if (res?.error) throw res.error;
        const joined = {
          id: res.trip.id,
          name: res.trip.title,
          invite_code: res.trip.invite_code,
          destination: res.trip.destination,
          owner_id: res.trip.owner_id
        };
        setActiveRoom(joined);
        sessionStorage.setItem('pico-active-convoy', JSON.stringify(joined));
      } else {
        // Demo room joining
        const demoJoined = {
          id: `room-${code}`,
          name: `${code} Convoy`,
          invite_code: code,
          destination: destinationInput,
          owner_id: 'host'
        };
        setActiveRoom(demoJoined);
        sessionStorage.setItem('pico-active-convoy', JSON.stringify(demoJoined));
      }
      setIsJoining(false);
    } catch (err) {
      setError(err.message || 'Room code not found. Please verify with the trip host.');
    } finally {
      setBusy(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!activeRoom?.invite_code) return;
    try {
      await navigator.clipboard.writeText(activeRoom.invite_code);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2500);
    } catch {
      setCopyStatus('Code: ' + activeRoom.invite_code);
    }
  };

  // Leave room
  const handleLeaveRoom = () => {
    stopSharingLocation();
    if (activeRoom?.id && user?.uid && isSupabaseConfigured()) {
      leaveTripRoom(activeRoom.id, user.uid).catch(() => {});
    }
    setActiveRoom(null);
    setPeers([]);
    sessionStorage.removeItem('pico-active-convoy');
  };

  // Calculate pooled kitty
  const memberCount = (peers.length || 0) + 1;
  const pooledKitty = (s.budgetEnvelope || 20000) * memberCount;

  return (
    <main className="journey ride-together-screen" style={{ gap: '16px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeRoom ? '#16a34a' : 'var(--muted)', display: 'inline-block' }} />
            <small className="eyebrow" style={{ margin: 0 }}>
              {activeRoom ? 'LIVE CONVOY LOBBY' : 'GROUP TRAVEL & NAVIGATION'}
            </small>
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: '26px' }}>Ride Together</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" onClick={() => navigate('trips')}>
            Trips
          </Button>
          <Button variant="secondary" onClick={() => navigate('map')}>
            Route Map
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '12px', color: '#991b1b' }}>
          ⚠️ {error}
        </div>
      )}

      {/* VIEW 1: NO ACTIVE ROOM (CREATE OR JOIN) */}
      {!activeRoom ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          <section className="panel" style={{ padding: '24px', textAlign: 'center', display: 'grid', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🚴‍♀️</span>
            <h2 style={{ margin: 0, fontSize: '22px' }}>Travel Alongside Your Friends</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
              Create a live trip room or enter an invite code to share routes, see buddies on a live map, pool budgets, and receive regrouping alerts if anyone separates.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
              <Button variant="primary" id="create-convoy-btn" onClick={() => { setIsCreating(true); setIsJoining(false); setError(''); }}>
                + Create a Convoy Room
              </Button>
              <Button variant="secondary" id="join-convoy-btn" onClick={() => { setIsJoining(true); setIsCreating(false); setError(''); }}>
                Join with Room Code
              </Button>
            </div>
          </section>

          {/* Form: Create Room */}
          {isCreating && (
            <form onSubmit={handleCreateRoom} className="panel" style={{ display: 'grid', gap: '12px' }}>
              <h3>Create a Convoy Room</h3>
              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Convoy Name
                <input
                  type="text"
                  id="convoy-name-input"
                  value={roomNameInput}
                  onChange={e => setRoomNameInput(e.target.value)}
                  placeholder="e.g. Munnar Weekend Convoy"
                  required
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Destination
                <select
                  id="convoy-dest-select"
                  value={destinationInput}
                  onChange={e => setDestinationInput(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                >
                  {supportedCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <div className="actions" style={{ marginTop: '8px' }}>
                <Button type="submit" variant="primary" id="submit-create-convoy" disabled={busy}>
                  {busy ? 'Setting up room…' : 'Launch Convoy Room →'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Form: Join Room */}
          {isJoining && (
            <form onSubmit={handleJoinRoom} className="panel" style={{ display: 'grid', gap: '12px' }}>
              <h3>Join a Convoy</h3>
              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Enter 6-character Passcode
                <input
                  type="text"
                  id="join-code-input"
                  value={inviteCodeInput}
                  onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. K8P4XZ"
                  maxLength={8}
                  required
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
                />
              </label>

              <div className="actions" style={{ marginTop: '8px' }}>
                <Button type="submit" variant="primary" id="submit-join-convoy" disabled={busy}>
                  {busy ? 'Connecting…' : 'Join Convoy →'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsJoining(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Features Preview Card */}
          <section className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '24px' }}>📍</span>
              <strong style={{ display: 'block', fontSize: '14px', margin: '4px 0' }}>Live Map Pins</strong>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                See your travel companions move in real-time with speed and heading.
              </p>
            </div>
            <div>
              <span style={{ fontSize: '24px' }}>🔔</span>
              <strong style={{ display: 'block', fontSize: '14px', margin: '4px 0' }}>Regroup Alerts</strong>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                If someone falls behind or takes a wrong turn, suggests safe rendezvous points.
              </p>
            </div>
            <div>
              <span style={{ fontSize: '24px' }}>💰</span>
              <strong style={{ display: 'block', fontSize: '14px', margin: '4px 0' }}>Pooled Kitty</strong>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                Shared budget tracking across group members without awkward split calculations.
              </p>
            </div>
          </section>
        </div>
      ) : (
        /* VIEW 2: ACTIVE CONVOY ROOM */
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Room Header Card with Invite Code & Actions */}
          <section className="panel" style={{ padding: '20px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  <small className="eyebrow" style={{ margin: 0 }}>ACTIVE TRIP ROOM · {activeRoom.destination}</small>
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: '22px' }}>{activeRoom.name}</h2>
              </div>
              <span className="status-tag status-live" style={{ alignSelf: 'center' }}>
                {memberCount} RIDERS IN LOBBY
              </span>
            </div>

            {/* Invite Code Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--paper)', borderRadius: '14px', border: '1px solid var(--line)' }}>
              <div>
                <small style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', display: 'block' }}>INVITE PASSCODE</small>
                <strong style={{ fontSize: '20px', letterSpacing: '3px', color: 'var(--ink)' }}>{activeRoom.invite_code}</strong>
              </div>
              <Button variant="secondary" id="copy-convoy-code-btn" onClick={handleCopyCode} style={{ minHeight: '36px' }}>
                {copyStatus || 'Copy Code 📋'}
              </Button>
            </div>

            {/* Pooled Budget / Kitty Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '12px', background: 'color-mix(in srgb, var(--teal) 6%, var(--card))', borderRadius: '12px', border: '1px solid color-mix(in srgb, var(--teal) 20%, var(--line))' }}>
              <div>
                <small className="eyebrow" style={{ margin: 0, color: 'var(--teal)' }}>POOLED KITTY</small>
                <strong style={{ display: 'block', fontSize: '18px', color: 'var(--teal)' }}>₹{pooledKitty.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <small className="eyebrow" style={{ margin: 0, color: 'var(--teal)' }}>SPLIT PER PERSON</small>
                <strong style={{ display: 'block', fontSize: '18px', color: 'var(--teal)' }}>₹{(s.budgetEnvelope || 20000).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </section>

          {/* Location Sharing Controller */}
          <section className="panel" style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Live Location Presence</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  GPS Status: <strong>{gpsStatus}</strong>
                </p>
              </div>
              <Button
                variant={isSharingLocation ? 'ghost' : 'primary'}
                id="toggle-location-sharing-btn"
                onClick={isSharingLocation ? stopSharingLocation : startSharingLocation}
              >
                {isSharingLocation ? 'Stop Sharing GPS ⏹️' : 'Start Sharing GPS ▶️'}
              </Button>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0, lineHeight: 1.45 }}>
              🔒 <strong>Privacy Boundary:</strong> Browser location is active while this tab is open. Updates are throttled to conserve battery. For continuous locked-screen background navigation, a native app wrapper is recommended.
            </p>
          </section>

          {/* Interactive Live Map */}
          <section className="panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
            <div
              ref={mapContainerRef}
              id="ride-together-map"
              style={{ width: '100%', height: '380px', background: '#28313c' }}
              role="application"
              aria-label="Live convoy interactive map"
            />
          </section>

          {/* Regrouping Assistant / Companion List */}
          <section className="panel" style={{ display: 'grid', gap: '12px' }}>
            <h3>Convoy Riders</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {/* Myself */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--coral)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                    {(user?.name || 'Y').charAt(0)}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>{user?.name || 'You'} (Host)</strong>
                    <small style={{ fontSize: '11px', color: isSharingLocation ? '#16a34a' : 'var(--muted)' }}>
                      {isSharingLocation ? `Live GPS (±${accuracyMeters || 10}m)` : 'Location not shared'}
                    </small>
                  </div>
                </div>
                <span className={`status-tag status-${isSharingLocation ? 'live' : 'cached'}`}>
                  {isSharingLocation ? 'SHARING' : 'IDLE'}
                </span>
              </div>

              {/* Peers */}
              {peers.map((peer) => (
                <div key={peer.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#006a64', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                      {peer.name.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block' }}>{peer.name}</strong>
                      <small style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {peer.speed ? `${peer.speed} km/h` : 'Nearby'} · Active
                      </small>
                    </div>
                  </div>
                  <span className="status-tag status-live">ONLINE</span>
                </div>
              ))}
            </div>

            {/* Leave Room Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="ghost" onClick={handleLeaveRoom} style={{ color: '#991b1b' }}>
                Leave Convoy Room
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
