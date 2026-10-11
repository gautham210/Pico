import { useState, useEffect } from 'react';

export function BellToggle({
  enabled,
  initialEnabled = false,
  onChange,
  onToggle,
  reminderTime,
  initialOffset = 1,
  onTimeChange,
  destinationName = 'your journey',
  departureDate = '',
  className = ''
}) {
  const effectiveInitial = enabled !== undefined ? enabled : initialEnabled;
  const effectiveOffset = reminderTime || (initialOffset ? `${initialOffset}_day` : '1_day');
  const [isActive, setIsActive] = useState(effectiveInitial);
  const [selectedTime, setSelectedTime] = useState(effectiveOffset);
  const [permissionState, setPermissionState] = useState('default');
  const [isRinging, setIsRinging] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (enabled !== undefined) setIsActive(enabled);
    else if (initialEnabled !== undefined) setIsActive(initialEnabled);
  }, [enabled, initialEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleToggle = async () => {
    const nextState = !isActive;

    if (nextState) {
      setIsRinging(true);
      setTimeout(() => setIsRinging(false), 800);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            const perm = await Notification.requestPermission();
            setPermissionState(perm);
            if (perm === 'granted') {
              setStatusMsg(`Reminder active: Notifications will alert you before departure.`);
            } else {
              setStatusMsg('Saved in Pico trip plan. (Browser system notifications are disabled)');
            }
          } catch {
            setStatusMsg('Reminder active in your Pico itinerary schedule.');
          }
        } else if (Notification.permission === 'granted') {
          setStatusMsg(`Reminder set for ${destinationName}.`);
        } else {
          setStatusMsg('Saved in Pico trip plan. (Browser notifications blocked in settings)');
        }
      } else {
        setStatusMsg('Saved in Pico trip plan. (Web notifications unavailable on this device)');
      }
    } else {
      setStatusMsg('Trip reminder turned off.');
    }

    setIsActive(nextState);
    const offsetNum = parseInt(selectedTime, 10) || 1;
    onChange?.(nextState, selectedTime);
    onToggle?.({ enabled: nextState, offsetDays: offsetNum, scheduledAt: nextState ? new Date().toISOString() : null });
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleTimeSelect = (e) => {
    const val = e.target.value;
    const offsetNum = parseInt(val, 10) || 1;
    setSelectedTime(val);
    onTimeChange?.(val);
    if (isActive) {
      onChange?.(true, val);
      onToggle?.({ enabled: true, offsetDays: offsetNum, scheduledAt: new Date().toISOString() });
    }
  };

  return (
    <div className={`bell-toggle-container ${className}`} style={{ display: 'grid', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`Toggle trip reminder for ${destinationName}`}
          onClick={handleToggle}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            border: `1.5px solid ${isActive ? 'var(--coral)' : 'var(--line)'}`,
            background: isActive ? 'color-mix(in srgb, var(--coral) 10%, var(--card))' : 'var(--paper)',
            color: isActive ? 'var(--coral)' : 'var(--ink)',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Animated Bell SVG */}
          <span
            style={{
              display: 'inline-block',
              transformOrigin: 'top center',
              animation: isRinging ? 'bell-swing 0.8s ease-in-out' : 'none'
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isActive ? 'var(--coral)' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span>{isActive ? 'Reminder Set' : 'Remind me before trip'}</span>
        </button>

        {isActive && (
          <select
            value={selectedTime}
            onChange={handleTimeSelect}
            aria-label="Reminder notification time"
            style={{
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              background: 'var(--paper)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--ink)'
            }}
          >
            <option value="1_day">1 day before</option>
            <option value="3_days">3 days before</option>
            <option value="1_week">1 week before</option>
          </select>
        )}
      </div>

      {statusMsg && (
        <small
          role="status"
          style={{
            fontSize: '11px',
            color: isActive ? 'var(--teal)' : 'var(--muted)',
            lineHeight: 1.4
          }}
        >
          ℹ️ {statusMsg}
        </small>
      )}
    </div>
  );
}

export default BellToggle;

