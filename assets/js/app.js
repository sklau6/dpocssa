/* T26 role brief — progressive enhancement.
   Everything here is optional: the page is fully readable with JavaScript disabled. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------- Theme ---------------- */
  const STORAGE_KEY = 't26-theme';
  const themeToggle = document.getElementById('themeToggle');

  function readStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function storeTheme(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage can be unavailable in private mode — theme still applies for this visit */
    }
  }

  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }

  applyTheme(readStoredTheme() || systemTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* Follow the OS only while the visitor has not chosen explicitly. */
  const schemeQuery = window.matchMedia('(prefers-color-scheme: light)');
  const onSchemeChange = (event) => {
    if (!readStoredTheme()) applyTheme(event.matches ? 'light' : 'dark');
  };
  if (typeof schemeQuery.addEventListener === 'function') {
    schemeQuery.addEventListener('change', onSchemeChange);
  }

  /* ---------------- Scroll progress ---------------- */
  const progressBar = document.getElementById('progressBar');
  let ticking = false;

  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateProgress();

  /* ---------------- Scroll spy ---------------- */
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    /* Position-based: pick the last section whose top has passed the reading line.
       More predictable than intersection ratios when sections have very different heights. */
    const spy = () => {
      const line = window.scrollY + (window.innerHeight * 0.35);
      let current = sections[0];
      for (const section of sections) {
        if (section.offsetTop <= line) current = section;
      }
      if (window.scrollY < 40) current = sections[0];
      if (current) setActive(current.id);
    };

    let spyTicking = false;
    const requestSpy = () => {
      if (spyTicking) return;
      spyTicking = true;
      requestAnimationFrame(() => { spy(); spyTicking = false; });
    };

    window.addEventListener('scroll', requestSpy, { passive: true });
    window.addEventListener('resize', requestSpy, { passive: true });
    spy();
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealables = Array.from(document.querySelectorAll('.reveal'));

  if (revealables.length && 'IntersectionObserver' in window && !reduceMotion.matches) {
    root.classList.add('js-reveal');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    revealables.forEach((el) => revealObserver.observe(el));

    /* Safety net: content must never stay invisible. Anything near the viewport is
       revealed after a short delay, and everything is revealed before printing. */
    const revealNear = () => {
      const limit = window.innerHeight * 1.6;
      revealables.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        if (el.getBoundingClientRect().top < limit) el.classList.add('is-visible');
      });
    };
    window.setTimeout(revealNear, 2500);
    window.addEventListener('hashchange', () => window.setTimeout(revealNear, 60));
    window.addEventListener('beforeprint', () => revealables.forEach((el) => el.classList.add('is-visible')));
  }

  /* ---------------- Count-up figures ---------------- */
  const counters = Array.from(document.querySelectorAll('[data-count]'));

  function animateCounter(el) {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reduceMotion.matches) {
      el.textContent = String(target);
      return;
    }
    const duration = 900;
    const start = performance.now();
    const from = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------------- Print ---------------- */
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      /* Open every disclosure so the printed brief is complete. */
      document.querySelectorAll('.faq details').forEach((details) => {
        details.open = true;
      });
      window.print();
    });
  }

  /* ---------------- FAQs: one open at a time ---------------- */
  const disclosures = Array.from(document.querySelectorAll('.faq details'));
  disclosures.forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      disclosures.forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });

  /* ---------------- Eligibility self-check ---------------- */
  const checks = Array.from(document.querySelectorAll('[data-check]'));
  const countEl = document.getElementById('scCount');
  const verdictEl = document.getElementById('scVerdict');
  const barEl = document.getElementById('scBar');
  const barWrap = document.getElementById('scBarWrap');
  const hintEl = document.getElementById('scHint');
  const panel = document.getElementById('selfcheck');

  if (checks.length && countEl && barEl) {
    const render = () => {
      const total = checks.length;
      const met = checks.filter((box) => box.checked).length;
      const pct = (met / total) * 100;

      countEl.textContent = String(met);
      barEl.style.width = `${pct}%`;
      if (barWrap) barWrap.setAttribute('aria-valuenow', String(met));

      let verdict = 'Criteria met';
      let hint = 'Select the criteria you can evidence to see how you compare with the brief.';

      if (met === total) {
        verdict = 'Strong match';
        hint = 'All six criteria evidenced — map each one to a concrete example in your submission.';
      } else if (met >= 4) {
        verdict = 'Close match';
        const gap = total - met;
        hint = `${gap} gap${gap > 1 ? 's' : ''} to close. Prepare evidence for the outstanding criteria before applying.`;
      } else if (met >= 1) {
        verdict = 'Gaps remain';
        hint = 'Start with the four experience bands — they carry the stated minimums in the brief.';
      }

      if (verdictEl) verdictEl.textContent = verdict;
      if (hintEl) hintEl.textContent = hint;
      if (panel) panel.classList.toggle('complete', met === total);
    };

    checks.forEach((box) => box.addEventListener('change', render));
    render();
  }
})();
