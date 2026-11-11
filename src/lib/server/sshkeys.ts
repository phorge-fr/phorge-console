import { createHash } from 'node:crypto';

export type KeyLabel = {
    /** `ssh-ed25519`, `ssh-rsa`... */
    type: string;
    /** `SHA256:...`, as `ssh-keygen -l` writes it: enough to tell the keys apart without printing them whole. */
    fingerprint: string;
    /** The comment of the line, when there is one. */
    comment?: string;
};

/** A key of `authorized_keys` as a person recognises it. The API checked its shape; an odd one still gets a label, never an error. */
export function labelKey(line: string): KeyLabel {
    const [type = '', blob = '', ...comment] = line.trim().split(/\s+/);
    const digest = createHash('sha256').update(Buffer.from(blob, 'base64')).digest('base64');
    return {
        type,
        fingerprint: `SHA256:${digest.replace(/=+$/, '')}`,
        ...(comment.length ? { comment: comment.join(' ') } : {})
    };
}
