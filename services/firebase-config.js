export function parseFirebaseConfig(raw){
 let config;
 try{config=typeof raw==='string'?JSON.parse(raw):raw;}catch{return null;}
 if(!config||typeof config!=='object')return null;
 const required=['apiKey','authDomain','projectId','appId'];
 return required.every(key=>typeof config[key]==='string'&&config[key].trim())?config:null;
}

export const readFirebaseConfig=()=>parseFirebaseConfig(import.meta.env?.VITE_FIREBASE_CONFIG);
export const hasFirebaseConfig=()=>Boolean(readFirebaseConfig());
