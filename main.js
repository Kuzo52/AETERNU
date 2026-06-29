/**
 * AETERNUM — compact site interactions
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.getElementById('header');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const sections = document.querySelectorAll('[data-section]');
  const navLinks = document.querySelectorAll('[data-nav]');

  function updateHeader() {
    header?.classList.toggle('is-scrolled', window.scrollY > 40);
  }

  function toggleMenu(open) {
    const isOpen = open ?? !menuBtn.classList.contains('is-active');
    menuBtn.classList.toggle('is-active', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.classList.toggle('is-open', isOpen);
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  menuBtn?.addEventListener('click', () => toggleMenu());

  function scrollToSection(target) {
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 56;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      toggleMenu(false);
      scrollToSection(target);
    });
  });

  document.getElementById('topBtn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  function updateActiveNav() {
    const offset = window.innerHeight * 0.35;
    let currentId = '';
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= offset && rect.bottom > offset) currentId = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (Number.isNaN(target)) return;
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round((1 - Math.pow(1 - progress, 4)) * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('[data-count]').forEach((el) => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        animateCounter(el);
        obs.unobserve(el);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
  });

  const parallaxEls = document.querySelectorAll('[data-parallax]');
  function updateParallax() {
    if (prefersReducedMotion) return;
    const viewH = window.innerHeight;
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewH) return;
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      const center = rect.top + rect.height / 2 - viewH / 2;
      el.style.transform = `translate3d(0, ${(center * speed * -1).toFixed(1)}px, 0)`;
    });
  }

  const imageFallbacks = {
    'hero': ['images/hero-1600.jpg', 'images/hero-800.jpg'],
    'craft': ['images/craft-1200.jpg', 'images/craft-800.jpg'],
    'noctis': ['images/noctis-1200.jpg', 'images/noctis-800.jpg'],
    'aeterna': ['images/aeterna-1200.jpg', 'images/aeterna-800.jpg'],
  };

  function markImageLoaded(img) {
    img.classList.add('is-loaded');
    img.classList.remove('is-error');
  }

  function markImageError(img) {
    img.classList.add('is-loaded', 'is-error');
  }

  function bindImage(img) {
    if (img.complete && img.naturalHeight > 0) {
      markImageLoaded(img);
      return;
    }

    const onLoad = () => {
      img.removeEventListener('error', onError);
      markImageLoaded(img);
    };

    const onError = () => {
      const key = img.dataset.fallback;
      const list = key ? imageFallbacks[key] : null;
      const current = img.getAttribute('src') || '';

      if (list && !img.dataset.fallbackTried) {
        const next = list.find((src) => src !== current);
        if (next) {
          img.dataset.fallbackTried = '1';
          img.removeAttribute('srcset');
          img.removeAttribute('sizes');
          img.src = next;
          return;
        }
      }

      img.removeEventListener('load', onLoad);
      markImageError(img);
    };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
  }

  function initImages() {
    document.querySelectorAll('img').forEach(bindImage);
  }

  initImages();

  const hero = document.querySelector('.hero');
  function onLoad() {
    if (hero) {
      hero.classList.add('is-loaded');
      hero.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
    }
    updateHeader();
    updateActiveNav();
    updateParallax();
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateActiveNav();
      updateParallax();
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener('resize', updateParallax, { passive: true });
  document.readyState === 'complete' ? onLoad() : window.addEventListener('load', onLoad);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('is-open')) toggleMenu(false);
  });
})();
