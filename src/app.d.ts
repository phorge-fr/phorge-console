// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Session } from '#lib/server/session';

declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            /** The signed-in session, set by hooks.server.ts. Tokens never leave the server. */
            session?: Session;
        }
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
