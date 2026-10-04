// Optional enhancements. The server-rendered page and image links work without this file.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const activeAnimations = new Set<Animation>();
const elementAnimations = new WeakMap<Element, Animation>();
const easing = 'cubic-bezier(.2,.7,.2,1)';

function animateIn(element: Element, duration = 400, distance = 10, delay = 0) {
  elementAnimations.get(element)?.cancel();
  if (reducedMotion.matches || typeof element.animate !== 'function') return;
  try {
    const animation = element.animate(
      [{ opacity: 0.7, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'translateY(0)' }],
      { duration, easing, delay, fill: 'backwards' },
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
  const frame = dialog.querySelector<HTMLElement>('[data-preview-frame]') || dialog;
  const count = dialog.querySelector<HTMLElement>('[data-preview-count]');
  const originalLink = dialog.querySelector<HTMLAnchorElement>('[data-preview-original]');
  const status = dialog.querySelector<HTMLElement>('[data-preview-status]');
  const selectors = Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-preview-select]'));
  type Screen = { url: string; title: string; alt: string };
  const sources: Screen[] = [];
  document.querySelectorAll<HTMLElement>('[data-tour-panel]').forEach(panel => {
    const link = panel.querySelector<HTMLAnchorElement>('a[data-preview]');
    if (!link || sources.some(source => source.url === link.href)) return;
    const url = new URL(link.href, window.location.href);
    if (!['https:', 'http:'].includes(url.protocol)) return;
    const title = link.dataset.previewTitle || 'Bookkin app preview';
    sources.push({ url: url.href, title, alt: panel.querySelector('a[data-preview] img')?.getAttribute('alt') || `${title} — actual Bookkin interface with sample content.` });
  });
  let opener: HTMLAnchorElement | null = null;
  let loadingAnchor: HTMLAnchorElement | null = null;
  let request = 0;
  let activeIndex = -1;
  let requestedIndex = -1;

  function clearLoading() {
    loadingAnchor?.classList.remove('is-loading');
    loadingAnchor?.removeAttribute('aria-busy');
    loadingAnchor = null;
    frame.classList.remove('is-loading');
    frame.removeAttribute('aria-busy');
  }

  function cancelRequest() {
    request += 1;
    requestedIndex = activeIndex;
    clearLoading();
  }

  async function loadScreen(source: Screen) {
    // Decode the actual linked asset first; keep the current screen until it is ready.
    const loadedImage = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      loadedImage.onload = () => resolve();
      loadedImage.onerror = () => reject(new Error('Image could not be loaded.'));
    });
    loadedImage.src = source.url;
    await loaded;
    if (typeof loadedImage.decode === 'function') await loadedImage.decode();
  }

  function updateOriginal(source: Screen) {
    if (!originalLink) return;
    originalLink.href = source.url;
    originalLink.setAttribute('aria-label', `Open the full-size image: ${source.title} (opens in a new tab)`);
  }

  const showScreen = (source: Screen, index: number) => {
    heading.textContent = source.title;
    image.alt = source.alt;
    image.src = source.url;
    activeIndex = index;
    requestedIndex = index;
    selectors.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.index) === index)));
    if (count) count.textContent = index < 0 ? '' : `${String(index + 1).padStart(2, '0')} / ${String(sources.length).padStart(2, '0')}`;
    updateOriginal(source);
    dialog.scrollTop = 0;
    frame.scrollTop = 0;
  };

  const selectScreen = async (index: number) => {
    const source = sources[index];
    if (!dialog.open || !source) return;
    cancelRequest();
    const currentRequest = request;
    requestedIndex = index;
    frame.classList.add('is-loading');
    frame.setAttribute('aria-busy', 'true');
    if (status) status.textContent = `Loading ${source.title.toLowerCase()}…`;
    try {
      await loadScreen(source);
      if (currentRequest !== request || !dialog.open) return;
      showScreen(source, index);
      if (status) status.textContent = `${source.title}. Screen ${index + 1} of ${sources.length}.`;
      animateIn(image, 220, 5);
    } catch {
      if (currentRequest !== request || !dialog.open) return;
      requestedIndex = activeIndex;
      updateOriginal(source);
      if (status) status.textContent = `Couldn’t load ${source.title.toLowerCase()}. Open the full-size image to try again.`;
    } finally {
      if (currentRequest === request) clearLoading();
    }
  };

  selectors.forEach(button => {
    const index = Number(button.dataset.index);
    if (!Number.isInteger(index) || !sources[index]) return;
    button.type = 'button';
    button.addEventListener('click', () => { void selectScreen(index); });
  });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !sources.length) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    void selectScreen((Math.max(requestedIndex, 0) + direction + sources.length) % sources.length);
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('cancel', cancelRequest);
  dialog.addEventListener('close', () => {
    cancelRequest();
    if (status) status.textContent = '';
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  document.addEventListener('click', event => {
    if (!dialog.open && event.target instanceof Element && !event.target.closest('a[data-preview]')) cancelRequest();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialog.open) cancelRequest();
  });

  document.querySelectorAll<HTMLAnchorElement>('a[data-preview]').forEach(anchor => {
    anchor.addEventListener('click', async event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (!['https:', 'http:'].includes(url.protocol)) return;
      event.preventDefault();
      cancelRequest();
      const currentRequest = request;
      loadingAnchor = anchor;
      anchor.classList.add('is-loading');
      anchor.setAttribute('aria-busy', 'true');
      const index = sources.findIndex(source => source.url === url.href);
      const title = anchor.dataset.previewTitle || 'Bookkin app preview';
      const source = sources[index] || { url: url.href, title, alt: anchor.querySelector('img')?.alt || `${title} — actual Bookkin interface with sample content.` };
      try {
        await loadScreen(source);
        if (currentRequest !== request || !anchor.isConnected) return;
        showScreen(source, index);
        if (status) status.textContent = '';
        opener = anchor;
        dialog.showModal();
        closeButton.focus({ preventScroll: true });
        dialog.scrollTop = 0;
        frame.scrollTop = 0;
        animateIn(dialog, 240, 8);
      } catch {
        if (currentRequest !== request) return;
        if (dialog.open) dialog.close();
        // Preserve the ordinary image-link destination if enhancement fails.
        window.location.assign(url.href);
      } finally {
        if (currentRequest === request) clearLoading();
      }
    });
  });
}

