import { defineConfig } from "vite";
import path from "path";

import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import vueDevTools from "vite-plugin-vue-devtools";

import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
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
    exclude: ["jeep-sqlite/loader"],
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes("swiper-"),
        },
      },
    }),

    tailwindcss(),

    vueDevTools({}),
    TurboConsole(),
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

      dirs: ["src/**/**/**/**/**/**/**/**/**/**/**/**"],

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

      resolvers: [Framework7VueResolver()],
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
    rollupOptions: {
      output: {},
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
