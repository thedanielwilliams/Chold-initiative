# CHOLD Initiative — Website

A launch-ready static website for the **Center for Holistic Livestock Development Initiative**,
built from the organisational profile deck.

No build step, no dependencies, no server-side code. Upload the contents of this folder to any
host and the site works.

---

## 1. Deploying

Pick whichever suits you. In every case, **upload the contents of this folder** (so that
`index.html` sits at the web root).

### Netlify (easiest, free tier, custom domain, HTTPS)
1. Go to <https://app.netlify.com/drop>
2. Drag this whole folder onto the page.
3. The site goes live on a `*.netlify.app` address immediately.
4. In **Site settings → Domain management**, add `choldinitiative.org` and follow the DNS instructions.

`netlify.toml` and `_redirects` are already included — they set caching, security headers and the 404 page.

### Vercel
1. `npm i -g vercel` then run `vercel` from inside this folder, or drag-and-drop at <https://vercel.com/new>.
2. Framework preset: **Other**. Output directory: `.` (the root).

### GitHub Pages
1. Create a repository and push the contents of this folder to the `main` branch.
2. **Settings → Pages → Source: main / (root)**.
3. Add a `CNAME` file containing `choldinitiative.org` if using a custom domain.

### cPanel / traditional shared hosting (common with Nigerian hosts)
1. Log into cPanel → **File Manager** → open `public_html`.
2. Upload a zip of this folder's contents and extract it there.
3. Make sure `index.html` is directly inside `public_html`, not in a subfolder.
4. Enable **AutoSSL / Let's Encrypt** for HTTPS.

### Testing locally before you deploy
```bash
python3 -m http.server 8000
```
Then open <http://localhost:8000>. (Opening `index.html` directly with `file://` also mostly works,
but a local server is more accurate.)

---

## 2. Making the contact forms actually send email

Right now both forms (`contact.html` and `careers.html`) work without a backend: on submit they
open the visitor's email client with the message pre-filled, addressed to
`info@choldinitiative.org`. That is a safe default, but a proper form service is better.

**Recommended: Formspree (free tier is sufficient to start)**

1. Create an account at <https://formspree.io> and add a new form. You get an endpoint that looks
   like `https://formspree.io/f/abcdwxyz`.
2. Open `contact.html`, find:
   ```html
   <form data-validate data-subject="Website enquiry — CHOLD Initiative" data-mailto="info@choldinitiative.org" novalidate>
   ```
   and add the endpoint:
   ```html
   <form data-validate data-endpoint="https://formspree.io/f/abcdwxyz" data-subject="Website enquiry — CHOLD Initiative" novalidate>
   ```
3. Repeat for the form in `careers.html` (use a separate Formspree form so applications and
   partnership enquiries stay in different inboxes).

That is the only change needed — validation, the sending state and the success/error messages are
already wired up in `assets/js/main.js`.

Alternatives that work the same way: **Web3Forms**, **Basin**, **Netlify Forms** (for Netlify,
add `netlify` and `name="contact"` attributes to the `<form>` tag instead of `data-endpoint`).

---

## 3. Things to update before go-live

| Item | Where | Note |
|---|---|---|
| Social media URLs | Footer of every page + `contact.html` | Currently point to the LinkedIn / Facebook / X home pages. Replace with the real CHOLD profiles. |
| Domain in metadata | `<link rel="canonical">`, `og:url`, `sitemap.xml`, `robots.txt` | All assume `https://www.choldinitiative.org`. |
| News articles | `news-*.html` | Three substantive articles are included, written from the profile deck's own analysis. **Review them before publishing** — they are drafts and reflect our reading of the deck, not approved organisational statements. |
| Careers listings | `careers.html` | Six standing opportunity areas. Replace with specific advertised roles when you have them. |
| Photography | `assets/img/` | All images were extracted from the profile deck. Several appear to be licensed stock — **confirm usage rights before go-live**, and swap in CHOLD's own field photography where possible. See section 5. |
| Privacy notice | `privacy.html` | A solid starting draft. Have it reviewed by your legal consultant against the Nigeria Data Protection Act. |
| Phone number | Footer + `contact.html` + JSON-LD in every page `<head>` | Currently `+234 (081) 7111 1551` as given in the deck. |

---

## 4. File structure

```
index.html                      Home
about.html                      About, values, sector context, challenges, objectives
what-we-do.html                 8 technical capabilities (interactive explorer)
impact.html                     2025–2030 impact framework with animated counters
leadership.html                 Board of Trustees, executive, operational team
news.html                       News & insights listing
news-traditional-leadership.html
news-livestock-data-gap.html
news-strategy-2025-2030.html
careers.html                    Opportunity areas + expression of interest form
contact.html                    Enquiry form, contact details, partnership pathways, FAQ
privacy.html                    Privacy notice
404.html                        Not-found page

assets/css/main.css             Complete design system (tokens at the top)
assets/js/main.js               Nav, scroll reveal, counters, tabs, accordions, forms
assets/img/                     Photography, portraits, logo marks, favicon
assets/fonts/                   Self-hosted Plus Jakarta Sans + Inter (woff2)
assets/docs/                    Downloadable organisational profile PDF

netlify.toml, _redirects        Netlify configuration
robots.txt, sitemap.xml         Search engine directives
site.webmanifest                PWA / add-to-homescreen metadata
```

---

## 5. Editing the site

### Colours and typography
Everything is driven by CSS custom properties at the top of `assets/css/main.css`:

```css
--green-700: #13501B;   /* primary, sampled from the CHOLD logo */
--gold-500:  #C9922B;   /* accent */
--sand:      #FAF8F2;   /* section tint */
```

Change these and the whole site follows.

### Adding a news article
Copy any `news-*.html` file, change the `<title>`, `<meta name="description">`, the `<h1>` and the
body content, then add a card to the listing grid in `news.html` and a `<url>` entry in
`sitemap.xml`.

### Replacing photography
Drop a new file into `assets/img/` using the same filename, or update the `src` in the relevant
page. Recommended sizes:

- Hero / wide banners: **1600px wide**, JPEG quality ~84
- Card and section images: **900px wide**
- Portraits: **640 × 800** (4:5). The CSS crops to the top of the frame, so leave headroom.

### The build helper (optional)
The pages were generated from `../build/pages/*.html` by `../build/build.py`, which wraps each page body
in the shared `<head>`, header and footer. **You do not need it** — the HTML files in this folder
are complete and standalone. But if you would rather change the navigation or footer in one place
than in twelve, edit `../build/build.py` and run (from the folder containing both `build/` and `website/`):

```bash
cd build && python3 build.py
```

If you edit the generated HTML directly instead, that is fine too — just don't run the build
afterwards, or it will overwrite your changes.

---

## 6. What's already handled

- **Responsive** from 320px to ultra-wide; tested at 390px and 1440px.
- **Accessibility** — skip link, landmarks, one `<h1>` per page, ARIA tabs and accordions with full
  keyboard support, visible focus rings, alt text on every image, `prefers-reduced-motion` respected.
- **SEO** — unique titles and descriptions, canonical URLs, Open Graph and Twitter cards,
  `NGO` JSON-LD structured data, sitemap and robots.txt.
- **Performance** — no framework, no jQuery, self-hosted subset fonts (~128KB total), lazy-loaded
  images below the fold, long-cache headers on assets. Nothing is fetched from a third-party CDN,
  which matters on slower Nigerian connections and avoids third-party data transfer.
- **Offline-safe** — the site has zero external runtime dependencies.
