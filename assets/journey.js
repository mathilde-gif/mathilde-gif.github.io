/* One measured path links real photographic details, from the girl to Mathilde. */
(function () {
  'use strict';

  function projectFocus({rect,naturalWidth,naturalHeight,point,fit='cover',position=[.5,.5]}) {
    const scale=(fit==='contain'?Math.min:Math.max)(rect.width/naturalWidth,rect.height/naturalHeight);
    return {x:rect.left+(rect.width-naturalWidth*scale)*position[0]+point[0]*naturalWidth*scale,
      y:rect.top+(rect.height-naturalHeight*scale)*position[1]+point[1]*naturalHeight*scale};
  }

  function buildJourneyRoute({width,mission,roles,gallery,portrait,mobile=false,speakingTop}) {
    const segments=[],knots=[mission.focus];
    const clamp=x=>Math.max(8,Math.min(width-8,x));
    const point=p=>`${Math.round(p.x*10)/10} ${Math.round(p.y*10)/10}`;
    let current=mission.focus;
    function curve(c1,c2,end,kind='connection') {
      segments.push({start:current,c1,c2,end,kind});current=end;
    }
    // Direct margin connections keep the rounded photo turns free of extra waves.
    function descend(end) {
      const dx=end.x-current.x,dy=end.y-current.y;
      if(Math.hypot(dx,dy)<.01)return;
      curve({x:current.x+dx/3,y:current.y+dy/3},
        {x:current.x+dx*2/3,y:current.y+dy*2/3},end,'margin');
    }
    function roundedExit(end,kind='photo') {
      const start={...current},sign=Math.sign(end.x-start.x),rise=end.y-start.y;
      const radius=Math.min(80,Math.abs(end.x-start.x)*.4,rise),k=.55228475;
      const turn={x:end.x-sign*radius,y:end.y-radius};
      if(radius>8 && Math.abs(turn.y-start.y)<.01) {
        const dx=turn.x-start.x;
        curve({x:start.x+dx/3,y:start.y},{x:start.x+dx*2/3,y:start.y},turn,'bridge-straight');
        curve({x:turn.x+sign*radius*k,y:turn.y},{x:end.x,y:end.y-radius*k},end,kind);
      } else curve({x:start.x+(end.x-start.x)*.5,y:start.y},{x:end.x,y:start.y+rise*.5},end,kind);
    }
    const rail=clamp(roles[0].rect.left-(mobile?20:24));
    const startExit={x:mobile?clamp(mission.rect.left-20):mission.rect.left+mission.rect.width*.72,
      y:mission.rect.bottom+(mobile?16:50)};
    if(mobile) {
      curve({x:mission.focus.x-74,y:mission.focus.y+28},
        {x:startExit.x,y:startExit.y-72},startExit,'mission');
    } else {
      // One open arc leaves the brain light and continues toward the next photograph.
      curve({x:mission.focus.x-70,y:mission.focus.y+(startExit.y-mission.focus.y)*.6},
        {x:startExit.x-mission.rect.width*.3,y:startExit.y},startExit,'mission');
    }
    for(const [i,photo] of roles.entries()) {
      const r=photo.rect,f=photo.focus,vertical=photo.mode==='vertical';
      const entry={x:vertical?f.x-r.width*.2:Math.min(r.right-12,f.x+40),y:r.top};
      if(i)descend({x:rail,y:r.top-(mobile?40:144)});
      else if(mobile)descend({x:startExit.x,y:r.top-40});
      const gap=entry.y-current.y;
      const firstHandle=(!i&&!mobile)?{x:current.x+(entry.x-current.x)*.6,y:current.y}
        :{x:current.x,y:current.y+gap*.8};
      if(vertical) {
        const dy=f.y-entry.y;
        const tangent={x:(f.x-entry.x)*.9,y:dy*.45};
        const approach=Math.min(.75,gap*.5/tangent.y);
        curve(firstHandle,{x:entry.x-tangent.x*approach,y:entry.y-tangent.y*approach},entry,'connection');
        curve({x:entry.x+tangent.x,y:entry.y+tangent.y},{x:f.x,y:f.y-dy*.35},f,'photo');
        knots.push(f);
        const exitY=r.bottom-20,fall=exitY-f.y;
        curve({x:f.x,y:f.y+fall*.65},{x:rail,y:exitY-fall*.4},{x:rail,y:exitY},'photo');
      } else {
        if (i && gap > 90 && Math.abs(entry.x-current.x)>gap) {
          // Broad quarter turns keep a long connector from collapsing into a tight elbow.
          const start={...current},radius=Math.min(80,gap/2),sign=Math.sign(entry.x-start.x),k=.55228475;
          const turn={x:start.x+sign*radius,y:start.y+radius};
          curve({x:start.x,y:start.y+radius*k},{x:turn.x-sign*radius*k,y:turn.y},turn,'rounded-bridge');
          const last={x:entry.x-sign*radius,y:entry.y-radius};
          const dx=last.x-current.x,dy=last.y-current.y;
          curve({x:current.x+dx/3,y:current.y+dy/3},{x:current.x+dx*2/3,y:current.y+dy*2/3},last,'bridge-straight');
          curve({x:last.x+sign*radius*k,y:last.y},{x:entry.x,y:entry.y-radius*k},entry,'rounded-bridge');
        } else curve(firstHandle,{x:entry.x,y:entry.y-gap*.5},entry,'connection');
        curve({x:entry.x,y:f.y},{x:f.x+20,y:f.y},f,'photo');
        knots.push(f);
        const fall=Math.max(48, Math.min(r.height*.48,r.bottom-f.y-8));
        roundedExit({x:rail,y:f.y+fall});
      }
    }
    const row=Math.abs(gallery[0].rect.top-gallery.at(-1).rect.top)<4;
    const ordered=row?[...gallery].sort((a,b)=>b.rect.left-a.rect.left):[...gallery].sort((a,b)=>a.rect.top-b.rect.top);
    const leftRail=clamp(Math.min(mission.rect.left,...gallery.map(p=>p.rect.left))-24);
    const rightRail=clamp(Math.max(...gallery.map(p=>p.rect.right))+24);
    // Switch to the gallery's outer margin in whitespace above its full-width introduction.
    const bridgeEnd=speakingTop-24;
    descend({x:rail,y:Math.max(current.y,roles.at(-1).rect.bottom+36,speakingTop-112)});
    const bridgeGap=bridgeEnd-current.y;
    curve({x:rail,y:current.y+bridgeGap*.5},{x:rightRail,y:bridgeEnd-bridgeGap*.5},{x:rightRail,y:bridgeEnd},'connection');
    let direction=-1;
    ordered.forEach((photo,i)=>{
      const f=photo.focus;
      if(!row||i===0) {
        const incoming=direction<0?rightRail:leftRail;
        descend({x:incoming,y:f.y-100});
        curve({x:incoming,y:f.y},{x:f.x-direction*40,y:f.y},f,'photo');
      } else {
        const span=current.x-f.x;
        curve({x:current.x-span*.36,y:current.y},{x:f.x+span*.36,y:f.y},f,'photo');
      }
      knots.push(f);
      if(!row||i===ordered.length-1) {
        const outgoing=direction<0?leftRail:rightRail;
        roundedExit({x:outgoing,y:f.y+80});
      }
      if(!row)direction*=-1;
    });
    // Restore the exact wraparound drawing from the first portrait design (version 25).
    const frame=portrait.frame,scale=Math.min(frame.width/280,frame.height/340);
    const local=(x,y)=>({x:frame.left+(frame.width-280*scale)/2+x*scale,
      y:frame.top+(frame.height-340*scale)/2+y*scale});
    const start=local(234,58);
    descend({x:leftRail,y:frame.top-64});
    curve({x:leftRail,y:frame.top-12},local(184,27),start,'portrait-entry');
    for(const points of [
      [284,89,270,168,239,208],
      [209,248,133,296,48,266],
      [-8,246,10,190,37,190],
      [62,192,62,221,38,224]
    ])curve(local(points[0],points[1]),local(points[2],points[3]),local(points[4],points[5]),'portrait-original');
    knots.push(portrait.focus);
    const highlights=[mission.focus,...roles.filter(photo=>photo.highlight!==false).map(photo=>photo.focus)];
    return {d:`M${point(mission.focus)} `+segments.map(s=>`C${point(s.c1)} ${point(s.c2)} ${point(s.end)}`).join(' '),segments,knots,highlights};
  }

  if(typeof module!=='undefined'&&module.exports)module.exports={projectFocus,buildJourneyRoute};
  if(typeof document==='undefined')return;
  const journey=document.querySelector('[data-journey]');
  if(!journey)return;
  const svg=journey.querySelector('.journey-thread'),path=svg.querySelector('path');
  const lightLayer=journey.querySelector('.journey-highlights'),lights=lightLayer.querySelector('g');
  const mission=journey.querySelector('.mission-visual img');
  const roles=[...journey.querySelectorAll('.role-photo img')];
  const gallery=[...journey.querySelectorAll('.home-speaking .photo-card img')];
  const portrait=journey.querySelector('.contact-portrait img');
  const images=[mission,...roles,...gallery,portrait];
  let pending=false;
  const draw=()=>{
    pending=false;
    const bounds=journey.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    const measure=img=>{
      const box=img.getBoundingClientRect(),css=getComputedStyle(img);
      const rect={left:box.left-bounds.left,top:box.top-bounds.top,right:box.right-bounds.left,bottom:box.bottom-bounds.top,width:box.width,height:box.height};
      const position=css.objectPosition.split(' ').map(v=>parseFloat(v)/100);
      const focus=projectFocus({rect,naturalWidth:img.naturalWidth||Number(img.getAttribute('width')),naturalHeight:img.naturalHeight||Number(img.getAttribute('height')),point:img.dataset.focus.split(' ').map(Number),fit:css.objectFit,position});
      // The zoomed girl keeps her original layout frame; her focal point follows the scaled image.
      if(img===mission||img===portrait) {
        const frame=img.parentElement.getBoundingClientRect();
        const frameRect={left:frame.left-bounds.left,top:frame.top-bounds.top,right:frame.right-bounds.left,bottom:frame.bottom-bounds.top,width:frame.width,height:frame.height};
        return {rect:img===mission?frameRect:rect,frame:frameRect,focus,mode:img.dataset.focusRoute};
      }
      return {rect,focus,mode:img.dataset.focusRoute,highlight:img.dataset.focusHighlight!=='false'};
    };
    const speakingTop=journey.querySelector('.home-speaking h2').getBoundingClientRect().top-bounds.top;
    const route=buildJourneyRoute({width:bounds.width,speakingTop,mobile:window.matchMedia('(max-width:900px)').matches,mission:measure(mission),roles:roles.map(measure),gallery:gallery.map(measure),portrait:measure(portrait)});
    for(const layer of [svg,lightLayer])layer.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    path.setAttribute('d',route.d);
    // Independent highlight layer keeps white light above the photographs and the line behind.
    lights.replaceChildren(...route.highlights.map(p=>{
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('transform',`translate(${p.x} ${p.y})`);
      for(const [r,cls] of [[11,'light-halo'],[3.6,'light-core']]){
        const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('r',r);circle.setAttribute('class',cls);g.append(circle);
      }
      return g;
    }));
  };
  const schedule=()=>{if(!pending){pending=true;window.requestAnimationFrame(draw);}};
  window.addEventListener('resize',schedule,{passive:true});
  if('ResizeObserver'in window){const observer=new ResizeObserver(schedule);[journey,...images].forEach(el=>observer.observe(el));}
  images.forEach(img=>{if(!img.complete){img.addEventListener('load',schedule,{once:true});img.addEventListener('error',schedule,{once:true});}});
  if(document.fonts?.ready)document.fonts.ready.then(schedule);schedule();
})();
