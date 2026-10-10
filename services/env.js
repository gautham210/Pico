// Only public Firebase/unsigned Cloudinary configuration may reach the browser.
export function env(key){
 if(typeof window==='undefined'&&typeof process!=='undefined')return process.env[key.replace(/^VITE_/,'')];
 if(key==='VITE_FIREBASE_CONFIG')return import.meta.env?.VITE_FIREBASE_CONFIG;
 if(key==='VITE_CLOUDINARY_URL'){const value=import.meta.env?.VITE_CLOUDINARY_URL;return value&&!value.includes('://')?value:undefined;}
 return undefined;
}
