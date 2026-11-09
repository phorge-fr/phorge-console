// The entry point of the console in production: the server SvelteKit's node adapter builds, with the websocket of the terminal.
//
// SvelteKit handles requests, not websockets. The adapter exposes its HTTP server, and the `upgrade` requests of a terminal
// are handed to the handler that `src/lib/server/terminal.ts` registers when the application loads (its `hooks.server.ts`
// imports it). Any other upgrade is refused: the console has no other websocket.
import { server } from './build/index.js';

const UPGRADE_HANDLER = Symbol.for('phorge.console.upgrade');

server.on('upgrade', (req, socket, head) => {
    const handle = globalThis[UPGRADE_HANDLER];
    if (typeof handle !== 'function') {
        socket.end(
            'HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'
        );
        return;
    }
    handle(req, socket, head);
});
