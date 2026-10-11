import 'dotenv/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function localApiPlugin(){
  const loaders={trains:()=>import('./api/trains.js'),buses:()=>import('./api/buses.js'),flights:()=>import('./api/flights.js'),places:()=>import('./api/places.js'),distance:()=>import('./api/distance.js')};
  return {name:'pico-local-api',configureServer(server){
    server.middlewares.use('/api', (req,res,next)=>{
      const dispatch=async()=>{
        const url=new URL(req.url||'/', 'http://localhost');
        const name=url.pathname.split('/').filter(Boolean)[0];
        if(!loaders[name])return next();
        req.query=Object.fromEntries(url.searchParams.entries());
        if(req.method==='POST'){
          let raw='';
          try{
            for await(const chunk of req){raw+=chunk;if(raw.length>65536){res.statusCode=413;res.end(JSON.stringify({status:'ERROR',error:'Request body too large.'}));return;}}
            req.body=raw?JSON.parse(raw):{};
          }catch{res.statusCode=400;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ERROR',error:'Invalid JSON request body.'}));return;}
        }
        try{const {default:handler}=await loaders[name]();await handler(req,res);}
        catch{if(!res.headersSent){res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'UNAVAILABLE',error:'Local API function failed.'}));}}
      };
      void dispatch();
    });
  }};
}

export default defineConfig({
  plugins: [
    react(),
    localApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/*.svg', 'assets/*.jpg', 'assets/*.png'],
      manifest: {
        name: 'Pico Travel',
        short_name: 'Pico',
        description: 'Everywhere you\'ve been. Everywhere you\'re going.',
        theme_color: '#FAF7F2',
        background_color: '#FAF7F2',
        display: 'standalone',
        start_url:'/',scope:'/',
        icons: [{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]
      },
      // Cache the app shell and supplied local data only. Caching provider
      // responses here would hide their LIVE/CACHED provenance from adapters.
      workbox: {globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],globIgnores:['**/firebase-*.js']}
    })
  ]
});
