import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import {
    clampSize,
    DEFAULT_COLS,
    DEFAULT_ROWS,
    parseResize,
    TERMINAL_SOCKET,
    type TerminalFrame
} from '#lib/terminal';
import { renewIfNeeded } from './api';
import { getConfig } from './config';
import { destroySessionById, getSessionById, SESSION_COOKIE } from './session';

/**
 * The websocket of a terminal. SvelteKit does not handle websockets, so `server.js` (and the development server) hand the
 * `upgrade` requests of the terminal to `handleUpgrade`, which is registered on `globalThis` when this module is loaded.
 *
 * The browser is authenticated by the session cookie and never holds a token. The token of the person goes only to the API, in
 * the `Authorization` header of the second websocket, never in a URL. The frames of the terminal are relayed as they come: they
 * are not read, kept or logged, and neither is anything else about a session.
 */

/** Where the entry points find `handleUpgrade`. */
export const UPGRADE_HANDLER = Symbol.for('phorge.console.upgrade');

/** A frame of the terminal is a keystroke or a screenful: a megabyte is far more than a person produces. */
const MAX_PAYLOAD = 1024 * 1024;
/** The API answers or the terminal is refused. */
const HANDSHAKE_TIMEOUT_MS = 10_000;
/** A browser that does not answer a ping for this long is gone (a laptop that went to sleep, a cable that was pulled). */
const PING_INTERVAL_MS = 30_000;
/** What waits to be written to the browser before the API is told to pause (a `cat` of a large file). */
const HIGH_WATER = 4 * MAX_PAYLOAD;
/** Terminals this server relays at once, whoever opens them: the API limits each person and each tenant. */
const MAX_RELAYS = 200;

const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_PAYLOAD,
    perMessageDeflate: false
});
let relays = 0;

function cookieValue(header: string | undefined, name: string) {
    for (const part of (header ?? '').split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) return rest.join('=');
    }
    return undefined;
}

/**
 * A browser sends the `Origin` of the page that opens a websocket, and a cookie goes with it whatever that page is: the origin
 * must be the console's own, or another site could open a terminal as the person.
 */
function sameOrigin(req: IncomingMessage) {
    const origin = req.headers.origin;
    if (!origin) return false;
    const expected = process.env.ORIGIN;
    if (expected) return origin === expected;
    try {
        return new URL(origin).host === req.headers.host;
    } catch {
        return false;
    }
}

function refuseHttp(socket: Duplex, status: number, text: string) {
    socket.end(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

function send(browser: WebSocket, frame: TerminalFrame) {
    if (browser.readyState === WebSocket.OPEN) browser.send(JSON.stringify(frame));
}

/** Tells the browser why there is no terminal, and ends. */
function refuse(browser: WebSocket, status: number, message: string) {
    send(browser, { type: 'refused', status, message });
    browser.close(1000);
}

/** The sentence of an error of the API (`{"error": {"message"}}`), read from what it answered before the upgrade. */
function readRefusal(response: IncomingMessage): Promise<{ status: number; message: string }> {
    const status = response.statusCode ?? 502;
    const fallback =
        status === 429
            ? 'Too many terminals are open. Close one and try again.'
            : 'The terminal could not be opened.';
    return new Promise((resolve) => {
        const chunks: Buffer[] = [];
        let size = 0;
        const done = () => {
            let message = fallback;
            try {
                const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                if (typeof body?.error?.message === 'string' && body.error.message)
                    message = body.error.message;
            } catch {
                // Not JSON: the fallback says enough.
            }
            resolve({ status, message });
        };
        response.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size <= 8192) chunks.push(chunk);
        });
        response.on('end', done);
        response.on('error', done);
    });
}

/** The address of the terminal on the API, with the size the browser starts with. */
function apiAddress(apiUrl: string, tenant: string, name: string, cols: number, rows: number) {
    const base = apiUrl.replace(/^http/, 'ws');
    return `${base}/v1/tenants/${encodeURIComponent(tenant)}/instances/${encodeURIComponent(name)}/console?cols=${cols}&rows=${rows}`;
}

