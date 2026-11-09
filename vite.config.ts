import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import extractorSvelte from '@unocss/extractor-svelte';
import UnoCSS from 'unocss/vite';
import { defineConfig, type Plugin } from 'vite';
import { TERMINAL_SOCKET } from './src/lib/terminal';

// The websocket of the terminal in development. SvelteKit does not handle websockets: `server.js` does it in production, and
// this does it for `vite dev`. Only the address of a terminal is taken, so the websocket of the hot reload is left alone.
const terminalSocket = (): Plugin => ({
    name: 'phorge-terminal-socket',
    configureServer(server) {
        server.httpServer?.on('upgrade', async (req, socket, head) => {
            if (!TERMINAL_SOCKET.test(new URL(req.url ?? '/', 'http://console').pathname)) return;
            const { handleUpgrade } = await server.ssrLoadModule('/src/lib/server/terminal.ts');
            handleUpgrade(req, socket, head);
        });
    }
});

// SvelteKit 3 reads its configuration here: there is no svelte.config.js.
export default defineConfig({
    plugins: [
        UnoCSS({ extractors: [extractorSvelte()] }),
        sveltekit({ adapter: adapter() }),
        terminalSocket()
    ]
});
