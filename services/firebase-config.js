export function parseFirebaseConfig(raw){
 let config;
 if(!raw)return null;
 if(typeof raw==='object')config=raw;
 else if(typeof raw==='string'){
   try{config=JSON.parse(raw);}
   catch{
     try{config=JSON.parse(raw.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'));}
     catch{return null;}
   }
 }else return null;
 if(!config||typeof config!=='object')return null;
 const required=['apiKey','authDomain','projectId','appId'];
 return required.every(key=>typeof config[key]==='string'&&config[key].trim())?config:null;
}

export const readFirebaseConfig=()=>parseFirebaseConfig(import.meta.env?.VITE_FIREBASE_CONFIG);
export const hasFirebaseConfig=()=>Boolean(readFirebaseConfig());
