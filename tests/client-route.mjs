import assert from 'node:assert/strict';
import {getRoute} from '../src/lib/service-api.js';
const original=globalThis.fetch;
try {
 for(const payload of [{source:'LIVE',distanceKm:2,minutes:3,geometry:[[200,1],[2,3]]},{source:'LIVE',distanceKm:null,minutes:3,geometry:[[1,2],[2,3]]},{source:'LIVE',distanceKm:2,minutes:3,geometry:null}]){globalThis.fetch=async()=>({ok:true,json:async()=>payload});assert.equal((await getRoute([[1,2],[2,3]])).source,'UNAVAILABLE');}
 const good={source:'CACHED',distanceKm:2,minutes:3,geometry:[[1,2],[2,3]]};globalThis.fetch=async()=>({ok:true,json:async()=>good});assert.deepEqual(await getRoute([[1,2],[2,3]]),good);
 globalThis.fetch=async()=>{throw new Error('offline')};assert.equal((await getRoute([[1,2],[2,3]])).source,'UNAVAILABLE');
}finally{globalThis.fetch=original;}
console.log('PASS client route measurements, geometry and offline failure validation (mocked).');
