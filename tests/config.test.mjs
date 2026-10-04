import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSite, resolveDownloads } from '../site.config.mjs';

// Test release states independently of whichever links the owner publishes later.
const unpublished = {
  APP_STORE_URL: '', GOOGLE_PLAY_URL: '', TESTFLIGHT_URL: '', ANDROID_APK_URL: '',
  ANDROID_APK_VERSION: '', ANDROID_APK_RELEASE_VERIFIED: false,
  WEB_APP_URL: '', CONTACT_URL: '', PRIVACY_URL: '', TERMS_URL: '',
};

test('project URLs include the base exactly once', () => {
  const site = resolveSite({ SITE_URL: 'https://k1256799586.github.io/bookkin-website' });
  assert.equal(site.base, '/bookkin-website/');
  assert.equal(site.asset('/favicon.png'), '/bookkin-website/favicon.png');
  assert.equal(site.absolute('/og.png'), 'https://k1256799586.github.io/bookkin-website/og.png');
  assert.equal(site.downloadUrl, 'https://k1256799586.github.io/bookkin-website/#download');
});
test('custom domain uses root paths', () => {
  const site = resolveSite({ SITE_URL: 'https://website.example.com/' });
  assert.equal(site.base, '/');
  assert.equal(site.asset('favicon.png'), '/favicon.png');
  assert.equal(site.absolute('sitemap-index.xml'), 'https://website.example.com/sitemap-index.xml');
});
test('site config rejects insecure or ambiguous URLs', () => {
  for (const SITE_URL of ['http://example.com', 'https://example.com/?x=1', 'https://example.com/#download', 'https://u:p@example.com', 'https://', 'https:example.com', 'https://example.com/\n']) {
    assert.throws(() => resolveSite({ SITE_URL }));
  }
});
test('unpublished platforms do not produce download links', () => {
  const result = resolveDownloads(unpublished);
  assert.equal(result.ios.kind, 'soon');
  assert.equal(result.ios.url, '');
  assert.equal(result.android.kind, 'soon');
  assert.equal(result.android.url, '');
});
test('beta is labelled and official store takes precedence', () => {
  const input = { ...unpublished, TESTFLIGHT_URL:'https://testflight.apple.com/join/example' };
  assert.equal(resolveDownloads(input).ios.kind, 'beta');
  input.APP_STORE_URL = 'https://apps.apple.com/app/id123456789';
  assert.equal(resolveDownloads(input).ios.kind, 'store');
  assert.equal(resolveDownloads(input).ios.url, input.APP_STORE_URL);
});
test('an APK cannot be published without release confirmation and version', () => {
  const input = { ...unpublished, ANDROID_APK_URL:'https://github.com/example/app/releases/download/v1/app.apk' };
  assert.throws(() => resolveDownloads(input), /production-signed/);
  assert.throws(() => resolveDownloads({...input, ANDROID_APK_RELEASE_VERIFIED:true}), /real version/);
  for (const ANDROID_APK_RELEASE_VERIFIED of [false, 'false', 'true', 1, {}, null]) {
    assert.throws(() => resolveDownloads({ ...input, ANDROID_APK_VERSION:'1.0.0', ANDROID_APK_RELEASE_VERIFIED }), /production-signed/);
  }
  for (const ANDROID_APK_VERSION of ['', '   ', '\n\t', 100, null]) {
    assert.throws(() => resolveDownloads({ ...input, ANDROID_APK_RELEASE_VERIFIED:true, ANDROID_APK_VERSION }), /real version/);
  }
  const confirmed = { ...input, ANDROID_APK_RELEASE_VERIFIED:true, ANDROID_APK_VERSION:' 1.0.0 ' };
  assert.equal(resolveDownloads(confirmed).android.kind, 'apk');
  assert.equal(resolveDownloads(confirmed).android.note, 'Version 1.0.0 · Direct download');
  assert.equal(resolveDownloads({...confirmed, GOOGLE_PLAY_URL:'https://play.google.com/store/apps/details?id=example.app'}).android.kind, 'store');
});
test('download URLs cannot carry unsafe schemes or credentials', () => {
  for (const APP_STORE_URL of ['javascript:alert(1)', 'http://example.com', 'https://', 'https:example.com', 'https://example.com/\n', ' https://example.com', true]) {
    assert.throws(() => resolveDownloads({...unpublished, APP_STORE_URL}));
  }
  assert.throws(() => resolveDownloads({...unpublished, WEB_APP_URL:'https://user:password@example.com/'}));
});
test('contact links accept a real HTTPS form or one email address', () => {
  for (const CONTACT_URL of ['https://example.com/contact?from=bookkin#form', 'mailto:support@example.com', 'mailto:hello+bookkin@example.co.uk?subject=Bookkin%20help&body=Hello%0Athere']) {
    assert.doesNotThrow(() => resolveDownloads({...unpublished, CONTACT_URL}));
  }
});
test('contact links reject broken URLs, credentials and injected recipients', () => {
  for (const CONTACT_URL of ['https://', 'https://?x', 'https://user:password@example.com/', 'https:example.com', 'http://example.com', 'javascript:alert(1)', 'https://example.com/\n', true, 'mailto:', 'mailto:not-an-email', 'mailto:support@', 'mailto:support@-example.com', 'mailto:.support@example.com', 'mailto:a..b@example.com', 'mailto:a@example.com,b@example.com', 'mailto:a@example.com?bcc=b@example.com', 'mailto:a@example.com?subject=Hi%0D%0ABcc:b@example.com', 'mailto:a%0D%0A@example.com', 'mailto:a%00@example.com', 'mailto:a%ZZ@example.com', 'mailto:a@example.com#fragment']) {
    assert.throws(() => resolveDownloads({...unpublished, CONTACT_URL}), /CONTACT_URL/);
  }
});
