import wordmark from '../../Full Logo.png';
import {useStore} from '../lib/store';
export default function Nav({title='Pico'}){
  const { profile } = useStore();
  const avatar = profile?.avatar || 'https://placehold.co/100x100?text=' + (profile?.displayName?.[0] || 'D');
  return (
    <header className="app-header">
      <a href="#home" aria-label="Pico home">
        <span><img src={wordmark} alt="Pico" style={{ height: '32px', width: 'auto' }}/></span>
      </a>
      <span className="screen-title">{title}</span>
      <a href="#profile" aria-label="Your Profile">
        <img className="avatar" src={avatar} alt="Demo traveller profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}/>
      </a>
    </header>
  );
}