function setupMobileMenu() {
  const menu = document.querySelector<HTMLDetailsElement>('details.mobile-menu');
  const summary = menu?.querySelector('summary');
  if (!menu || !summary) return;
  menu.addEventListener('toggle', () => {
    const navigation = menu.querySelector('nav');
    if (menu.open && navigation) animateIn(navigation, 180, 5);
  });
  menu.addEventListener('focusout', () => {
    // Wait for the next element to receive focus before deciding whether to close.
    queueMicrotask(() => {
      if (menu.open && !menu.contains(document.activeElement)) menu.open = false;
    });
  });
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

function setupCurrentSection() {
  if (!('IntersectionObserver' in window)) return;
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-nav-section]'));
  const sections = [...new Set(links.map(link => link.dataset.navSection))]
    .map(id => id ? document.getElementById(id) : null)
    .filter((section): section is HTMLElement => !!section);
  if (!sections.length) return;
  const visible = new Set<Element>();
  const update = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    const current = sections.filter(section => visible.has(section)).at(-1);
    links.forEach(link => {
      if (current && link.dataset.navSection === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  let observer: IntersectionObserver | undefined;
  const observe = () => {
    observer?.disconnect();
    visible.clear();
    // Percentage root margins use viewport width; pixels keep the reading band
    // proportional to height on both a wide desktop and a narrow phone.
    observer = new IntersectionObserver(update, {
      rootMargin: `-${Math.round(window.innerHeight * 0.2)}px 0px -${Math.round(window.innerHeight * 0.65)}px 0px`,
      threshold: 0,
    });
    sections.forEach(section => observer?.observe(section));
  };
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(observe);
  }, { passive: true });
  observe();
}

function setupEntrances() {
  const enteringAtTop = !window.location.hash || window.location.hash === '#main';
  document.querySelectorAll<HTMLElement>('[data-enter]').forEach((element, index) => {
    const bounds = element.getBoundingClientRect();
    if (enteringAtTop && index < 2 && bounds.bottom > 0 && bounds.top < window.innerHeight) animateIn(element, 500, 12, index * 90);
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
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) activeAnimations.forEach(animation => animation.cancel());
  });
  const setups = [
    ...Array.from(document.querySelectorAll<HTMLElement>('[data-tour]'), root => () => setupTour(root)),
    setupPreview,
    setupMobileMenu,
    setupCurrentSection,
    setupEntrances,
  ];
  setups.forEach(setup => {
    try { setup(); } catch { /* A failed optional enhancement must not stop the others. */ }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();

export {};
