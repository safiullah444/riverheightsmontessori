# River Heights Montessori website

Marketing site for River Heights Montessori, 333 Wilton Street, Winnipeg.
Built with [Astro](https://astro.build) as a static site, with one serverless
function (Netlify Functions) that emails Book a Tour requests through
[Resend](https://resend.com).

## Pages

| URL | Source |
|---|---|
| `/` | `src/pages/index.astro` + `src/content/pages/index.html` |
| `/programs/` | `src/pages/programs.astro` + `src/content/pages/programs.html` |
| `/about/` | `src/pages/about.astro` + `src/content/pages/about.html` |
| `/meet-the-team/` | `src/pages/meet-the-team.astro` + `src/content/pages/meet-the-team.html` |
| `/admissions/` | `src/pages/admissions.astro` + `src/content/pages/admissions.html` |
| `/contact/` | `src/pages/contact.astro` + `src/content/pages/contact.html` |
| `/privacy/` | `src/pages/privacy.astro` (draft, needs review) |

- **Page copy and layout** live in `src/content/pages/*.html`. Edit the HTML directly.
- **Menu and footer** are shared components in `src/components/Nav.astro` and `Footer.astro`.
- **Styles**: `src/styles/site.css` (the approved design) and `src/styles/additions.css` (production additions).
- **Images** are in `public/images/`. Replace a file with one of the same name to swap a photo.

## Book a Tour form

- **Form UI** is the 4-step form in `src/content/pages/admissions.html` (inside `#inquiry`). Its logic is in `public/js/tour-form.js`, rendered by the small templating runtime in `public/js/dc-runtime.js`.
- **Backend** is `netlify/functions/tour-request.mts`, served at `POST /api/tour-request`. It validates the request, rate-limits by IP, drops spam (honeypot field plus a minimum fill time), then sends:
  1. a lead email to the centre, tagged HOT / WARM / NURTURE, with reply-to set to the parent;
  2. a confirmation email to the parent.

### Environment variables

Set these in Netlify (Site configuration > Environment variables, scope must include **Functions**). See `.env.example`.

| Variable | Example | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | From the Resend dashboard |
| `TOUR_TO_EMAIL` | `safi@example.com,info@example.com` | Comma-separated recipients for leads |
| `TOUR_FROM_EMAIL` | `River Heights Montessori <hello@your-domain.ca>` | Must be on a domain verified in Resend |
| `TOUR_REPLY_TO` | `info@riverheightschildcare.com` | Optional. Reply-to on the parent confirmation |
| `SITE_URL` | `https://www.your-domain.ca` | Optional. Enables canonical URLs and absolute social-preview images |

## Develop

```bash
npm install
npm run dev        # site only, at http://localhost:4321
npx netlify dev    # site + form function (needs a .env with the variables above)
npm run build      # production build into dist/
```

## Deploy (Netlify)

1. Netlify > Add new site > Import from Git > pick this repo. `netlify.toml` sets the build command (`npm run build`), publish folder (`dist`) and functions folder.
2. Add the environment variables above, then trigger a deploy.
3. In Resend, verify the sending domain (DNS records), or the form will return an error.
4. Point the domain at Netlify.

## Before launch

- [ ] Replace the building photo in the homepage hero (`public/images/photo-building.jpg`). It is a Google Street View screenshot, which Google's terms do not allow on a business website.
- [ ] Have the owner review and finish the privacy policy (`src/pages/privacy.astro`: date, retention period, privacy contact).
- [ ] Confirm the age range. The site says 3 months to 6 years, but the FAQ says 6 months to 6 years.
- [ ] Confirm the "only Reggio-inspired Montessori school in Winnipeg" claim can be substantiated.
- [ ] Get permission from each parent quoted in the testimonials, and from staff for their photos and bios.
- [ ] Have Ms. Natasha approve the Director's note on the About page.
- [ ] Replace stock photos with real photos of the centre where possible.
- [ ] Swap the illustrated map in the green location boxes for a Google Maps embed if wanted.
- [ ] Add the licence statement to the footer if the province requires specific wording.
