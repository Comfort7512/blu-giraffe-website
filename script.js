/* ================================================
   BLU GIRAFFE SARONA — script.js
   Sections:
   1. Navbar scroll + mobile menu
   2. Image Slider (manual + auto + swipe)
   3. Features infinite carousel (touch)
   4. Reveal on scroll (IntersectionObserver)
   5. Contact form (UI feedback only)
   6. Mobile sticky CTA visibility
   ================================================ */

'use strict';

/* -----------------------------------------------
   1. NAVBAR — scroll style & mobile hamburger
----------------------------------------------- */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!navbar) return;

  /* Add .scrolled class when page scrolls beyond navbar height */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* Hamburger toggle */
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      navLinks.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });

    /* Close menu when a link is tapped */
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }
})();


/* -----------------------------------------------
   2. IMAGE SLIDER
   - Manual prev/next
   - Dot navigation
   - Auto-advance every 5 seconds
   - Pause on hover
   - Touch/swipe support
----------------------------------------------- */
(function initSlider() {
  const track   = document.getElementById('sliderTrack');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const dotsWrap= document.getElementById('sliderDots');
  if (!track) return;

  const slides  = Array.from(track.querySelectorAll('.slider__slide'));
  const total   = slides.length;
  if (total === 0) return;

  let current   = 0;
  let autoTimer = null;
  const AUTO_DELAY = 5000; // 5 seconds

  /* ---- Build dots ---- */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider__dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.slider__dot'));

  /* ---- Core goTo function ---- */
  function goTo(index) {
    // Clamp index with wraparound
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    // Update dots
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  function goNext() { goTo(current + 1); }
  function goPrev() { goTo(current - 1); }

  prevBtn.addEventListener('click', () => { goPrev(); resetAuto(); });
  nextBtn.addEventListener('click', () => { goNext(); resetAuto(); });

  /* ---- Auto-advance ---- */
  function startAuto() {
    autoTimer = setInterval(goNext, AUTO_DELAY);
  }
  function stopAuto() {
    clearInterval(autoTimer);
  }
  function resetAuto() {
    stopAuto();
    startAuto();
  }
  startAuto();

  /* Pause on hover */
  const sliderEl = track.closest('.slider');
  sliderEl.addEventListener('mouseenter', stopAuto);
  sliderEl.addEventListener('mouseleave', startAuto);

  /* ---- Touch / swipe support ---- */
  let touchStartX = null;
  sliderEl.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  sliderEl.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;

    if (Math.abs(deltaX) < 40) return; // ignore tiny swipes
    if (deltaX < 0) { goNext(); resetAuto(); }
    else            { goPrev(); resetAuto(); }
  }, { passive: true });

  /* ---- Keyboard support ---- */
  sliderEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goPrev(); resetAuto(); }
    if (e.key === 'ArrowRight') { goNext(); resetAuto(); }
  });
})();


/* -----------------------------------------------
   3. FEATURES INFINITE CAROUSEL
   - Clone list for seamless loop
   - Touch drag support
----------------------------------------------- */
(function initFeaturesCarousel() {
  const list     = document.getElementById('featuresList');
  const carousel = document.getElementById('featuresCarousel');
  if (!list || !carousel) return;

  /* Clone the list once → creates a seamless infinite loop.
     CSS animation moves translateX from 0 to -50% so we need 2 copies. */
  const clone = list.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  carousel.appendChild(clone);

  /* ---- Touch drag to scroll ---- */
  let isDragging   = false;
  let dragStartX   = 0;
  let scrollAtStart = 0;

  /* We switch to scrollLeft-based approach when user is dragging */
  carousel.addEventListener('mousedown', onDragStart);
  carousel.addEventListener('touchstart', onDragStart, { passive: true });
  document.addEventListener('mouseup',   onDragEnd);
  document.addEventListener('touchend',  onDragEnd,  { passive: true });
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('touchmove', onDragMove, { passive: true });

  function onDragStart(e) {
    isDragging    = true;
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    dragStartX    = clientX;
    scrollAtStart = carousel.scrollLeft;
    list.style.animationPlayState  = 'paused';
    clone.style.animationPlayState = 'paused';
  }
  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    list.style.animationPlayState  = '';
    clone.style.animationPlayState = '';
  }
  function onDragMove(e) {
    if (!isDragging) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    // deliberate: drag handled by animation pause + native scroll
    void clientX;
  }
})();


/* -----------------------------------------------
   4. REVEAL ON SCROLL (IntersectionObserver)
   Elements with .reveal class animate in when
   they enter the viewport.
----------------------------------------------- */
(function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  /* Add stagger delay to children when parent has .reveal */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target); // animate only once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach((el, i) => {
    /* Stagger sibling reveals inside the same parent section */
    const siblings = Array.from(el.parentElement.querySelectorAll('.reveal'));
    const sibIdx   = siblings.indexOf(el);
    el.style.transitionDelay = `${sibIdx * 0.1}s`;
    observer.observe(el);
  });
})();


/* -----------------------------------------------
   5. CONTACT FORM (UI feedback only — no backend)
----------------------------------------------- */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name  = form.fullName.value.trim();
    const email = form.email.value.trim();
    const msg   = form.message.value.trim();

    /* Basic validation */
    if (!name || !email || !msg) {
      showNote('Please fill in your name, email and message.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNote('Please enter a valid email address.', 'error');
      return;
    }

    /* Success state */
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled    = true;

    /* Simulate async send (replace with actual fetch/EmailJS/etc.) */
    setTimeout(() => {
      showNote('✓ Inquiry received! We\'ll be in touch shortly.', 'success');
      form.reset();
      submitBtn.textContent = 'Send Inquiry';
      submitBtn.disabled    = false;
    }, 1200);
  });

  function showNote(text, type) {
    note.textContent = text;
    note.style.color = type === 'error' ? '#E53E3E' : 'var(--green-wa-dk)';
  }
})();


/* -----------------------------------------------
   6. MOBILE STICKY CTA visibility
   Hide when the contact section is in view
   (user already sees the real CTA buttons)
----------------------------------------------- */
(function initMobileCta() {
  const cta     = document.getElementById('mobileCta');
  const contact = document.getElementById('contact');
  if (!cta || !contact) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      cta.style.opacity    = entry.isIntersecting ? '0' : '1';
      cta.style.pointerEvents = entry.isIntersecting ? 'none' : 'auto';
    });
  }, { threshold: 0.15 });

  obs.observe(contact);
})();


/* -----------------------------------------------
   7. SMOOTH SCROLL offset for fixed navbar
----------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();

    const navH   = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h')) || 72;
    const top    = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
