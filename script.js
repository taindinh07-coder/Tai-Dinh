(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Footer year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Nav: tighten on scroll, mobile toggle */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const railFill = document.getElementById('railFill');

  const closeMenu = () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* Scroll: nav state and the progress rail on the left edge */
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (railFill) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      railFill.style.transform = `scaleY(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
    ticking = false;
  };
  onScroll();
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  /* Highlight the nav link for the section in view */
  const navAnchors = document.querySelectorAll('[data-nav]');
  const sections = Array.from(navAnchors)
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navAnchors.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  /* Typed role line in the hero */
  const typedEl = document.getElementById('typed');
  const roles = [
    'MIS & SCM student',
    'Aspiring software engineer',
    'Data analyst in training',
    'Builder of side projects',
  ];

  if (typedEl && !reduceMotion) {
    let roleIndex = 0;
    let charIndex = roles[0].length;
    let deleting = true;

    const tick = () => {
      const current = roles[roleIndex];

      if (!deleting) {
        charIndex++;
        typedEl.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, 2200);
          return;
        }
      } else {
        charIndex--;
        typedEl.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      setTimeout(tick, deleting ? 32 : 70);
    };

    setTimeout(tick, 2600);
  }

  /* Gentle reveal as sections enter the viewport */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* Stop the SVG orbit when motion is reduced (CSS can't pause SMIL) */
  const orbit = document.querySelector('.orbit');
  if (orbit && reduceMotion && typeof orbit.pauseAnimations === 'function') {
    orbit.pauseAnimations();
  }

  /* Starfield: faint warm stars with a slow twinkle and a little parallax */
  const canvas = document.getElementById('stars');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width, height, stars, animationId;
    let scrollShift = 0;

    const STAR_DENSITY = 0.00016;

    const buildStars = () => {
      const count = Math.round(width * height * STAR_DENSITY);
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: depth * 1.1 + 0.25,
          depth,
          baseAlpha: Math.random() * 0.45 + 0.2,
          twinkleSpeed: Math.random() * 0.012 + 0.003,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    };

    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const twinkle = reduceMotion ? 0 : Math.sin(t * s.twinkleSpeed + s.phase) * 0.22;
        const alpha = Math.max(0, Math.min(1, s.baseAlpha + twinkle));
        let y = (s.y - scrollShift * (0.04 + s.depth * 0.12)) % height;
        if (y < 0) y += height;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 229, 214, ${alpha})`;
        ctx.fill();
      }
      if (!reduceMotion) animationId = requestAnimationFrame(draw);
    };

    window.addEventListener('scroll', () => {
      scrollShift = window.scrollY;
      if (reduceMotion) draw();
    }, { passive: true });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resize();
        if (reduceMotion) draw();
      }, 150);
    });

    document.addEventListener('visibilitychange', () => {
      if (reduceMotion) return;
      if (document.hidden) cancelAnimationFrame(animationId);
      else animationId = requestAnimationFrame(draw);
    });

    resize();
    draw();
  }
})();
