import React from 'react';
import wordmark from '../../Full Logo.png';
import bird from '../../Bird Only.png';
import { useStore } from '../lib/store';
import { JellyRadio } from './reactbits/JellyRadio';

const TOP_NAV_TABS = [
  { id: 'home', label: 'Explore' },
  { id: 'discover', label: 'Discover' },
  { id: 'plan', label: 'Plan' },
  { id: 'ride', label: 'Ride' },
  { id: 'trips', label: 'Journeys' }
];

export default function Nav({ title = 'Pico', mood = 'idle', moodImage, activeRoute = 'home', onNavigate }) {
  const { profile, user } = useStore();
  const userPhoto = profile?.avatar || user?.avatar;
  const initial = (user?.name || profile?.name || 'Explorer').charAt(0).toUpperCase();

  const handleTabChange = (nextRoute) => {
    if (onNavigate) {
      onNavigate(nextRoute);
    } else {
      window.location.hash = nextRoute;
    }
  };

  return (
    <header className="app-header">
      <a href="#home" aria-label="Pico home">
        <span><img src={wordmark} alt="Pico" style={{ height: '32px', width: 'auto' }} /></span>
      </a>

      {/* Top Desktop Navigation with JellyRadio */}
      <div className="top-desktop-nav">
        <JellyRadio
          name="top-nav"
          options={TOP_NAV_TABS}
          value={TOP_NAV_TABS.some(t => t.id === activeRoute) ? activeRoute : 'home'}
          onChange={handleTabChange}
          size="sm"
        />
      </div>

      <span className="screen-title">{title}</span>

      <a href="#profile" aria-label="Your Profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        {userPhoto ? (
          <img
            className="avatar"
            src={userPhoto}
            alt="Profile photo"
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--coral)' }}
          />
        ) : (
          <div
            className="avatar"
            aria-label="Profile initial"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--coral) 12%, var(--card))',
              border: '1.5px solid var(--coral)',
              color: 'var(--coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(255, 107, 74, 0.15)'
            }}
          >
            {initial}
          </div>
        )}
      </a>
    </header>
  );
}
