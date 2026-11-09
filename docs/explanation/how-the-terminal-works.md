---
type: explanation
audience: developer or reviewer who needs to know how the terminal of an instance reaches the browser, and why it is built this way
verified: 2026-11-08
---

# How the terminal works

A person opens a shell on a running instance from the console. The shell is the exec of Incus, which the Phorge API relays with the identity of the person; the API's side is in [terminal](https://github.com/phorge-fr/phorge-api/blob/main/docs/reference/terminal.md) and [open a terminal from the console](https://github.com/phorge-fr/phorge-api/blob/main/docs/how-to/open-a-terminal-from-the-console.md). This page says what the console does with it.

## Two websockets, one relay

```text
browser  ──ws, session cookie──▶  console server  ──ws, Authorization: Bearer──▶  Phorge API  ──▶  Incus
```

- The browser opens `/t/<tenant>/instances/<name>/terminal/socket` on the console. It is authenticated by the session cookie, like any page.
- The console server opens `GET /v1/tenants/<tenant>/instances/<name>/console?cols=N&rows=M` on the API, with the token of the person in the `Authorization` header, and relays the frames in both directions.

The browser never holds a token and no token is ever in a URL: the rule of the console (see [how the console signs people in](how-the-console-signs-people-in.md)) holds for the terminal too.

## What is carried

- **Binary frames** carry the bytes of the terminal, what is typed and what is shown. The console does not read them, keep them or log them, and nothing else about a session is logged.
- **Text frames from the browser** are the resize of the window, `{"type":"resize","cols":N,"rows":M}`, from 1 to 1000. The console rebuilds the frame from its two numbers and drops anything else.
- **Text frames from the console** tell the browser how things stand, in JSON: `open` (the API accepted the terminal, typing can start), `refused` (the API refused before the upgrade: its HTTP status and its own sentence) and `closed` (the API ended the session: its close code and sentence). A browser cannot read the status of a refused websocket, so the console accepts the browser's connection first and says it in a frame.

The sentences are the API's. The console only has its own for a connection that broke, which carries none.

## Why a server entry

SvelteKit handles requests, not websockets. The node adapter exposes its HTTP server, so `server.js` is the entry point of the production image: it starts that server and hands the `upgrade` requests to the handler that `src/lib/server/terminal.ts` registers when the application loads. In development, a Vite plugin does the same. `pnpm start` runs `server.js`; `pnpm preview` does not serve the terminal.

## What protects it

- **The origin is checked.** A cookie goes with a websocket whatever page opens it, so the `Origin` of the handshake must be the console's own (the `ORIGIN` variable of the adapter when it is set, the `Host` header otherwise). Another site cannot open a terminal as the person.
- **The API decides.** The button only shows on a running instance, and the page does not connect to another one, but these are comforts. The right to open a terminal, the limits of terminals per person and per tenant, the idle and maximum durations and the check that the right still holds are the API's.
- **Bounded.** A frame is at most 1 MiB, the console relays at most 200 terminals at once, a browser that stops answering pings is dropped, and a producer faster than the browser is paused until the browser catches up.
- **Nothing lingers.** When the browser leaves, the console closes the API connection and Incus ends the shell.

## What it does not do

- A session is not resumed: reloading the page opens a new shell.
- It needs an image with the Incus agent, such as the images of the cloud variant.
- The sessions of the console live in its memory, so a restart of the console ends every terminal; the browser then shows that the connection was lost.
