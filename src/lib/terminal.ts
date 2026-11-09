/**
 * What the browser and the console server share about the terminal of an instance. This file imports nothing of the app (the
 * development server and the Vite configuration load it too) and nothing that only exists on the server.
 *
 * The browser never talks to the API. It opens a websocket to the console (`/t/<tenant>/instances/<name>/terminal/socket`),
 * authenticated by the session cookie; the console opens a second one to the API with the token of the person and relays the
 * frames. The API's own rules are in `docs/reference/terminal.md` of phorge-fr/phorge-api.
 */

/** The address of the websocket of a terminal. Capture 1 is the tenant, capture 2 the instance. */
export const TERMINAL_SOCKET =
    /^\/t\/([a-z][a-z0-9-]{1,27})\/instances\/([a-z](?:[a-z0-9-]{0,61}[a-z0-9])?)\/terminal\/socket$/;

export const terminalSocketPath = (tenant: string, name: string) =>
    `/t/${encodeURIComponent(tenant)}/instances/${encodeURIComponent(name)}/terminal/socket`;

/** The size of a window, in characters, that the API accepts. */
export const MIN_SIZE = 1;
export const MAX_SIZE = 1000;
export const DEFAULT_COLS = 80;
export const DEFAULT_ROWS = 24;

/** A size inside what the API accepts, or the fallback when the value is not a whole number. */
export function clampSize(value: unknown, fallback: number) {
    const n = typeof value === 'string' && /^\d{1,6}$/.test(value) ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isInteger(n)) return fallback;
    return Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));
}

/**
 * What the console says to the browser, as JSON in text frames. The bytes of the terminal travel in binary frames, in both
 * directions, and nothing reads them.
 *
 * - `open`: the API accepted the terminal, typing can start.
 * - `refused`: the API refused before the terminal opened (`status` is its HTTP status, `message` its own sentence).
 * - `closed`: the API ended the session (`code` and `reason` are what it closed with).
 */
export type TerminalFrame =
    | { type: 'open' }
    | { type: 'refused'; status: number; message: string }
    | { type: 'closed'; code: number; reason: string };

/** What the browser sends to resize the window, as a text frame. */
export type ResizeFrame = { type: 'resize'; cols: number; rows: number };

/** The resize in a text frame from the browser, or undefined for anything else (it is ignored, never relayed as it came). */
export function parseResize(text: string): ResizeFrame | undefined {
    let value: unknown;
    try {
        value = JSON.parse(text);
    } catch {
        return undefined;
    }
    if (typeof value !== 'object' || value === null) return undefined;
    const { type, cols, rows } = value as Record<string, unknown>;
    if (type !== 'resize') return undefined;
    for (const side of [cols, rows])
        if (!Number.isInteger(side) || (side as number) < MIN_SIZE || (side as number) > MAX_SIZE)
            return undefined;
    return { type: 'resize', cols: cols as number, rows: rows as number };
}

/**
 * The words for the end of a session. The API closes with a code and a sentence for the person: the sentence is shown when there
 * is one, and these are the sentences for when it is not (a connection that broke carries none).
 */
const ENDINGS: Record<number, string> = {
    1000: 'The session ended.',
    4001: 'The terminal was closed because nothing was typed or shown for too long.',
    4002: 'The terminal was closed because it was open for the longest time allowed.',
    4003: 'The terminal was closed because you no longer have the right to use it on this tenant.',
    4004: 'The terminal was closed because the instance is no longer running.',
    4005: 'The terminal was closed because the platform could not check your rights.',
    4006: 'The terminal was closed because the platform is restarting.'
};

export type Ending = { tone: 'info' | 'warning' | 'danger'; message: string };

export function describeClose(code: number, reason: string): Ending {
    const message = reason.trim() || ENDINGS[code] || 'The connection to the terminal was lost.';
    return { tone: code === 1000 ? 'info' : 'warning', message };
}
