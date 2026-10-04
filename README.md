# Bookkin website

A quiet social library. The independent product and download website for Bookkin.

- Repository: <https://github.com/k1256799586/bookkin-website>
- GitHub Pages: <https://k1256799586.github.io/bookkin-website/>
- Existing web app: <https://www.bookkin.net/>

This public repository contains only website code, public copy and reviewed display assets. The Bookkin application, backend, accounts and DigitalOcean deployment are separate.

## Develop

Use Node 24 (see `.nvmrc`).

```sh
npm ci
npm run dev
```

The default development URL includes the project path: `http://127.0.0.1:4321/bookkin-website/`.

```sh
npm run verify
npm run preview
```

`verify` runs Astro type checks, download/configuration tests, a static build, and checks generated asset paths, local fonts, metadata, sitemap and decoded QR destination. The sharing image is generated from the website’s real typography and existing icon during the build.

## Interaction and motion

The product tour is a progressively enhanced set of accessible tabs. Users choose the screen; it never advances automatically. Arrow keys, Home and End move between tabs. A next-chapter control makes the full tour easy to explore. Linked screenshots open a three-screen native gallery with manual selection, left/right keys, a full-size image link, Escape/close/backdrop support and focus restoration. Loading feedback is visible while the real image is decoded; every screen fits the gallery without carrying an old scroll position. Without JavaScript, all three feature sections remain readable and screenshot links open the actual image files. The mobile menu and FAQ use native `details` elements. The menu closes on Escape, selecting a link, clicking outside or tabbing away. Header links identify the current section.

`src/scripts/experience.ts` adds the tour, screenshot preview and a small amount of motion: 500 ms hero entrances with a 90 ms stagger, 440 ms once-only section entrances, 280 ms product transitions, 240 ms gallery entrances and 180 ms menu entrances. Deep links skip the off-screen hero. Controls remain usable throughout. Content is visible by default, and live `prefers-reduced-motion` changes cancel movement. CSS hover effects apply only to devices with a fine pointer; reduced motion also removes hover displacement. Focus rings use contrasting colours for light and dark sections.

## Update the website

| What to change | Location |
|---|---|
| Download links, platform availability, web app, contact and policy URLs | `site.config.mjs` |
| Most product copy, steps and FAQ | `src/content/home.ts` |
| Page composition and hero headline | `src/pages/index.astro` |
| Colour, spacing, responsive layouts and feedback | `src/styles/global.css` |
| Product tabs, image dialog, mobile menu and optional motion | `src/scripts/experience.ts` |
| Actual App screenshots | `src/assets/app-profile.png`, `app-people.png`, `app-home.png` |
| Brand icon and favicon | `public/bookkin-icon.png`, `public/favicon.png` |

All configuration values are public. Never add secrets. Replacement screenshots should use the actual current App with approved or synthetic content. Keep the complete original UI and natural image proportions; document their origin in `ASSETS.md`. Astro generates responsive WebP versions. Do not add invented users, testimonials or capabilities to marketing copy.

### Download states

The public page uses complete product copy and the working web entry. Both iOS and Android download components are visible. Without a URL, each displays a styled, disabled download button that does not navigate. Adding a verified native release URL automatically replaces that button with its working download link; no layout changes are needed.

- Set `APP_STORE_URL` or `GOOGLE_PLAY_URL` to a verified live store URL. Official badge assets will appear automatically.
- If only a public TestFlight invitation exists, set `TESTFLIGHT_URL`; it is labelled **Beta**. App Store takes precedence.
- For a direct Android release, set `ANDROID_APK_URL`, its actual `ANDROID_APK_VERSION`, and `ANDROID_APK_RELEASE_VERIFIED: true` **only after confirming a production-signed release**. Never publish a debug APK. Store the APK in a release channel such as GitHub Releases. Google Play takes precedence.
- Leave unconfigured platforms empty. Their download buttons remain visible but disabled, without prelaunch messaging.
- Store status in the FAQ and getting-started copy changes with these settings.

See [official badge sources and usage](docs/store-badges.md).

### Contact and policy links

`CONTACT_URL`, `PRIVACY_URL` and `TERMS_URL` are intentionally empty. Only configured links appear in the footer. The existing App’s brief policy copy is not copied because it conflicts with current content visibility. `support@bookkin.com` has not been confirmed as a working contact inbox.

Owner inputs still needed: actual native distribution links (when released), a confirmed contact method, approved privacy and terms URLs, and the final website domain. These are not required to deploy the initial informational site.

## Deploy and connect a domain

Push to `main` to run the official GitHub Pages Actions workflow. Pull requests run checks without deployment. The workflow tests both the future domain-root layout and current project path, then uploads only the production build. GitHub Pages Source must be **GitHub Actions**.

- [Hosting, usage rules and troubleshooting](docs/hosting.md)
- [Squarespace DNS, verification and HTTPS instructions](docs/domains.md)
- [Asset provenance](ASSETS.md)
- [Validation and deployment evidence](docs/validation.md)

`SITE_URL` is the complete public website root, including `/bookkin-website/` on default Pages. A future custom domain uses its root, such as `https://download.example.com/`. The build derives base path, canonical, sitemap, sharing image and QR URL from that one value. The QR opens `${SITE_URL}#download`.

For local custom-domain compatibility checks only:

```sh
SITE_URL=https://website.example.com/ npm run verify
```

Rebuild normally before deployment to restore the real production address. The example domain is not a configured or deployed destination. GitHub Actions custom-domain publishing does not require a repository CNAME file; domain binding lives in Pages settings.

The project’s `robots.txt` becomes authoritative when hosted at a custom-domain root. At the default project URL, crawlers look for the owner origin’s `/robots.txt`, not the project subfolder file. The page exposes the correctly prefixed sitemap URL; the owner can submit it to Search Console without creating another repository.

Preserve `bookkin.net`, `www.bookkin.net`, authentication callbacks, share URLs and all email DNS records. This website does not change them.

## Scope and rights

No login, payment, analytics, cookies, data collection, app backend or APK is hosted here. The QR is generated locally at build time. Fonts and images are served from this site; there are no third-party font requests.

Bookkin branding and screenshots belong to their respective rights holders. Public source visibility is not an additional license grant. Font license files are retained in `public/licenses`; store badges follow their publishers’ guidelines.
