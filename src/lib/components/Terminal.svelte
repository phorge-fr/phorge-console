<script lang="ts">
    import '@xterm/xterm/css/xterm.css';
    import LogOut from '@lucide/svelte/icons/log-out';
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
    import Alert from '#lib/components/Alert.svelte';
    import {
        describeClose,
        terminalSocketPath,
        type Ending,
        type TerminalFrame
    } from '#lib/terminal';

    // The shell of a virtual machine, in the page. The browser talks to this console only (a websocket that the session cookie
    // authenticates); the console relays it to the API, so no token reaches this code. See `src/lib/server/terminal.ts`.
    let { tenant, name, back }: { tenant: string; name: string; back: string } = $props();

    type Status = 'connecting' | 'open' | 'ended';

    let status = $state<Status>('connecting');
    let ending = $state<Ending | undefined>();
    let host: HTMLDivElement | undefined = $state();
    // A new attempt (the button "Open it again") restarts the effect below with a fresh terminal.
    let attempt = $state(0);
    let leave: (() => void) | undefined = $state();

    // The terminal is a dark pane in both themes: the ANSI colors of a shell are made for a dark background. The values are the
    // dark ones of `src/lib/styles/tokens.css`.
    const THEME = {
        background: '#14171a',
        foreground: '#d0d5da',
        cursor: '#39b5fb',
        cursorAccent: '#14171a',
        selectionBackground: '#2c333a'
    };
    const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

    $effect(() => {
        void attempt;
        const container = host;
        if (!container) return;
        let cancelled = false;
        let dispose = () => {};

        (async () => {
            // The terminal is loaded only here, so that the other pages do not carry it.
            const [{ Terminal }, { FitAddon }] = await Promise.all([
                import('@xterm/xterm'),
                import('@xterm/addon-fit')
            ]);
            if (cancelled) return;

            status = 'connecting';
            ending = undefined;
            const term = new Terminal({
                cursorBlink: true,
                fontFamily: FONT,
                fontSize: 14,
                scrollback: 5000,
                theme: THEME,
                // A shell wants the keys the page would use (Tab, Escape): the terminal keeps them while it has the focus.
                allowProposedApi: false
            });
            const fit = new FitAddon();
            term.loadAddon(fit);
            term.open(container);
            fit.fit();

            const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
            const socket = new WebSocket(
                `${scheme}://${location.host}${terminalSocketPath(tenant, name)}?cols=${term.cols}&rows=${term.rows}`
            );
            socket.binaryType = 'arraybuffer';
            const encoder = new TextEncoder();
            // The API's own ending (a frame) comes before the connection closes: it is the one shown.
            let told = false;
            let leaving = false;

            const end = (next: typeof ending) => {
                if (told) return;
                told = true;
                status = 'ended';
                ending = next;
                term.options.disableStdin = true;
                term.options.cursorBlink = false;
            };

            socket.onmessage = (event) => {
                if (typeof event.data !== 'string') {
                    term.write(new Uint8Array(event.data as ArrayBuffer));
                    return;
                }
                let frame: TerminalFrame;
                try {
                    frame = JSON.parse(event.data) as TerminalFrame;
                } catch {
                    return;
                }
                if (frame.type === 'open') {
                    status = 'open';
                    term.focus();
                } else if (frame.type === 'refused') {
                    end({ tone: 'danger', message: frame.message });
                } else if (frame.type === 'closed') {
                    end(describeClose(frame.code, frame.reason));
                }
            };
            socket.onclose = () => {
                // No frame came: the connection to the console itself broke.
                if (leaving) end({ tone: 'info', message: 'The session ended.' });
                else
                    end({
                        tone: 'warning',
                        message:
                            status === 'open'
                                ? 'The connection to the terminal was lost.'
                                : 'The terminal could not be reached. Try again in a moment.'
                    });
            };

            // What is typed (and what a program asks the terminal to report) goes as bytes, nothing else.
            term.onData((text) => {
                if (socket.readyState === WebSocket.OPEN && status === 'open')
                    socket.send(encoder.encode(text));
            });
            term.onBinary((text) => {
                if (socket.readyState === WebSocket.OPEN && status === 'open')
                    socket.send(Uint8Array.from(text, (c) => c.charCodeAt(0)));
            });
            term.onResize(({ cols, rows }) => {
                if (socket.readyState === WebSocket.OPEN && status === 'open')
                    socket.send(JSON.stringify({ type: 'resize', cols, rows }));
            });

            let frame = 0;
            const observer = new ResizeObserver(() => {
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(() => {
                    if (container.clientWidth > 0 && container.clientHeight > 0) fit.fit();
                });
            });
            observer.observe(container);

            leave = () => {
                leaving = true;
                if (socket.readyState === WebSocket.OPEN) socket.close(1000);
                else end({ tone: 'info', message: 'The session ended.' });
            };
            dispose = () => {
                leave = undefined;
                leaving = true;
                observer.disconnect();
                cancelAnimationFrame(frame);
                socket.onclose = null;
                socket.onmessage = null;
                socket.close();
                term.dispose();
            };
        })();

        return () => {
            cancelled = true;
            dispose();
        };
    });
</script>

<div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="flex items-center gap-2 text-sm font-semibold" role="status">
            {#if status === 'open'}
                <span class="size-2 rounded-full bg-ok-dot" aria-hidden="true"></span>
                Connected
            {:else if status === 'connecting'}
                <span class="size-2 animate-pulse rounded-full bg-prog-dot" aria-hidden="true"
                ></span>
                Connecting…
            {:else}
                <span class="size-2 rounded-full bg-idle-dot" aria-hidden="true"></span>
                Ended
            {/if}
        </p>
        {#if status === 'ended'}
            <div class="flex gap-2">
                <button type="button" class="btn-primary" onclick={() => attempt++}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Open it again
                </button>
                <a href={back} class="btn-secondary">Back to the instance</a>
            </div>
        {:else}
            <button type="button" class="btn-secondary" onclick={() => leave?.()} disabled={!leave}>
                <LogOut size={14} aria-hidden="true" />
                Close the terminal
            </button>
        {/if}
    </div>

    {#if ending}
        <Alert
            tone={ending.tone}
            title={ending.tone === 'info' ? undefined : 'The terminal is closed'}
        >
            {ending.message}
        </Alert>
    {/if}

    <div
        class="overflow-hidden rounded-lg border border-line p-3"
        style:background={THEME.background}
    >
        <div
            bind:this={host}
            class="h-[min(32rem,calc(100dvh-22rem))] min-h-64 w-full"
            role="group"
            aria-label="Terminal of {name}"
        ></div>
    </div>
    <p class="help">
        The keyboard goes to the terminal while it has the focus, Tab included: use the button above
        to leave it. The terminal needs an image that has the Incus agent, such as the images of the
        cloud variant.
    </p>
</div>
