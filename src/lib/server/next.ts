/** Where the person lands after signing in when nothing else was asked. */
export const DEFAULT_NEXT = '/';

/**
 * The page to come back to after signing in. Only a path of this site is accepted, never an address:
 * `//host` and `/\host` are read by browsers as another site.
 */
export function safeNext(raw: string | null): string {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\'))
        return DEFAULT_NEXT;
    if (raw.startsWith('/login') || raw.startsWith('/oidc') || raw.startsWith('/logout'))
        return DEFAULT_NEXT;
    return raw;
}
