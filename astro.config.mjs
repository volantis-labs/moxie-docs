import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import links from './src/data/links.json' with { type: 'json' };

// A sidebar group: English label, translated labels, page slugs in order.
const group = (label, de, fr, nl, items) => ({ label, translations: { de, fr, nl }, items });

export default defineConfig({
  site: 'https://volantislabs.dev',
  base: '/moxie/docs',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Moxie Docs',
      logo: { src: './src/assets/moxie.svg', alt: '' },
      favicon: '/favicon.png',
      defaultLocale: 'root',
      locales: {
        root: { label: '🇬🇧 English', lang: 'en' },
        de: { label: '🇩🇪 Deutsch' },
        fr: { label: '🇫🇷 Français' },
        nl: { label: '🇳🇱 Nederlands' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: links.github }],
      editLink: { baseUrl: 'https://github.com/volantis-labs/moxie-docs/edit/main/' },
      customCss: ['./src/styles/custom.css'],
      components: { Footer: './src/components/Footer.astro' },
      // Add each group when its pages exist. Order: Get started, Record, Notes, Editor,
      // Find and ask, Your data, Agents, Reference, Help.
      sidebar: [group('Get started', 'Erste Schritte', 'Premiers pas', 'Aan de slag', ['index'])],
      plugins: [starlightLinksValidator({ errorOnFallbackPages: false })],
    }),
  ],
});
