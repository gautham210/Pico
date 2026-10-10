import {useEffect,useMemo,useState} from 'react';
import Button from '../components/Button';
import {places as kochiPlaces} from '../data/places';
import {useStore} from '../lib/store';
import {getLocalPhoto,removeLocalPhoto,saveLocalPhoto} from '../lib/media-store';

const categories=[['overall','Overall experience'],['value','Value for money'],['places','Places & activities'],['transport','Transport & convenience']];
const blankRatings={overall:3,value:3,places:3,transport:3};
const today=()=>new Date().toISOString().slice(0,10);

function ReviewPhoto({id,alt}){
 const [src,setSrc]=useState('');
 useEffect(()=>{let url='';let active=true;getLocalPhoto(id).then(blob=>{if(active&&blob){url=URL.createObjectURL(blob);setSrc(url);}}).catch(()=>{});return()=>{active=false;if(url)URL.revokeObjectURL(url);};},[id]);
 return src?<img className="review-photo" src={src} alt={alt}/>:null;
}

export default function Reviews(){
 const s=useStore();
 const available=useMemo(()=>[...new Map([...kochiPlaces,...s.likedPlaces].map(place=>[place.id,place])).values()],[s.likedPlaces]);
 const [editingId,setEditingId]=useState('');
 const [photoFile,setPhotoFile]=useState(null);
 const [photoPreview,setPhotoPreview]=useState('');
 const [form,setForm]=useState({subjectId:'trip',subjectName:`${s.userPrefs.city||'Kochi'} trip`,title:'',good:'',better:'',tips:'',date:today(),visibility:'private',ratings:{...blankRatings}});
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const total=categories.reduce((sum,[key])=>sum+(Number(form.ratings[key])||0),0);
 const update=(patch)=>setForm(current=>({...current,...patch}));
 const emptyForm=()=>({subjectId:'trip',subjectName:`${s.userPrefs.city||'Kochi'} trip`,title:'',good:'',better:'',tips:'',date:today(),visibility:'private',ratings:{...blankRatings},photoId:''});
 const reset=()=>{setEditingId('');setForm(emptyForm());setPhotoFile(null);setNotice('');setError('');};
 useEffect(()=>{if(!photoFile){setPhotoPreview('');return;}const url=URL.createObjectURL(photoFile);setPhotoPreview(url);return()=>URL.revokeObjectURL(url);},[photoFile]);
 const edit=review=>{setEditingId(review.id);setPhotoFile(null);setForm({...review,ratings:{...blankRatings,...review.ratings}});setError('');setNotice('Saved review loaded. Changes remain on this device until saved.');window.scrollTo({top:0,behavior:'smooth'});};
 const choosePhoto=event=>{const file=event.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Choose a PNG, JPEG or WebP photo under 5 MB.');event.target.value='';return;}setPhotoFile(file);setError('');};
 const save=status=>async event=>{event.preventDefault();setError('');if(!form.title.trim()){setError('Add a short review title before saving.');return;}const id=editingId||globalThis.crypto?.randomUUID?.()||`review-${Date.now()}`;try{if(photoFile)await saveLocalPhoto(id,photoFile);const subject=available.find(place=>place.id===form.subjectId);const review={...form,subjectName:form.subjectId==='trip'?`${s.userPrefs.city||'Kochi'} trip`:subject?.name||form.subjectName,status,id,photoId:photoFile||form.photoId?id:''};s.saveReview(review);setNotice(status==='private'?'Private review saved on this device.':form.visibility==='public'?'Draft saved locally. Public publishing is unavailable, so nobody else can see it.':'Draft saved on this device.');setEditingId('');setForm(emptyForm());setPhotoFile(null);}catch(e){setError(`Review was not saved: ${e.message||'local photo storage is unavailable.'}`);}};
 const score=ratings=>categories.reduce((sum,[key])=>sum+(Number(ratings?.[key])||0),0);
 return <main className="journey review-screen">
  <header className="page-heading"><div><small className="eyebrow">Place Tier List · Travel Reviews</small><h1>Rate the journey you took.</h1><p>Four ratings from 1–5 add to a total out of 20. Reviews here are separate from private diary memories.</p></div></header>
  <div className="review-layout">
   <form className="panel review-form" onSubmit={save('draft')}>
    <div className="row spread"><h2>{editingId?'Edit review':'Write a review'}</h2><strong className="review-score" aria-live="polite">{total}<small>/20</small></strong></div>
    <p className="fine-print">This is a device-local draft/private review. Public publishing requires a configured review backend and is currently unavailable.</p>
    <label>Review about<select value={form.subjectId} onChange={event=>update({subjectId:event.target.value})}><option value="trip">My {s.userPrefs.city||'Kochi'} trip</option>{available.map(place=><option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
    <label>Review date<input type="date" value={form.date||today()} onChange={event=>update({date:event.target.value})}/></label>
    <label>Title or summary<input required maxLength={120} value={form.title} onChange={event=>update({title:event.target.value})} placeholder="A short, useful headline"/></label>
    <fieldset className="rating-set"><legend>Your ratings <small>Each score contributes equally to the total</small></legend>{categories.map(([key,label])=><div className="rating-row" key={key}><span>{label}</span><div role="radiogroup" aria-label={label}>{[1,2,3,4,5].map(value=><label key={value} className="rating-choice"><input type="radio" name={`rating-${key}`} value={value} checked={Number(form.ratings[key])===value} onChange={()=>update({ratings:{...form.ratings,[key]:value}})}/><span>{value}</span></label>)}</div></div>)}</fieldset>
    <label>What went well<textarea maxLength={1600} value={form.good} onChange={event=>update({good:event.target.value})} placeholder="A detail another traveller might appreciate"/></label>
    <label>What could have been better<textarea maxLength={1600} value={form.better} onChange={event=>update({better:event.target.value})} placeholder="Anything you would plan differently next time?"/></label>
    <label>Practical tips (optional)<textarea maxLength={1200} value={form.tips} onChange={event=>update({tips:event.target.value})} placeholder="Timing, access or what to bring"/></label>
    <label>Optional photo (stored on this device)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto}/></label>
    {(photoPreview||form.photoId)&&<div className="review-photo-preview">{photoPreview?<img src={photoPreview} alt="Selected review photo preview"/>:<ReviewPhoto id={form.photoId} alt="Saved review photo"/>}<Button type="button" variant="ghost" onClick={()=>{setPhotoFile(null);if(form.photoId)removeLocalPhoto(form.photoId).catch(()=>{});update({photoId:''});}}>Remove photo</Button></div>}
    <label>Visibility<select value={form.visibility} onChange={event=>update({visibility:event.target.value})}><option value="private">Private — only on this device</option><option value="public">Public — request publication later</option></select></label>
    {form.visibility==='public'&&<p className="review-blocker" role="status">Public publication is unavailable: no review API or verified Firebase review contract is configured. Saving keeps this as a local draft; it will not appear in a public feed.</p>}
    {error&&<p className="review-blocker" role="alert">{error}</p>}
    <div className="actions"><Button type="submit">Save draft</Button><Button type="button" variant="secondary" onClick={save('private')}>Save private review</Button>{editingId&&<Button type="button" variant="ghost" onClick={reset}>Cancel edit</Button>}</div>
   </form>
   <aside className="review-sidebar"><section className="panel"><small className="eyebrow">Public review feed</small><h2>Honest notes, when publishing is ready.</h2><p>There is no public feed yet. Device-local drafts and private reviews are not shown as public, and no average rating is calculated from them.</p><Button disabled title="Public review service is not configured">Public publishing unavailable</Button></section><section className="panel"><h2>Your saved reviews</h2><p>{s.reviews.length} device-local {s.reviews.length===1?'review':'reviews'}</p><small className="muted">A local review is not shared with friends or other Pico users.</small></section></aside>
  </div>
  <p role="status" className="feedback">{notice}</p>
  <section className="review-list" aria-label="Your device-local reviews">{s.reviews.map(review=><article className="panel review-card" key={review.id}><div className="row spread"><div><small className="eyebrow">{review.status==='private'?'PRIVATE · THIS DEVICE':'DRAFT · THIS DEVICE'}</small><h2>{review.title}</h2></div><strong className="review-score">{score(review.ratings)}<small>/20</small></strong></div><p>{review.subjectName} · {review.date}</p>{review.photoId&&<ReviewPhoto id={review.photoId} alt={`Photo attached to ${review.title}`}/>}<div className="review-scores">{categories.map(([key,label])=><span key={key}>{label}: {review.ratings[key]}/5</span>)}</div>{review.good&&<p><strong>What went well</strong><br/>{review.good}</p>}{review.better&&<p><strong>Could be better</strong><br/>{review.better}</p>}{review.tips&&<p><strong>Tip</strong><br/>{review.tips}</p>}{review.visibility==='public'&&review.status==='draft'&&<p className="review-blocker">Public requested; still a private device-only draft.</p>}<div className="actions"><Button variant="secondary" onClick={()=>edit(review)}>Edit</Button><Button variant="ghost" onClick={()=>{if(window.confirm('Delete this device-local review?')){s.removeReview(review.id);if(review.photoId)removeLocalPhoto(review.photoId).catch(()=>{});setNotice('Review deleted from this device.');}}}>Delete</Button></div></article>)}{!s.reviews.length&&<section className="panel empty"><h2>No reviews yet.</h2><p>Keep notes about a place or trip. Private reviews stay local to this device.</p></section>}</section>
 </main>;
}
