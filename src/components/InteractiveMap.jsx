import {useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const validCoords=coords=>Array.isArray(coords)&&coords.length===2&&coords.every(Number.isFinite)&&Math.abs(coords[0])<=90&&Math.abs(coords[1])<=180;

function pinIcon(kind,label=''){
  const safeLabel=/^\d+$/.test(String(label))?String(label):'';
  return L.divIcon({className:'pico-map-icon-wrap',html:`<span class="pico-map-pin ${kind}"><span>${safeLabel}</span></span>`,iconSize:[44,50],iconAnchor:[22,44]});
}

export default function InteractiveMap({places=[],likedPlaces=[],selectedId,currentLocation,route,onSelect,onTileStatus}){
  const container=useRef(null),map=useRef(null),layer=useRef(null),routeLayer=useRef(null),[tileError,setTileError]=useState(false);
  const catalog=[...new Map([...places,...likedPlaces].filter(p=>validCoords(p?.coords)).map(p=>[p.id,p])).values()];
  const saved=new Map(likedPlaces.map((p,i)=>[p.id,i+1]));

  useEffect(()=>{
    if(!container.current)return;
    const first=catalog[0]?.coords||[15.49,73.83];
    const instance=L.map(container.current,{center:first,zoom:12,scrollWheelZoom:false,zoomControl:true});
    const url=import.meta.env.VITE_OSM_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tiles=L.tileLayer(url,{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'});
    tiles.on('tileerror',()=>{setTileError(true);onTileStatus?.(false);});
    tiles.on('tileload',()=>{setTileError(false);onTileStatus?.(true);});
    tiles.addTo(instance);
    map.current=instance;
    return()=>{instance.remove();map.current=null;layer.current=null;};
    // Map construction is intentionally one-time; layers below track place and route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    const instance=map.current;if(!instance)return;
    if(layer.current){layer.current.remove();layer.current=null;}
    if(routeLayer.current){routeLayer.current.remove();routeLayer.current=null;}
    const group=L.featureGroup();
    for(const place of catalog){
      const stop=saved.get(place.id),kind=place.id===selectedId?'selected':stop?'itinerary':'place';
      const marker=L.marker(place.coords,{icon:pinIcon(kind,stop||''),title:place.name,alt:place.name,riseOnHover:true,keyboard:true});
      marker.on('click',()=>onSelect?.(place.id));marker.addTo(group);
    }
    if(currentLocation&&validCoords(currentLocation))L.marker(currentLocation,{icon:pinIcon('current'),title:'Your current location',alt:'Your current location',keyboard:true}).addTo(group);
    if(Array.isArray(route?.geometry)&&route.geometry.length>1){
      const line=route.geometry.map(([lng,lat])=>[lat,lng]);
      routeLayer.current=L.polyline(line,{color:'#FF6B4A',weight:5,opacity:.88,lineJoin:'round'}).addTo(instance);
    }
    group.addTo(instance);layer.current=group;
    if(selectedId){const selected=catalog.find(p=>p.id===selectedId);if(selected)instance.setView(selected.coords,Math.max(instance.getZoom(),13),{animate:false});}
  },[catalog.map(p=>`${p.id}:${p.coords.join(',')}`).join('|'),likedPlaces.map(p=>p.id).join('|'),selectedId,currentLocation?.join(','),route?.source,route?.geometry,onSelect]);

  const fit=()=>{const routeBounds=routeLayer.current?.getBounds();const bounds=routeBounds?.isValid()?routeBounds:layer.current?.getBounds();if(bounds?.isValid())map.current?.fitBounds(bounds.pad(.18),{maxZoom:14});};
  return <div className="pico-map-shell">
    <div ref={container} className="pico-map" role="application" aria-label="Interactive OpenStreetMap with destination markers" />
    <button type="button" className="pico-map-fit" onClick={fit}>{route?.geometry?'Fit route':'Fit places'}</button>
    {tileError&&<p className="pico-map-status" role="status">Map tiles are unavailable on this connection. Place data remains available below.</p>}
    {!catalog.length&&<p className="pico-map-status" role="status">No places with validated coordinates are available in this area.</p>}
  </div>;
}
