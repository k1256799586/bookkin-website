// All values here are public. Never put credentials in this file.
// SITE_URL includes the project path. A custom domain uses its root URL instead.
export const settings = {
  SITE_URL: 'https://k1256799586.github.io/bookkin-website/',
  APP_STORE_URL: '',
  GOOGLE_PLAY_URL: '',
  TESTFLIGHT_URL: '',
  ANDROID_APK_URL: '',
  ANDROID_APK_VERSION: '',
  // Set true only after confirming a production-signed release (never a debug APK).
  ANDROID_APK_RELEASE_VERIFIED: false,
  WEB_APP_URL: 'https://www.bookkin.net/',
  CONTACT_URL: '',
  PRIVACY_URL: '',
  TERMS_URL: '',
};

function parseHttpsUrl(value, name) {
  let url;
  try {
    if (typeof value !== 'string' || !/^https:\/\//i.test(value) || /[\s\\\u0000-\u001f\u007f]/u.test(value)) throw new Error();
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new Error(`${name} must be a public HTTPS URL without credentials.`);
  }
  return url;
}

function validateContactUrl(value) {
  if (value === '' || value == null) return;
  if (typeof value === 'string' && /^https:/i.test(value)) {
    parseHttpsUrl(value, 'CONTACT_URL');
    return;
  }
  try {
    if (typeof value !== 'string' || !/^mailto:/i.test(value) || /[\s\\\u0000-\u001f\u007f]/u.test(value)) throw new Error();
    const url = new URL(value);
    const address = decodeURIComponent(url.pathname);
    const parts = address.split('@');
    if (url.hash || parts.length !== 2 || /[\u0000-\u0020\u007f]/.test(address)) throw new Error();
    const [local, domain] = parts;
    if (!/^[^\s<>(),;:"\\@]+$/.test(local) || local.split('.').some(part => !part)) throw new Error();
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(domain)) throw new Error();
    // A public contact link can prefill a subject/body, but cannot add recipients.
    for (const [key, text] of url.searchParams) {
      if (!['subject', 'body'].includes(key) || (key === 'subject' && /[\r\n]/.test(text))) throw new Error();
    }
  } catch {
    throw new Error('CONTACT_URL must be a valid HTTPS URL or a mailto link to one email address.');
  }
}

export function resolveSite(input = settings) {
  const url = parseHttpsUrl(input.SITE_URL, 'SITE_URL');
  if (url.search || url.hash) {
    throw new Error('SITE_URL must be a public HTTPS URL without a query, fragment or credentials.');
  }
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  const siteUrl = url.href;
  const base = url.pathname;
  const asset = (path) => `${base}${path.replace(/^\/+/, '')}`;
  const absolute = (path = '') => new URL(path.replace(/^\/+/, ''), siteUrl).href;
  return { siteUrl, origin: url.origin, base, asset, absolute, downloadUrl: `${siteUrl}#download` };
}

export function resolveDownloads(input = settings) {
  for (const key of ['APP_STORE_URL', 'GOOGLE_PLAY_URL', 'TESTFLIGHT_URL', 'ANDROID_APK_URL', 'WEB_APP_URL', 'PRIVACY_URL', 'TERMS_URL']) {
    if (input[key] === '' || input[key] == null) continue;
    parseHttpsUrl(input[key], key);
  }
  validateContactUrl(input.CONTACT_URL);
  const apkVersion = typeof input.ANDROID_APK_VERSION === 'string' ? input.ANDROID_APK_VERSION.trim() : '';
  if (input.ANDROID_APK_URL && (input.ANDROID_APK_RELEASE_VERIFIED !== true || !apkVersion)) {
    throw new Error('A direct APK requires a confirmed production-signed release and its real version.');
  }
  return {
    ios: input.APP_STORE_URL
      ? { kind: 'store', url: input.APP_STORE_URL, label: 'Download on the App Store', note: 'Available for iOS' }
      : input.TESTFLIGHT_URL
        ? { kind: 'beta', url: input.TESTFLIGHT_URL, label: 'Join the iOS beta', note: 'Beta · Requires TestFlight' }
        : { kind: 'unconfigured', url: '', label: '', note: '' },
    android: input.GOOGLE_PLAY_URL
      ? { kind: 'store', url: input.GOOGLE_PLAY_URL, label: 'Get it on Google Play', note: 'Available for Android' }
      : input.ANDROID_APK_URL
        ? { kind: 'apk', url: input.ANDROID_APK_URL, label: 'Download Android APK', note: `Version ${apkVersion} · Direct download` }
        : { kind: 'unconfigured', url: '', label: '', note: '' },
  };
}

// Build-time override is useful for testing a future custom domain.
export const site = resolveSite({ ...settings, SITE_URL: process.env.SITE_URL || settings.SITE_URL });
export const downloads = resolveDownloads(settings);
