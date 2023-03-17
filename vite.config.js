import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { visualizer } from "rollup-plugin-visualizer";
import importToCDN from "vite-plugin-cdn-import";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer(),
    importToCDN({
      modules: [
        {
          name: "vue",
          var: "Vue",
          path: "https://unpkg.com/vue@3.2.47/dist/vue.global.js",
        },
        {
          name: "element-plus",
          var: "ElementPlus",
          path: "https://unpkg.com/element-plus@2.3.0/dist/index.full.js",
        },
        {
          name: "vue-router",
          var: "VueRouter",
          path: "https://unpkg.com/vue-router@4.1.6/dist/vue-router.global.js",
        },
        {
          name: "axios",
          var: "axios",
          path: "https://unpkg.com/axios@1.3.4/dist/axios.min.js",
        },
        {
          name: "js-cookie",
          var: "Cookies",
          path: "https://unpkg.com/js-cookie@3.0.1/dist/js.cookie.min.js",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
