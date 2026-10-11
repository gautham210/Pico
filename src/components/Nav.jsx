import React from 'react';
import wordmark from '../../Full Logo.png';
import bird from '../../Bird Only.png';
import { useStore } from '../lib/store';
import { JellyRadio } from './reactbits/JellyRadio';

const TOP_NAV_TABS = [
  { id: 'home', label: 'Explore' },
  { id: 'discover', label: 'Discover' },
  { id: 'plan', label: 'Plan' },
  { id: 'trips', label: 'Journeys' }
];

export default function Nav({ title = 'Pico', mood = 'idle', moodImage, activeRoute = 'home', onNavigate }) {
  const { profile } = useStore();
  const avatar = profile?.avatar || moodImage || bird;

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
      <div className="top-desktop-nav" style={{ display: 'none' }}>
        <JellyRadio
          name="top-nav"
          options={TOP_NAV_TABS}
          value={TOP_NAV_TABS.some(t => t.id === activeRoute) ? activeRoute : 'home'}
          onChange={handleTabChange}
          size="sm"
        />
      </div>

      <span className="screen-title">{title}</span>

      <a href="#profile" aria-label="Your Profile">
        <img
          className="avatar"
          src={avatar}
          alt={profile?.avatar ? 'Profile photo' : `Pico ${mood}`}
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
        />
      </a>
    </header>
  );
}
