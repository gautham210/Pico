const interestTerms={
 beach:['beach','coast','waterfront','island','backwater'],
 nature:['nature','park','waterfall','garden','forest','viewpoint','scenic','lake'],
 culture:['culture','heritage','fort','temple','church','museum','history','architecture'],
 food:['food','cafe','café','restaurant','market','bakery','culinary'],
 outdoors:['adventure','outdoor','trek','hike','kayak','surf','water sports'],
 'hidden gem':['hidden gem','art','gallery','market','craft','local experience']
};

export const interests=[['beach','Beaches & waterfront'],['nature','Nature & scenery'],['culture','Culture & heritage'],['food','Food & cafés'],['outdoors','Adventure & outdoors'],['hidden gem','Art, markets & hidden gems']];

export function matchesInterests(place,selected=[]){
 if(!selected.length)return true;
 const searchable=[place?.category,place?.name,place?.subtitle,place?.description,...(Array.isArray(place?.vibe_tags)?place.vibe_tags:[])].filter(Boolean).join(' ').toLowerCase();
 return selected.some(key=>(interestTerms[key]||[key]).some(term=>searchable.includes(term)));
}
