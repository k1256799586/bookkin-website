// Optional enhancements. The server-rendered page and image links work without this file.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const activeAnimations = new Set<Animation>();
const elementAnimations = new WeakMap<Element, Animation>();
const easing = 'cubic-bezier(.2,.7,.2,1)';

function animateIn(element: Element, duration = 400, distance = 10) {
  elementAnimations.get(element)?.cancel();
  if (reducedMotion.matches || typeof element.animate !== 'function') return;
  try {
    const animation = element.animate(
      [{ opacity: 0.7, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'translateY(0)' }],
      { duration, easing },
    );
    activeAnimations.add(animation);
    elementAnimations.set(element, animation);
    void animation.finished.catch(() => {}).finally(() => {
      activeAnimations.delete(animation);
      if (elementAnimations.get(element) === animation) elementAnimations.delete(element);
    });
  } catch {
    // The underlying content stays visible if the animation API is unavailable.
  }
}

function setupTour(root: HTMLElement) {
  const controls = root.querySelector<HTMLElement>('[data-tour-controls]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-tour-tab]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tour-panel]'));
  if (!controls || !tabs.length || tabs.length !== panels.length) return;
  const orderedPanels = tabs.map((tab, index) => panels.find(panel =>
    tab.dataset.index === String(index)
    && tab.id === `tour-tab-${index}`
    && panel.id === `tour-panel-${index}`
    && tab.getAttribute('aria-controls') === panel.id,
  ));
  if (orderedPanels.some(panel => !panel)) return;
  const matchedPanels = orderedPanels as HTMLElement[];
  let activeIndex = 0;

  function select(index: number, moveFocus = false, animate = true) {
    if (!tabs[index]) return;
    const changed = index !== activeIndex;
    tabs.forEach((tab, tabIndex) => {
      tab.setAttribute('aria-selected', String(tabIndex === index));
      tab.tabIndex = tabIndex === index ? 0 : -1;
      matchedPanels[tabIndex].hidden = tabIndex !== index;
    });
    activeIndex = index;
    if (moveFocus) tabs[index].focus({ preventScroll: true });
    if (changed && animate) animateIn(matchedPanels[index], 280, 8);
  }

  tabs.forEach((tab, index) => {
    tab.type = 'button';
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      let next: number;
      switch (event.key) {
        case 'ArrowRight': next = (index + 1) % tabs.length; break;
        case 'ArrowLeft': next = (index + tabs.length - 1) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      select(next, true);
    });
    tab.setAttribute('role', 'tab');
    matchedPanels[index].setAttribute('role', 'tabpanel');
    matchedPanels[index].setAttribute('aria-labelledby', tab.id);
    matchedPanels[index].tabIndex = 0;
  });
  controls.setAttribute('role', 'tablist');
  if (!controls.hasAttribute('aria-label')) controls.setAttribute('aria-label', 'Explore Bookkin');
  select(0, false, false);
  root.dataset.enhanced = 'true';
  controls.hidden = false;
}

function setupPreview() {
  const dialog = document.querySelector<HTMLDialogElement>('dialog#screen-preview');
  const heading = dialog?.querySelector<HTMLElement>('[data-preview-heading]');
  const image = dialog?.querySelector<HTMLImageElement>('img[data-preview-image]');
  const closeButton = dialog?.querySelector<HTMLButtonElement>('button[data-preview-close]');
  if (!dialog || !heading || !image || !closeButton || typeof dialog.showModal !== 'function') return;
  let opener: HTMLAnchorElement | null = null;
  let request = 0;

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('cancel', () => { request += 1; });
  dialog.addEventListener('close', () => {
    request += 1;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  document.addEventListener('click', event => {
    if (!dialog.open && event.target instanceof Element && !event.target.closest('a[data-preview]')) request += 1;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialog.open) request += 1;
  });

  document.querySelectorAll<HTMLAnchorElement>('a[data-preview]').forEach(anchor => {
    anchor.addEventListener('click', async event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (!['https:', 'http:'].includes(url.protocol)) return;
      event.preventDefault();
      const currentRequest = ++request;
      try {
        // Decode the real linked asset first; never open an empty image frame.
        const loadedImage = new Image();
        const loaded = new Promise<void>((resolve, reject) => {
          loadedImage.onload = () => resolve();
          loadedImage.onerror = () => reject(new Error('Image could not be loaded.'));
        });
        loadedImage.src = url.href;
        await loaded;
        if (typeof loadedImage.decode === 'function') await loadedImage.decode();
        if (currentRequest !== request || !anchor.isConnected) return;
        heading.textContent = anchor.dataset.previewTitle || 'Bookkin app preview';
        const sourceImage = anchor.querySelector('img')
          || anchor.closest('[data-tour-panel]')?.querySelector<HTMLImageElement>('a[data-preview] img');
        image.alt = sourceImage?.alt || `${heading.textContent} — actual Bookkin interface with sample content.`;
        image.src = url.href;
        opener = anchor;
        dialog.showModal();
      } catch {
        if (currentRequest !== request) return;
        if (dialog.open) dialog.close();
        // Preserve the ordinary image-link destination if enhancement fails.
        window.location.assign(url.href);
      }
    });
  });
}

function setupMobileMenu() {
  const menu = document.querySelector<HTMLDetailsElement>('details.mobile-menu');
  const summary = menu?.querySelector('summary');
  if (!menu || !summary) return;
  menu.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a[href]')) menu.open = false;
  });
  document.addEventListener('pointerdown', event => {
    if (menu.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open || document.querySelector('dialog[open]')) return;
    menu.open = false;
    summary.focus({ preventScroll: true });
    event.preventDefault();
  });
  // Follow the CSS visibility instead of duplicating its responsive breakpoint.
  const closeIfHidden = () => {
    if (menu.open && window.getComputedStyle(menu).display === 'none') menu.open = false;
  };
  window.addEventListener('resize', closeIfHidden, { passive: true });
  closeIfHidden();
}

function setupEntrances() {
  document.querySelectorAll<HTMLElement>('[data-enter]').forEach((element, index) => {
    if (index < 2) animateIn(element, 500, 12);
  });
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      animateIn(entry.target, 440, 12);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
}

function start() {
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) activeAnimations.forEach(animation => animation.cancel());
  });
  const setups = [
    ...Array.from(document.querySelectorAll<HTMLElement>('[data-tour]'), root => () => setupTour(root)),
    setupPreview,
    setupMobileMenu,
    setupEntrances,
  ];
  setups.forEach(setup => {
    try { setup(); } catch { /* A failed optional enhancement must not stop the others. */ }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();

export {};
