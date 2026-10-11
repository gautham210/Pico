import {useState} from 'react';
import Button from './Button';
export function SampleMemories(){
 const [shown,setShown]=useState(true);
 if(!shown)return null;
 return <section className="sample-preview"><div className="row spread"><div><small className="eyebrow">Sample memories · fictional</small><h2>A glimpse of your travel journal</h2></div><button onClick={()=>setShown(false)}>Hide samples</button></div><p>These examples are not your history and are never saved or synced.</p><div className="sample-grid">{[
 ['Fort Kochi','/assets/fort-kochi.jpg','A slow coastal walk, fishing nets silhouetted against the evening sky.'],
 ['Kashi Art Café','/assets/kashi.jpg','A quiet café break with art, conversation and a little time to pause.']
 ].map(([name,image,note])=><article className="panel" key={name}><img src={image} alt={name}/><small>SAMPLE MEMORY · 10 OCT 2026 · A TIER</small><h3>{name}</h3><p>{note}</p></article>)}</div></section>;
}
export function SampleDNA({navigate}){
 const [shown,setShown]=useState(true);
 if(!shown)return null;
 return <section className="panel sample-dna"><small className="eyebrow">Demo profile · illustrative preview</small><h2>The Curious Explorer</h2><p>Culture, coastal walks and unhurried café stops. Your own archetype appears after you save places.</p><div className="chips"><span className="chip">Culture 50%</span><span className="chip">Nature 30%</span><span className="chip">Food 20%</span></div><p>Example stamps: Fort Kochi · Kumbalangi · Kashi. These are sample preferences, not visits or your statistics.</p><div className="actions"><Button onClick={()=>navigate('discover')}>Build my Travel DNA</Button><Button variant="ghost" onClick={()=>setShown(false)}>Hide preview</Button></div></section>;
}
