import {initializeApp,getApps,getApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getDatabase} from 'firebase/database';
import {env} from './env.js';
import {parseFirebaseConfig} from './firebase-config.js';

const config=parseFirebaseConfig(env('VITE_FIREBASE_CONFIG'));
let initializedApp=null;
try{if(config)initializedApp=getApps().length?getApp():initializeApp(config);}catch{initializedApp=null;}

export const firebaseReady=Boolean(initializedApp);
export const realtimeDatabaseReady=Boolean(initializedApp&&config?.databaseURL);
export const app=initializedApp;
export const auth=initializedApp?getAuth(initializedApp):null;
export const db=initializedApp?getFirestore(initializedApp):null;
export const rtdb=realtimeDatabaseReady?getDatabase(initializedApp,config.databaseURL):null;
