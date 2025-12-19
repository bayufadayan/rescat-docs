import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'ResCAT Docs',
  tagline: 'Scan, Kenali, dan Sayangi Kucing Anda',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.rescat.life',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'rescat', // Usually your GitHub org/user name.
  projectName: 'rescat-docs', // Usually your repo name.

  onBrokenLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/rescat-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ResCAT',
      logo: {
        alt: 'ResCAT Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          label: 'Services',
          position: 'left',
          items: [
            {
              label: 'Main App',
              href: 'https://app.rescat.life',
            },
            {
              label: 'ML Service',
              href: 'https://ml.rescat.life',
            },
            {
              label: 'Storage Service',
              href: 'https://storage.rescat.life',
            },
          ],
        },
        {
          href: 'https://rescat.life',
          label: 'Website',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture',
            },
            {
              label: 'API Reference',
              to: '/docs/api/overview',
            },
          ],
        },
        {
          title: 'Services',
          items: [
            {
              label: 'Main Application',
              href: 'https://app.rescat.life',
            },
            {
              label: 'ML Service',
              href: 'https://ml.rescat.life',
            },
            {
              label: 'Storage Service',
              href: 'https://storage.rescat.life',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Landing Page',
              href: 'https://rescat.life',
            },
            {
              label: 'GitHub - Storage',
              href: 'https://github.com/bayufadayan/rescat-storage',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ResCAT - Scan, Kenali, dan Sayangi Kucing Anda. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
