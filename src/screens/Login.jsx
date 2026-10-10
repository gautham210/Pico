import { useState } from 'react';
import { useStore } from '../lib/store';
import Button from '../components/Button';
import fullLogo from '../../Full Logo.png';

export default function Login({ navigate }) {
  const [name, setName] = useState('');
  const login = useStore(s => s.login);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(name.trim() || 'Guest');
    navigate('home');
  };

  return (
    <main className="journey" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <img src={fullLogo} alt="Pico Logo" style={{ width: '200px', marginBottom: '24px' }} />
      <h1>Welcome to Pico</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Pico has been everywhere. Now he's going with you.</p>
      
      <form onSubmit={handleSubmit} className="panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2>Demo Login</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>This is a local demo account. No password required.</p>
        <label>
          Your Name
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. The Curious Explorer" 
          />
        </label>
        <div style={{ marginTop: '24px' }}>
          <Button type="submit" variant="primary">Continue as {name || 'guest'}</Button>
        </div>
      </form>
    </main>
  );
}
