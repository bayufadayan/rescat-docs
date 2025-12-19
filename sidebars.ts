import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * ResCAT Documentation Sidebars
 * 
 * Two main sidebars:
 * - docsSidebar: Main documentation and guides
 * - apiSidebar: API reference documentation
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  docsSidebar: [
    'intro',
    'architecture',
    {
      type: 'category',
      label: 'Services',
      items: [
        'services/main-app',
        'services/ml-service',
        'services/storage-service',
      ],
    },
  ],

  // API Reference sidebar
  apiSidebar: [
    'api/overview',
    {
      type: 'category',
      label: 'API References',
      items: [
        'api/ml-service',
        'api/storage-service',
      ],
    },
  ],
};

export default sidebars;
