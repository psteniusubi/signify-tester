import * as path from 'path'
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            "platform": path.resolve(__dirname, 'src/platform-browser.ts'),
        }
    }
});
