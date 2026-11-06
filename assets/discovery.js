/* Native disclosures work without JavaScript; filtering and deep links enhance them. */
(() => {
 'use strict';
 function hashId() {
  try { return decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return ''; }
 }
 function revealHash() {
  const id = hashId();
  const target = id && document.getElementById(id);
  if (!target) return;
  let node = target;
  while (node) {
   if (node.tagName === 'DETAILS') node.open = true;
   node = node.parentElement;
  }
  if (id.startsWith('watch-')) requestAnimationFrame(() => target.scrollIntoView({block:'start',behavior:'auto'}));
 }
 function enhanceLibrary(library) {
  const language = library.querySelector('[data-library-language]');
  const format = library.querySelector('[data-library-format]');
  const status = library.querySelector('[data-library-status]');
  const empty = library.querySelector('[data-library-empty]');
  const controls = library.querySelector('[data-library-controls]');
  const entries = Array.from(library.querySelectorAll('[data-library-item]'));
  if (!language || !format || !status || !controls || !empty) return;
  function apply() {
   let visible = 0;
   entries.forEach(entry => {
    const match = (language.value === 'all' || entry.dataset.language.includes(language.value)) &&
      (format.value === 'all' || entry.dataset.format === format.value);
    entry.hidden = !match;
    if (match) visible += 1;
   });
   status.textContent = `${visible} ${visible === 1 ? 'item' : 'items'}`;
   empty.hidden = visible > 0;
  }
  function applyHash() {
   const id = hashId();
   const groups = {
    'english-podcasts':['english','podcast'], 'french-podcasts':['french','podcast'],
    'english-press':['english','press'], 'authored-contributions':['all','writing'],
    'french-broadcasts-press':['french','press'], 'coalition-news':['all','press']
   };
   if (groups[id]) [language.value,format.value] = groups[id];
   else if (id.startsWith('watch-')) {
    const target = document.getElementById(id);
    const entry = target && target.closest('[data-library-item]');
    if (entry && entry.hidden) {
     language.value = entry.dataset.language;
     format.value = 'all';
    }
   }
   apply();
  }
  library.querySelector('[data-library-apply]')?.addEventListener('click',apply);
  language.addEventListener('change',apply);
  language.addEventListener('input',apply);
  format.addEventListener('change',apply);
  format.addEventListener('input',apply);
  window.addEventListener('hashchange',applyHash);
  controls.hidden = false;
  language.value = 'english';
  applyHash();
 }
 function initialize() {
  document.querySelectorAll('[data-media-library]').forEach(enhanceLibrary);
  document.querySelectorAll('[data-poster-player]').forEach(player => {
   let wasOpen = player.open;
   player.addEventListener('toggle', () => {
    if (wasOpen && !player.open) player.querySelectorAll('iframe').forEach(frame => { frame.src = frame.src; });
    wasOpen = player.open;
   });
  });
  revealHash();
  window.addEventListener('hashchange',revealHash);
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();
