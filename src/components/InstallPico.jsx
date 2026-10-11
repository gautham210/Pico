import {useEffect,useState} from 'react';

export default function InstallPico(){
  const [prompt,setPrompt]=useState(null);
  const [installed,setInstalled]=useState(false);
  const [help,setHelp]=useState(false);
  useEffect(()=>{
    const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
    setInstalled(standalone());
    const available=event=>{event.preventDefault();setPrompt(event);};
    const done=()=>{setInstalled(true);setPrompt(null);};
    window.addEventListener('beforeinstallprompt',available);
    window.addEventListener('appinstalled',done);
    return()=>{window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done);};
  },[]);
  if(installed)return null;
  const install=async()=>{
    if(!prompt){setHelp(true);return;}
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };
  return <section className="install-pico" aria-label="Install Pico">
    <button type="button" onClick={install}>{prompt?'Install Pico':'Add Pico to your device'}</button>
    {help&&<p role="status">Use your browser’s Share or menu button, then choose “Add to Home Screen” or “Install app” if available.</p>}
  </section>;
}
