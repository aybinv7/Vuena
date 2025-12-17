import { defineConfig } from "vite";
import path from "path";

import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import vueDevTools from "vite-plugin-vue-devtools";

import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import Imagemin from "unplugin-imagemin/vite";
import TurboConsole from "unplugin-turbo-console/vite";

import {
  Framework7VueResolver,
  getFramework7AutoImports,
} from "./src/shared/utils/resolvers/resolvers";

const SRC_DIR = path.resolve(__dirname, "./src");
const SRC_LOCALES = path.resolve(__dirname, "./src/locales/**");

export default defineConfig({
  optimizeDeps: {
    exclude: ["@journeyapps/wa-sqlite", "@powersync/web"],
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes("swiper-"),
        },
      },
    }),
    vueDevTools(),

    tailwindcss(),

    TurboConsole({
      launchEditor: {
        specifiedEditor: "antigravity",
      },
    }),
    Icons({
      autoInstall: true,
      compiler: "vue3",
    }),
    VueI18nPlugin({
      include: SRC_LOCALES,
    }),
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],

      imports: [
        "vue",
        "pinia",
        "vue-router",
        "@vueuse/core",
        "vue-i18n",

        getFramework7AutoImports(),
      ],

      dirs: ["src/**"],

      dts: "auto-imports.d.ts",
      vueTemplate: true,
      viteOptimizeDeps: true,
      injectAtEnd: true,
      dirsScanOptions: { types: true },

      dumpUnimportItems: "./auto-imports.json",
      biomelintrc: {
        enabled: true,
        filepath: "./.biomelintrc-auto-import.json",
      },
    }),
    Components({
      dts: "components.d.ts",
      dirs: [
        "src/components/**",
        "src/views/**/**",
        "src/modules/**/views/**/**/**",
        "src/modules/**/components/**/**/**",
      ],
      extensions: ["vue", "ts", "tsx"],
      deep: true,

      resolvers: [
        Framework7VueResolver(),
        IconsResolver({
          prefix: "i",
          alias: {
            mt: "material-symbols",
            f7: "framework7",
          },
          enabledCollections: ["material", "framework7", "lucide"],
        }),
      ],
    }),
    Imagemin({
      cache: true,
      compress: {
        jpg: {
          quality: 80,
          progressive: true,
        },
        jpeg: {
          quality: 80,
          progressive: true,
        },
        png: {
          quality: 0.8,
        },
        webp: {
          quality: 80,
        },
      },
    }),
  ],

  base: "",
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: "vue-ecosystem",
              test: /[\\/]node_modules[\\/](vue|pinia|vue-router|@vueuse)[\\/]/,
            },
            {
              name: "f7-core",
              test: /[\\/]node_modules[\\/]framework7[\\/](lite|shared|utils)/,
            },
            {
              name: "f7-vue",
              test: /[\\/]node_modules[\\/]framework7-vue[\\/]/,
            },
            {
              name: "f7-heavy",
              test: /[\\/]node_modules[\\/]framework7[\\/](components[\\/](calendar|color-picker|photo-browser|autocomplete)|modules[\\/](keyboard|mousewheel))/,
            },
            {
              name: "styles",
              test: /[\\/]node_modules[\\/](tailwind|@tailwindcss|vue-i18n)[\\/]/,
            },
            {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
            },
            {
              name: "shared",
              test: /[\\/]src[\\/]shared[\\/]/,
            },
            {
              name: "app-modules",
              test: /[\\/]src[\\/]modules[\\/]/,
              maxSize: 50 * 1024,
            },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    commonjsOptions: { include: [/node_modules/] },
  },

  resolve: {
    alias: {
      "@": SRC_DIR,
      "@modules": "./src/modules",
      "@shared": "./src/shared",
    },
  },
});
