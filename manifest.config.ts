import type { ManifestV3Export } from '@crxjs/vite-plugin'

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'Bookmarkr AI',
  version: '0.1.0',
  description:
    'AI assisted bookmark organization for professionals, creators, and builders.',
  action: {
    default_title: 'Bookmarkr AI',
    default_popup: 'index.html',
  },
  permissions: ['bookmarks', 'storage'],
  host_permissions: ['https://*/*', 'http://*/*'],
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg'],
      matches: ['<all_urls>'],
    },
  ],
}

export default manifest
