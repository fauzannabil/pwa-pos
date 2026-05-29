import { defineConfig }
from 'vite';

import react
from '@vitejs/plugin-react';

import { VitePWA }
from 'vite-plugin-pwa';

export default defineConfig({

  plugins: [

    react(),

    VitePWA({

      registerType:
        'autoUpdate',

      includeAssets: [

        'favicon.svg',

      ],

      manifest: {

        name:
          'UNTAN POS',

        short_name:
          'POS',

        theme_color:
          '#ffffff',

        background_color:
          '#ffffff',

        display:
          'standalone',

        scope: '/',

        start_url: '/',

        icons: [

          {

            src: '/pwa-192.png',

            sizes: '192x192',

            type: 'image/png',

          },

          {

            src: '/pwa-512.png',

            sizes: '512x512',

            type: 'image/png',

          },

        ],

      },

     workbox: {

        globPatterns: [

          '**/*.{js,css,html,png,svg,ico}'

        ],

        runtimeCaching: [

          /*
          |--------------------------------
          | Product Images
          |--------------------------------
          */

          {

            urlPattern:
              ({ url }) => {

                return url.pathname.startsWith(
                  '/storage/products/'
                );

              },

            handler:
              'CacheFirst',

            options: {

              cacheName:
                'product-images',

              expiration: {

                maxEntries:
                  200,

                maxAgeSeconds:
                  60 * 60 * 24 * 30,

              },

              cacheableResponse: {

                statuses: [0, 200],

              },

            },

          },

          /*
          |--------------------------------
          | API Cache
          |--------------------------------
          */

          {

            urlPattern:
              ({ url }) => {

                return url.pathname.startsWith(
                  '/api/'
                );

              },

            handler:
              'NetworkFirst',

            options: {

              cacheName:
                'api-cache',

              networkTimeoutSeconds:
                5,

              expiration: {

                maxEntries:
                  100,

                maxAgeSeconds:
                  60 * 60 * 24,

              },

              cacheableResponse: {

                statuses: [0, 200],

              },

            },

          },

        ],

      },

    }),

  ],

});