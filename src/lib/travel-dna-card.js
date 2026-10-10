import birdOnly from '../../Bird Only.png';
import fullLogo from '../../Full Logo.png';
import {tokens} from './tokens.js';

const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Pico artwork could not be loaded.'));image.src=src;});

function roundedRect(ctx,x,y,width,height,radius){
  ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.closePath();
}

function drawContained(ctx,image,x,y,width,height){const scale=Math.min(width/image.width,height/image.height),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,x+(width-w)/2,y+(height-h)/2,w,h);}

function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=2){
  const words=String(text||'').split(/\s+/),lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;if(lines.length===maxLines-1)break;}else line=next;}
  if(line&&lines.length<maxLines)lines.push(line);
  if(lines.length===maxLines&&words.join(' ').length>lines.join(' ').length){let last=lines.at(-1);while(last&&ctx.measureText(`${last}…`).width>maxWidth)last=last.slice(0,-1);lines[lines.length-1]=`${last}…`;}
  lines.forEach((item,index)=>ctx.fillText(item,x,y+index*lineHeight));
}

export async function createTravelDnaCard({title,summary,categories=[],placeCount=0,memoryCount=0,city='Your journeys',places=[]}){
  await document.fonts?.ready;
  const [bird,logo]=await Promise.all([loadImage(birdOnly),loadImage(fullLogo)]);
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export is unavailable in this browser.');
  ctx.fillStyle=tokens.color.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalAlpha=.13;ctx.fillStyle=tokens.color.coral;ctx.beginPath();ctx.arc(1040,80,210,0,Math.PI*2);ctx.fill();ctx.fillStyle=tokens.color.teal;ctx.beginPath();ctx.arc(12,1310,230,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#FFFFFF';roundedRect(ctx,62,64,956,1222,44);ctx.fill();
  drawContained(ctx,logo,112,103,230,86);
  ctx.fillStyle=tokens.color.ink;ctx.font='600 20px "JetBrains Mono", monospace';ctx.textAlign='right';ctx.fillText('TRAVEL DNA',958,151);
  ctx.textAlign='left';ctx.fillStyle=tokens.color.coral;ctx.font='600 18px "JetBrains Mono", monospace';ctx.fillText('YOUR TRAVEL STYLE',112,260);
  ctx.fillStyle=tokens.color.ink;ctx.font='700 64px "Bricolage Grotesque", sans-serif';wrap(ctx,title,112,350,660,72,2);
  ctx.fillStyle=tokens.color.muted;ctx.font='500 25px "Plus Jakarta Sans", sans-serif';wrap(ctx,summary||'A travel profile shaped by your saved places and memories.',112,520,780,38,3);
  drawContained(ctx,bird,760,258,188,188);
  ctx.strokeStyle='rgba(27,27,47,0.08)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(112,660);ctx.lineTo(958,660);ctx.stroke();
  ctx.fillStyle=tokens.color.ink;ctx.font='700 27px "Bricolage Grotesque", sans-serif';ctx.fillText('WHAT DRAWS YOU IN',112,718);
  const rows=categories.slice(0,4),barX=350,barWidth=570;
  rows.forEach((row,index)=>{const y=760+index*66;ctx.fillStyle=tokens.color.ink;ctx.font='600 21px "Plus Jakarta Sans", sans-serif';ctx.fillText(row.name,112,y+22);roundedRect(ctx,barX,y,barWidth,18,9);ctx.fillStyle='rgba(46,196,182,0.16)';ctx.fill();roundedRect(ctx,barX,y,barWidth*Math.max(0,Math.min(1,row.share)),18,9);ctx.fillStyle=tokens.color.teal;ctx.fill();ctx.fillStyle=tokens.color.muted;ctx.textAlign='right';ctx.font='600 18px "JetBrains Mono", monospace';ctx.fillText(`${Math.round(row.share*100)}%`,958,y+22);ctx.textAlign='left';});
  const baseline=rows.length?760+rows.length*66+30:806;
  ctx.fillStyle=tokens.color.saffron;roundedRect(ctx,112,baseline,846,126,26);ctx.fill();
  ctx.fillStyle=tokens.color.ink;ctx.font='700 27px "Bricolage Grotesque", sans-serif';ctx.fillText(`${placeCount} places saved`,140,baseline+48);ctx.fillText(`${memoryCount} memories`,140,baseline+88);
  ctx.textAlign='right';ctx.font='600 21px "Plus Jakarta Sans", sans-serif';wrap(ctx,city,920,baseline+49,300,28,2);ctx.textAlign='left';
  const footerY=Math.min(1228,baseline+200);ctx.strokeStyle='rgba(27,27,47,0.08)';ctx.beginPath();ctx.moveTo(112,footerY-34);ctx.lineTo(958,footerY-34);ctx.stroke();
  ctx.fillStyle=tokens.color.muted;ctx.font='500 17px "Plus Jakarta Sans", sans-serif';ctx.fillText('Based on your selections · destinations shown as planned, not visited',112,footerY);
  if(places.length){ctx.font='600 16px "JetBrains Mono", monospace';ctx.fillStyle=tokens.color.coral;ctx.fillText('PLANNED',112,footerY+34);wrap(ctx,places.slice(0,4).join(' · '),222,footerY+34,730,23,1);}
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('The PNG could not be created.');
  return blob;
}
