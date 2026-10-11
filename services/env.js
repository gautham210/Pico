// Only public Firebase/unsigned Cloudinary configuration may reach the browser.
export function env(key){
 if(typeof window==='undefined'&&typeof process!=='undefined'){
  const clean=key.replace(/^VITE_/,'');
  if(clean==='FIREBASE_CONFIG')return process.env.FIREBASE_CONFIG||process.env.VITE_FIREBASE_CONFIG;
  if(clean==='CLOUDINARY_URL')return process.env.CLOUDINARY_URL||process.env.VITE_CLOUDINARY_URL;
  if(clean==='SUPABASE_URL')return process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
  if(clean==='SUPABASE_ANON_KEY')return process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY;
  return process.env[clean];
 }
 if(key==='VITE_FIREBASE_CONFIG')return import.meta.env?.VITE_FIREBASE_CONFIG;
 if(key==='VITE_CLOUDINARY_URL'){const value=import.meta.env?.VITE_CLOUDINARY_URL;return value&&!value.includes('://')?value:undefined;}
 if(key==='VITE_SUPABASE_URL')return import.meta.env?.VITE_SUPABASE_URL;
 if(key==='VITE_SUPABASE_ANON_KEY')return import.meta.env?.VITE_SUPABASE_ANON_KEY;
 return undefined;
}
