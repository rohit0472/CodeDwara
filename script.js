document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  const backdrop = document.getElementById('menuBackdrop');
  const closeMenu = () => {
    links?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('menu-open', isOpen);
    });
    links.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }
  backdrop?.addEventListener('click', closeMenu);

  const header = document.querySelector('.top');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  reveals.forEach((element) => observer.observe(element));

  // Highlight the nav link for the section currently in view.
  const navLinks = Array.from(document.querySelectorAll('#navLinks a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (navLinks.length && sections.length && 'IntersectionObserver' in window) {
    const setActive = (id) => {
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    };
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (visible.length) {
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        setActive(visible[0].target.id);
      }
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // A quiet, single tilt interaction on the device showcase — answers cursor movement, doesn't run on its own.
  const stage = document.getElementById('showcaseStage');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (stage && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    // Only the laptop tilts here — the phone already breathes with its own float animation.
    const laptop = stage.querySelector('.device-laptop');
    stage.addEventListener('mousemove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      if (laptop) laptop.style.transform = `rotateY(${x * 6}deg) rotateX(${y * -5}deg)`;
    });
    stage.addEventListener('mouseleave', () => {
      if (laptop) laptop.style.transform = '';
    });
  }
});
