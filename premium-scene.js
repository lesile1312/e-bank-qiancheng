(() => {
  'use strict';

  const scene = document.querySelector('#futureScene');
  const canvas = document.querySelector('#sceneParticles');
  if (!scene || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const coreValue = document.querySelector('#sceneP50');
  const state = window.__qiancheng?.state;
  const colors = ['#53d3ee', '#67deb6', '#e9c270', '#a989e8'];
  const particles = [];
  const bursts = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;
  let paused = false;

  const seeded = (n) => {
    const value = Math.sin(n * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  };

  function resize() {
    const box = scene.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) {
      for (let i = 0; i < 68; i += 1) {
        particles.push({
          x: seeded(i + 2) * width,
          y: seeded(i + 80) * height,
          r: .45 + seeded(i + 140) * 1.45,
          speed: .04 + seeded(i + 210) * .12,
          drift: (seeded(i + 280) - .5) * .08,
          alpha: .17 + seeded(i + 350) * .58,
          color: colors[i % colors.length]
        });
      }
    }
  }

  function dot(x, y, radius, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOrbitTrails(time) {
    const cx = width * .52;
    const cy = height * .49;
    const rings = [
      { rx: width * .30, ry: height * .14, speed: .00033, color: '#53d3ee' },
      { rx: width * .24, ry: height * .20, speed: -.00024, color: '#e9c270' },
      { rx: width * .16, ry: height * .29, speed: .00018, color: '#a989e8' }
    ];
    rings.forEach((ring, ringIndex) => {
      ctx.beginPath();
      for (let i = 0; i <= 26; i += 1) {
        const theta = (i / 26) * Math.PI * 2 + time * ring.speed;
        const x = cx + Math.cos(theta) * ring.rx;
        const y = cy + Math.sin(theta) * ring.ry;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = .06 + ringIndex * .012;
      ctx.lineWidth = 1;
      ctx.stroke();
      const theta = time * ring.speed + ringIndex * 1.7;
      dot(cx + Math.cos(theta) * ring.rx, cy + Math.sin(theta) * ring.ry, 1.6, ring.color, .82);
      dot(cx + Math.cos(theta + Math.PI) * ring.rx, cy + Math.sin(theta + Math.PI) * ring.ry, 1, ring.color, .4);
    });
  }

  function drawBursts() {
    bursts.forEach((p) => {
      p.life -= .016;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= .985;
      p.vy *= .985;
      dot(p.x, p.y, p.size * Math.max(p.life, 0), p.color, Math.max(p.life, 0));
    });
    while (bursts.length && bursts[0].life <= 0) bursts.shift();
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach((p, index) => {
      if (!reduceMotion) {
        p.y -= p.speed;
        p.x += Math.sin(time * .0003 + index) * p.drift;
        if (p.y < -8) p.y = height + 8;
        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;
      }
      dot(p.x, p.y, p.r, p.color, p.alpha);
    });
    drawOrbitTrails(time);
    drawBursts();
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(time) {
    if (paused) {
      raf = 0;
      return;
    }
    if (!paused) {
      if (time - last > 28) {
        draw(time);
        last = time;
      }
      raf = requestAnimationFrame(loop);
    }
  }

  function burst() {
    if (reduceMotion) return;
    const cx = width * .52;
    const cy = height * .49;
    for (let i = 0; i < 22; i += 1) {
      const angle = (Math.PI * 2 * i) / 22;
      const speed = 1.2 + seeded(i + Date.now() % 97) * 2.4;
      bursts.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 1 + seeded(i + 61), life: .8, color: colors[i % colors.length] });
    }
  }

  function updateTicker() {
    const next = state?.result?.a?.p50?.[state.months - 1];
    if (!coreValue || !Number.isFinite(next)) return;
    const target = Math.round(next);
    if (gsap) {
      const proxy = { value: Number(coreValue.dataset.value || target) };
      gsap.to(proxy, { value: target, duration: .7, ease: 'power3.out', overwrite: true, onUpdate: () => {
        coreValue.textContent = `¥${Math.round(proxy.value).toLocaleString('zh-CN')}`;
        coreValue.dataset.value = String(Math.round(proxy.value));
      } });
    } else {
      coreValue.textContent = `¥${target.toLocaleString('zh-CN')}`;
      coreValue.dataset.value = String(target);
    }
    burst();
  }

  function setupTilt() {
    if (reduceMotion) return;
    const targets = document.querySelectorAll('.command, .baseline, .journey-board, .forecast, .insight');
    targets.forEach((el) => {
      if (el.dataset.sceneTilt) return;
      el.dataset.sceneTilt = 'true';
      let frame = 0;
      let nextX = 0;
      let nextY = 0;
      const apply = () => {
        frame = 0;
        el.style.transform = `perspective(1200px) rotateX(${nextX}deg) rotateY(${nextY}deg) translateZ(0)`;
      };
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - .5;
        const py = (event.clientY - rect.top) / rect.height - .5;
        nextX = Math.max(-3.2, Math.min(3.2, py * -5.4));
        nextY = Math.max(-3.2, Math.min(3.2, px * 5.4));
        if (!frame) frame = requestAnimationFrame(apply);
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        nextX = 0; nextY = 0;
        if (!frame) frame = requestAnimationFrame(apply);
      }, { passive: true });
    });

    scene.addEventListener('pointermove', (event) => {
      const rect = scene.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - .5;
      const py = (event.clientY - rect.top) / rect.height - .5;
      scene.style.transform = `rotateX(${py * -2.2}deg) rotateY(${px * 2.8}deg)`;
    }, { passive: true });
    scene.addEventListener('pointerleave', () => { scene.style.transform = ''; }, { passive: true });
  }

  resize();
  draw(0);
  setupTilt();
  updateTicker();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('qiancheng:updated', updateTicker);
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused && !raf) raf = requestAnimationFrame(loop);
  });
  raf = requestAnimationFrame(loop);
})();