async function relay(
    browser: WebSocket,
    req: IncomingMessage,
    tenant: string,
    name: string,
    cols: number,
    rows: number
) {
    relays++;
    let api: WebSocket | undefined;
    let ended = false;
    // The browser has been told how it ends (a refusal or a closing): nothing more is said.
    let told = false;
    let alive = true;
    const timer = setInterval(() => {
        if (!alive) return browser.terminate();
        alive = false;
        browser.ping();
    }, PING_INTERVAL_MS);
    browser.on('pong', () => (alive = true));
    browser.on('error', () => {});

    const stop = (status: number, message: string) => {
        if (told) return;
        told = true;
        refuse(browser, status, message);
    };
    const finish = () => {
        if (ended) return;
        ended = true;
        relays--;
        clearInterval(timer);
        // The browser left: Incus ends the shell when the API connection closes. A connection still being made is cut.
        if (api?.readyState === WebSocket.OPEN) api.close(1000);
        else if (api?.readyState === WebSocket.CONNECTING) api.terminate();
    };
    browser.on('close', finish);

    const config = getConfig();
    if (!config) return stop(503, 'The console is not set up to reach the Phorge API.');
    const session = getSessionById(cookieValue(req.headers.cookie, SESSION_COOKIE));
    if (!session) return stop(401, 'Your session has ended. Sign in again.');
    if (!(await renewIfNeeded(session))) {
        destroySessionById(session.id);
        return stop(401, 'Your session has ended. Sign in again.');
    }
    if (ended) return;

    api = new WebSocket(apiAddress(config.apiUrl, tenant, name, cols, rows), {
        headers: { authorization: `Bearer ${session.accessToken}` },
        handshakeTimeout: HANDSHAKE_TIMEOUT_MS,
        maxPayload: MAX_PAYLOAD,
        perMessageDeflate: false,
        // The API answers with a JSON error before the upgrade, never with a redirect.
        followRedirects: false
    });
    const upstream = api;
    let opened = false;
    upstream.on('error', () => {
        // `unexpected-response` carries the API's refusal; any other error is a connection that cannot be made or that broke.
        if (ended || told) return;
        if (!opened) return stop(503, 'The Phorge API cannot be reached. Try again in a moment.');
        told = true;
        send(browser, { type: 'closed', code: 1006, reason: '' });
        browser.close(1000);
    });
    upstream.on('unexpected-response', async (request, response) => {
        const { status, message } = await readRefusal(response);
        request.destroy();
        if (status === 401) {
            // The API refused the token: the same as everywhere else in the console, the person signs in again.
            destroySessionById(session.id);
            return stop(401, 'Your session has ended. Sign in again.');
        }
        stop(status, message);
    });

    upstream.on('open', () => {
        opened = true;
        if (ended) return upstream.close(1000);
        send(browser, { type: 'open' });
    });

    // Typed text goes through as bytes. The only text frame the browser sends is a resize, rebuilt here from its two numbers.
    browser.on('message', (data: RawData, isBinary: boolean) => {
        if (upstream.readyState !== WebSocket.OPEN) return;
        if (isBinary) return upstream.send(data as Buffer, { binary: true });
        const resize = parseResize((data as Buffer).toString('utf8'));
        if (resize) upstream.send(JSON.stringify(resize));
    });

    upstream.on('message', (data: RawData, isBinary: boolean) => {
        if (!isBinary || browser.readyState !== WebSocket.OPEN) return;
        browser.send(data as Buffer, { binary: true });
        // A fast producer must not fill the memory of the console while the browser reads: stop reading until it caught up.
        if (browser.bufferedAmount > HIGH_WATER) {
            upstream.pause();
            const wait = setInterval(() => {
                if (browser.readyState !== WebSocket.OPEN || browser.bufferedAmount === 0) {
                    clearInterval(wait);
                    upstream.resume();
                }
            }, 50);
        }
    });

    upstream.on('close', (code, reason) => {
        if (ended || told) return;
        told = true;
        send(browser, { type: 'closed', code, reason: reason.toString('utf8') });
        browser.close(1000);
    });
}

/** Takes the `upgrade` request of a terminal. Anything else that is not a terminal is closed by the caller. */
export function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    socket.on('error', () => {});
    const url = new URL(req.url ?? '/', 'http://console');
    const match = TERMINAL_SOCKET.exec(url.pathname);
    if (!match || req.method !== 'GET') return refuseHttp(socket, 404, 'Not Found');
    if (!sameOrigin(req)) return refuseHttp(socket, 403, 'Forbidden');
    if (relays >= MAX_RELAYS) return refuseHttp(socket, 503, 'Service Unavailable');

    const cols = clampSize(url.searchParams.get('cols'), DEFAULT_COLS);
    const rows = clampSize(url.searchParams.get('rows'), DEFAULT_ROWS);
    // Everything else is told to the browser in a frame, which a browser can read and an HTTP status it cannot.
    wss.handleUpgrade(req, socket, head, (browser) => {
        void relay(browser, req, match[1], match[2], cols, rows);
    });
}

(globalThis as Record<symbol, unknown>)[UPGRADE_HANDLER] = handleUpgrade;
