(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const stylesheet = document.createElement('link'); stylesheet.rel = 'stylesheet'; stylesheet.href = 'premium-motion.css'; document.head.appendChild(stylesheet);
  if (reduceMotion) return;
  root.classList.add('pmu-enabled');
  // Pattern IDs: spring-cascade, press-feedback, glow-border. Shared values: 520ms / 46ms / scale .96.
  const cascadeSelectors = ['.intro', '.command', '.baseline', '.journey .title', '.journey-board', '.details .forecast', '.details .insight', '.stats article', '.trust-grid article', '.allocation-lab'];
  function setupCascade() {
    const targets = cascadeSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    targets.forEach((el, index) => { if (el.dataset.pmuCascade === 'true') return; el.dataset.pmuCascade = 'true'; el.classList.add('pmu-cascade-target'); el.style.setProperty('--pmu-order', Math.min(index, 9)); });
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('pmu-in')); return; }
    const observer = new IntersectionObserver((entries, io) => entries.forEach((entry) => { if (!entry.isIntersecting) return; entry.target.classList.add('pmu-in'); io.unobserve(entry.target); }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    targets.forEach((el) => observer.observe(el));
  }
  function pressFeedback(event) {
    const target = event.target.closest('button, .strategy-option'); if (!target || target.disabled) return;
    const keyboardPress = event.type === 'keydown' || event.type === 'keyup'; const activationKey = event.key === ' ' || event.key === 'Enter';
    if (event.type === 'pointerdown' || (keyboardPress && activationKey)) target.classList.add('pmu-press');
    if (event.type === 'pointerup' || event.type === 'pointercancel' || event.type === 'pointerleave' || (keyboardPress && activationKey && event.type === 'keyup')) target.classList.remove('pmu-press');
  }
  function boot() { setupCascade(); ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave', 'keydown', 'keyup'].forEach((type) => document.addEventListener(type, pressFeedback, { passive: true })); new MutationObserver(setupCascade).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
}());
