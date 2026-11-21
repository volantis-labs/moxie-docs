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
      sidebar: [
        group('Get started', 'Erste Schritte', 'Premiers pas', 'Aan de slag', [
          'index',
          'get-started/install',
          'get-started/requirements',
          'get-started/sign-in',
          'get-started/permissions',
          'get-started/first-meeting',
        ]),
        group('Record', 'Aufnehmen', 'Enregistrer', 'Opnemen', [
          'record/start-stop',
          'record/recording-control',
          'record/in-person',
          'record/google-meet',
          'record/participant-notice',
        ]),
        group('Notes', 'Notizen', 'Notes', 'Notities', [
          'notes/transcript',
          'notes/speakers',
          'notes/enhanced-notes',
          'notes/people',
          'notes/folders-trash',
        ]),
        group('Editor', 'Editor', 'Éditeur', 'Editor', [
          'editor/formatting',
          'editor/slash-menu',
          'editor/lists',
          'editor/links',
          'editor/mentions',
          'editor/find-replace',
          'editor/tables',
          'editor/images',
          'editor/paste',
          'editor/citations',
        ]),
        group('Find and ask', 'Suchen und fragen', 'Rechercher et demander', 'Zoeken en vragen', ['find/search', 'find/chat']),
        group('Your data', 'Ihre Daten', 'Vos données', 'Uw gegevens', [
          'data/export',
          'data/backup',
          'data/privacy',
          'data/diagnostics',
        ]),
        group('Agents', 'Agenten', 'Agents', 'Agents', ['agents/access', 'agents/cli', 'agents/mcp']),
        group('Reference', 'Referenz', 'Référence', 'Referentie', ['reference/settings', 'reference/shortcuts']),
        group('Help', 'Hilfe', 'Aide', 'Hulp', ['help/troubleshooting', 'help/report-problem', 'help/updates']),
      ],
      plugins: [starlightLinksValidator({ errorOnFallbackPages: false, errorOnInconsistentLocale: true })],
    }),
  ],
});
