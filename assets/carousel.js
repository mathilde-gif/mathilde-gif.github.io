// Progressive enhancement: every card remains present and focusable.
(() => {
  'use strict';

  function enhance(section) {
    const track = section.querySelector('[data-carousel-track]');
    const previous = section.querySelector('[data-carousel-prev]');
    const next = section.querySelector('[data-carousel-next]');
    const controls = section.querySelector('[data-carousel-controls]');
    const status = section.querySelector('[data-carousel-status]');
    const shell = section.querySelector('[data-carousel-shell]');
    if (!track || !previous || !next || !controls || !status) return;

    const motion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false };
    let cards = [];
    let visible = 1;
    let enabled = false;
    track.tabIndex = 0;

    function stride() {
      if (cards.length > 1) {
        const distance = cards[1].offsetLeft - cards[0].offsetLeft;
        if (distance > 0) return distance;
      }
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.getPropertyValue('column-gap')) || 0;
      const width = cards[0] ? cards[0].getBoundingClientRect().width : 0;
      return width + gap || track.clientWidth;
    }

    function limit() {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function update() {
      const left = Math.max(0, Math.min(track.scrollLeft, limit()));
      previous.disabled = !enabled || left <= 1;
      next.disabled = !enabled || left >= limit() - 1;
      const first = enabled
        ? Math.min(Math.max(0, Math.round(left / stride())), Math.max(0, cards.length - visible))
        : 0;
      const text = cards.length
        ? `Items ${first + 1}\u2013${Math.min(first + visible, cards.length)} of ${cards.length}`
        : 'No items';
      if (status.textContent !== text) status.textContent = text;
    }

    function refresh() {
      cards = Array.from(track.children).filter(card => card.matches('.media-card'));
      const value = parseFloat(window.getComputedStyle(track).getPropertyValue('--visible-cards'));
      visible = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
      enabled = cards.length > visible;
      section.classList.toggle('is-carousel', enabled);
      controls.hidden = !enabled;
      // Keep the arrows beside the images, even when descriptions have different heights.
      const visual = cards[0] && cards[0].querySelector('.media-image-link, .video-frame, .media-masthead, figure');
      if (enabled && shell && visual) {
        const frame = visual.getBoundingClientRect();
        const bounds = shell.getBoundingClientRect();
        if (frame.height > 0) shell.style.setProperty('--carousel-arrow-y', `${frame.top + frame.height / 2 - bounds.top}px`);
      }
      update();
    }

    function move(direction) {
      if (!enabled) return;
      const left = Math.max(0, Math.min(track.scrollLeft, limit()));
      const destination = Math.max(0, Math.min(left + direction * stride() * visible, limit()));
      track.scrollBy({ left: destination - left, behavior: motion.matches ? 'auto' : 'smooth' });
    }

    function revealPlayer() {
      const hash = window.location && window.location.hash;
      if (!hash) return;
      let id;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch (_) {
        return;
      }
      if (!id.startsWith('watch-')) return;
      // Compare IDs directly: hashes are not selectors, and only this carousel's
      // direct card players may change its horizontal position.
      const card = cards.find(candidate => Array.from(candidate.children).some(child =>
        child.id === id && child.matches('.video-frame')
      ));
      if (!card || !enabled) return;
      const left = Math.max(0, Math.min(track.scrollLeft, limit()));
      const cardLeft = card.offsetLeft - cards[0].offsetLeft;
      const cardRight = cardLeft + card.getBoundingClientRect().width;
      if (cardLeft < left - 1 || cardRight > left + track.clientWidth + 1) {
        track.scrollTo({ left: Math.max(0, Math.min(cardLeft, limit())), behavior: motion.matches ? 'auto' : 'smooth' });
      }
      update();
    }

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('load', refresh, true);
    track.addEventListener('keydown', event => {
      if (event.target !== track || !enabled || event.altKey || event.ctrlKey || event.metaKey) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        move(event.key === 'ArrowLeft' ? -1 : 1);
      } else {
        track.scrollTo({ left: event.key === 'Home' ? 0 : limit(), behavior: motion.matches ? 'auto' : 'smooth' });
      }
    });
    window.addEventListener('resize', refresh, { passive: true });
    window.addEventListener('hashchange', revealPlayer);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(refresh);
      observer.observe(track);
    }
    refresh();
    revealPlayer();
  }

  function initialize() {
    document.querySelectorAll('[data-carousel]').forEach(enhance);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
