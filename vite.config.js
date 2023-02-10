import * as path from 'path'
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: path.join(__dirname, "docs"),
    },
    resolve: {
        alias: {
            "platform": path.resolve(__dirname, 'src/platform-browser.ts'),
        }
    }
});
