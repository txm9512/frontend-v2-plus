import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue({
        template: {
            compilerOptions: {
                // 将所有带短横线的标签名都视为自定义元素
                isCustomElement: (tag) => tag.includes('-')
            }
        }
    })],
    server: {
        host: '0.0.0.0'
    },
    build: {
        target: "es2015",
        cssTarget: "chrome61",
        rollupOptions: {},
    },
})

