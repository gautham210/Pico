import { useEffect,useState } from 'react';
import { useStore } from '../lib/store';
import Button from '../components/Button';
import fullLogo from '../../Full Logo.png';
import {hasFirebaseConfig} from '../../services/firebase-config.js';

export default function Login({ navigate }) {
  const [name, setName] = useState('');
  const [firebaseReady,setFirebaseReady]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const login = useStore(s => s.login);

  useEffect(()=>{let active=true;if(!hasFirebaseConfig()){setFirebaseReady(false);return()=>{active=false;};}import('../../services/firebase.js').then(({firebaseReady})=>{if(active)setFirebaseReady(firebaseReady);}).catch(()=>{if(active)setFirebaseReady(false);});return()=>{active=false;};},[]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(name.trim() || 'Guest',{provider:'guest'});
    navigate('home');
  };

  const continueWithGoogle=async()=>{
    setLoading(true);setError('');
    try{const {signInWithGoogle}=await import('../../services/auth.js');const credential=await signInWithGoogle();const user=credential.user;login(user.displayName||user.email||'Pico traveller',{uid:user.uid,provider:'firebase',avatar:user.photoURL||''});navigate('home');}
    catch(err){setError(err.message||'Google sign-in could not be completed.');}
    finally{setLoading(false);}
  };

  return (
    <main className="journey" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <img src={fullLogo} alt="Pico Logo" style={{ width: '200px', marginBottom: '24px' }} />
      <h1>Welcome to Pico</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Pico has been everywhere. Now he's going with you.</p>
      
      <form onSubmit={handleSubmit} className="panel login-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2>Demo Login</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Continue as a local guest. This device does not share trips.</p>
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
        <div className="login-provider">
          <Button type="button" variant="secondary" disabled={!firebaseReady||loading} onClick={continueWithGoogle}>{loading?'Opening Google…':'Continue with Google'}</Button>
          {!firebaseReady&&<small className="muted">Firebase sign-in is unavailable: this build has no valid public Firebase configuration.</small>}
          {error&&<p role="alert" className="review-blocker">{error}</p>}
        </div>
      </form>
    </main>
  );
}
