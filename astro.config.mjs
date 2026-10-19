// @ts-check
import { defineConfig } from 'astro/config';

// Set SITE_URL in the host's environment once the domain is live
// (e.g. https://www.riverheightsmontessori.ca) for canonical URLs and social previews.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
});
